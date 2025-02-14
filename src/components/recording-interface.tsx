'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/firebase/auth-context";
import { addResponseToQuestion, deleteResponse } from "@/lib/data-service-client";
import { RECORDING } from "@/constants/recording";
import { Mic, Square, Loader2, ChevronLeft, ChevronRight, Trash2, Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAutoAdvance } from "@/hooks/use-auto-advance";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExportView } from "@/components/export-view";
import { generateDraft } from "@/lib/draft-service";
import type { GenerationParams } from '@/types';
import { cn } from "@/lib/utils";

enum RecordingState {
  IDLE = "IDLE",
  RECORDING = "RECORDING",
  PROCESSING = "PROCESSING",
}

/** Safari detection helper. */
function isSafari() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("safari") && !ua.includes("chrome");
}

/** Track if the WAV encoder has been registered. */
let isEncoderRegistered = false;

/** Initialize a MediaRecorder with WAV support. */
async function initMediaRecorder(stream: MediaStream): Promise<MediaRecorder | null> {
  if (typeof window === "undefined") return null;

  try {
    // Safari fallback
    if (isSafari()) {
      return new window.MediaRecorder(stream);
    }

    // Try standard formats first
    if (typeof window.MediaRecorder !== "undefined") {
      const formats = ["audio/webm", "audio/webm;codecs=opus", "audio/ogg;codecs=opus"];
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          return new MediaRecorder(stream, { mimeType: format });
        }
      }
    }

    // Fallback to extendable-media-recorder with WAV
    const [{ MediaRecorder: ExtMediaRecorder }, { connect }] = await Promise.all([
      import("extendable-media-recorder"),
      import("extendable-media-recorder-wav-encoder"),
    ]);

    if (!isEncoderRegistered) {
      await connect();
      isEncoderRegistered = true;
    }

    // Cast to MediaRecorder since the API is compatible
    return new ExtMediaRecorder(stream, { mimeType: "audio/wav" }) as unknown as MediaRecorder;
  } catch (e) {
    console.error("Failed to initialize MediaRecorder:", e);
    throw new Error("Failed to initialize recording. Please try using Chrome or Safari.");
  }
}

interface RecordingInterfaceProps {
  sessionId: string;
  currentQuestion: {
    id: string;
    text: string;
    responses: Array<{
      id: string;
      transcription: string;
      createdAt: Date;
    }>;
  };
  currentQuestionIndex: number;
  onPrevious?: () => void;
  onNext?: () => void;
  isFirstQuestion?: boolean;
  isLastQuestion?: boolean;
  allQuestions: Array<{
    id: string;
    text: string;
    responses: Array<{
      id: string;
      transcription: string;
      createdAt: Date;
    }>;
  }>;
}

export function RecordingInterface({
  sessionId,
  currentQuestion,
  currentQuestionIndex,
  onPrevious,
  onNext,
  isFirstQuestion = false,
  isLastQuestion = false,
  allQuestions,
}: RecordingInterfaceProps) {
  const { user } = useAuth();
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoAdvance, setAutoAdvance] = useAutoAdvance();
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [isDeletingResponse, setIsDeletingResponse] = useState<string | null>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // MediaRecorder references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Misc refs
  const isStoppingRef = useRef(false);

  /** Start the recording. */
  const startRecording = useCallback(async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to record.",
        variant: "destructive",
      });
      return;
    }

    setIsWarmingUp(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Set up audio analyzer
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Audio level monitoring
      const analyzeAudio = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        setAudioLevel(Math.min((average / 255) * 1.5, 1));
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };
      analyzeAudio();

      // Initialize MediaRecorder
      const recorder = await initMediaRecorder(stream);
      if (!recorder) throw new Error("Failed to initialize MediaRecorder");

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isStoppingRef.current = false;

      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          // If auto-advance is enabled and we're not on the last question,
          // advance to the next question before processing the transcription
          if (autoAdvance && !isLastQuestion && onNext) {
            onNext();
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          await addResponseToQuestion({
            userId: user.uid,
            sessionId,
            questionId: currentQuestion.id,
            blob: audioBlob,
          });

          setRecordingState(RecordingState.IDLE);

          // Only show the success toast if we're not auto-advancing
          if (!autoAdvance || isLastQuestion) {
            toast({
              title: "Success",
              description: "Response recorded successfully!",
              variant: "default",
            });
          }
        } catch (error) {
          console.error("Error saving recording:", error);
          toast({
            title: "Error",
            description: "Failed to save recording. Please try again.",
            variant: "destructive",
          });
          setRecordingState(RecordingState.IDLE);
        }
      };

      mediaRecorderRef.current.start(1000);
      setRecordingState(RecordingState.RECORDING);

      setTimeout(() => {
        setIsWarmingUp(false);
      }, 1000);
    } catch (error) {
      setIsWarmingUp(false);
      console.error("Error in startRecording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  }, [user, sessionId, currentQuestion.id, isLastQuestion, onNext, autoAdvance]);

  /** Stop the recording. */
  const stopRecording = useCallback(() => {
    if (isStoppingRef.current) return;
    if (!mediaRecorderRef.current || recordingState !== RecordingState.RECORDING) return;

    // Clean up analyzer
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    setAudioLevel(0);

    setRecordingState(RecordingState.PROCESSING);
    isStoppingRef.current = true;

    setTimeout(() => {
      try {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      } catch {
        // Ignore errors during cleanup
      }
    }, 1000);
  }, [recordingState]);

  /** Cleanup on unmount. */
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore errors during cleanup
        }
        mediaRecorderRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  /** Countdown timer while recording. */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (recordingState === RecordingState.RECORDING) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev <= 1) {
            stopRecording();
            return RECORDING.MAX_DURATION_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setRecordingTime(RECORDING.MAX_DURATION_SECONDS);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState, stopRecording]);

  /** Spacebar shortcut to start/stop recording. */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to toggle recording
      if (e.code === 'Space' && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (recordingState === RecordingState.IDLE) {
          startRecording();
        } else if (recordingState === RecordingState.RECORDING) {
          stopRecording();
        }
      }

      // Left arrow for previous question
      if (e.code === 'ArrowLeft' && !isFirstQuestion && onPrevious) {
        e.preventDefault();
        onPrevious();
      }

      // Right arrow for next question
      if (e.code === 'ArrowRight' && !isLastQuestion && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingState, startRecording, stopRecording, isFirstQuestion, isLastQuestion, onPrevious, onNext]);

  const handleDeleteResponse = async (responseId: string) => {
    if (!user) return;

    try {
      setIsDeletingResponse(responseId);
      await deleteResponse({
        userId: user.uid,
        sessionId,
        questionId: currentQuestion.id,
        responseId,
      });
      toast({
        description: "Response deleted successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error deleting response:", error);
      toast({
        title: "Error",
        description: "Failed to delete response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingResponse(null);
    }
  };

  const handleDownload = () => {
    const text = allQuestions.map(q => {
      const response = q.responses[0]; // Get the most recent response
      return `Q: ${q.text}\nA: ${response?.transcription || 'No response'}\n`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateDraft = async (params: GenerationParams) => {
    try {
      setIsGeneratingDraft(true);
      
      // Prepare responses for generation
      const responses = allQuestions.map(q => ({
        questionText: q.text,
        transcription: q.responses[0]?.transcription || 'No response',
      }));

      const { content } = await generateDraft({
        ...params,
        responses,
      });

      setGeneratedContent(content);
      toast({
        description: "Draft generated successfully!",
      });
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate draft",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Show export view if we're on the last question and have at least one response
  const shouldShowExport = isSessionComplete && allQuestions.some(q => q.responses.length > 0);

  if (shouldShowExport) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setIsSessionComplete(false)}
            className={cn(
              "gap-3",
              "border-2"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Return to Questions</span>
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-medium">Session Complete!</h3>
          <p className="text-sm text-muted-foreground">
            Here are all your responses. You can copy them to your clipboard, download them as a text file, generate an AI-written draft, or return to any question to make changes.
          </p>
        </div>

        <ExportView
          responses={allQuestions.map(q => ({
            questionText: q.text,
            transcription: q.responses[0]?.transcription || 'No response',
          }))}
          onGenerateDraft={handleGenerateDraft}
          isGenerating={isGeneratingDraft}
          generatedContent={generatedContent}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-8 mb-32 rounded-lg relative bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-2 border-transparent [background-clip:padding-box] before:absolute before:inset-0 before:-z-10 before:m-[-2px] before:rounded-lg before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-pink-500 transition-opacity duration-300">

      {/* Auto Advance Toggle */}
      <div className="w-full flex items-center justify-end space-x-2">
        <Label htmlFor="auto-advance" className="text-sm text-muted-foreground">
          Auto-advance after recording
        </Label>
        <Switch
          id="auto-advance"
          checked={autoAdvance}
          onCheckedChange={setAutoAdvance}
        />
      </div>

      {/* Question Display */}
      <div className="w-full text-center space-y-2 transition-all duration-300 transform">
        <h3 className="text-xl font-medium">{currentQuestion.text}</h3>
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        {recordingState === RecordingState.RECORDING && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {isWarmingUp ? (
                <div className="absolute inset-[-32px] rounded-full bg-yellow-900/30 animate-pulse" />
              ) : (
                <>
                  <div
                    className="absolute inset-0 rounded-full bg-red-900/30 transition-transform duration-100"
                    style={{ transform: `scale(${0.95 + audioLevel * 0.4})` }}
                  />
                  <div
                    className="absolute inset-[-16px] rounded-full bg-red-900/20 transition-transform duration-100"
                    style={{ transform: `scale(${0.95 + audioLevel * 0.6})` }}
                  />
                  <div
                    className="absolute inset-[-32px] rounded-full bg-red-900/10 transition-transform duration-100"
                    style={{ transform: `scale(${0.95 + audioLevel * 0.8})` }}
                  />
                </>
              )}
              <button
                onClick={stopRecording}
                className="p-6 rounded-full bg-red-900/50 hover:bg-red-900/70 transition-colors animate-pulse relative z-10 select-none"
              >
                <Square className="w-12 h-12 text-red-400" />
              </button>
            </div>
            <div className="text-sm text-zinc-400 h-4">
              {isWarmingUp
                ? "Warming up..."
                : recordingTime <= RECORDING.COUNTDOWN_THRESHOLD_SECONDS
                  ? `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, "0")} left - Press space to stop`
                  : "Press space to stop recording"}
            </div>
          </div>
        )}

        {recordingState === RecordingState.PROCESSING && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-blue-900/30 animate-pulse" />
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin relative" />
            </div>
            <p className="text-sm text-zinc-400 italic">Processing recording...</p>
          </div>
        )}

        {recordingState === RecordingState.IDLE && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-center text-zinc-400">
              Press spacebar to start/stop recording
              <br />
              or click the button below
            </p>
            <Button
              onClick={startRecording}
              className="relative w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-900/50 text-red-300 hover:bg-red-900/70 transition-all select-none"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </Button>
          </div>
        )}
      </div>

      {/* Past Responses */}
      {currentQuestion.responses.length > 0 && (
        <div className="w-full space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {currentQuestion.responses.length} response{currentQuestion.responses.length !== 1 ? 's' : ''} recorded
          </p>
          <div className="space-y-2">
            {currentQuestion.responses.map((response) => (
              <div
                key={response.id}
                className="p-4 rounded-lg bg-muted/50 text-left relative group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {new Date(response.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm">{response.transcription}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2 h-8 w-8"
                    onClick={() => handleDeleteResponse(response.id)}
                    disabled={isDeletingResponse === response.id}
                  >
                    {isDeletingResponse === response.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-400" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-muted/30 overflow-hidden">
          <div className="relative h-full w-full">
            {/* Completed sections - solid white */}
            <div
              className="absolute h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-300 ease-in-out"
              style={{
                width: `${(currentQuestionIndex / allQuestions.length) * 100}%`,
              }}
            />
            {/* Current section - gradient */}
            <div
              className="absolute h-full bg-gradient-to-r from-white to-transparent shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-300 ease-in-out"
              style={{
                left: `${(currentQuestionIndex / allQuestions.length) * 100}%`,
                width: `${(1 / allQuestions.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex justify-between items-center p-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  disabled={isFirstQuestion || recordingState !== RecordingState.IDLE}
                  className={cn(
                    "w-[180px] h-12 text-base gap-2 select-none",
                    "border-2",
                    "disabled:border-[1px]"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Shortcut:</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ←
                  </kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex flex-col items-center gap-2">
            <span className="text-base text-muted-foreground select-none">
              <span className="sm:hidden">{currentQuestionIndex + 1}/{allQuestions.length}</span>
              <span className="hidden sm:inline">Question {currentQuestionIndex + 1} of {allQuestions.length}</span>
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isLastQuestion ? "default" : "outline"}
                  onClick={isLastQuestion ? () => setIsSessionComplete(true) : onNext}
                  disabled={recordingState !== RecordingState.IDLE}
                  className={cn(
                    "w-[180px] h-12 text-base gap-2 select-none",
                    isLastQuestion ? (
                      "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-shadow"
                    ) : (
                      "border-2 disabled:border-[1px]"
                    )
                  )}
                >
                  {isLastQuestion ? (
                    <>
                      <span className="hidden sm:inline font-medium">Complete Session</span>
                      <span className="sm:hidden font-medium">Complete</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Shortcut:</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    →
                  </kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
} 