'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth-context";
import { RecordingInterface } from "@/components/recording-interface";
import { QuestionSelector } from "@/components/question-selector";
import { createNewSession, getUserSessions, deleteSession } from "@/lib/data-service-client";
import { useSession } from "@/hooks/use-session";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenAIKeyDialog } from "@/components/openai-key-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppHeader } from "@/components/app-header";

interface Question {
  id: string;
  text: string;
  order: number;
}

interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HeaderContentProps {
  session: any | null;
  activeSessionId: string | null;
  onReturnToSessions: () => void;
}

function HeaderContent({ session, activeSessionId, onReturnToSessions }: HeaderContentProps) {
  if (activeSessionId) {
    return (
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onReturnToSessions}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Sessions
        </Button>
        <h1 className="text-lg font-semibold truncate">
          {session?.title}
        </h1>
      </div>
    );
  }

  return <h1 className="text-lg font-semibold">Dashboard</h1>;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [showOpenAIKeyDialog, setShowOpenAIKeyDialog] = useState(false);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    session,
    error: sessionError,
  } = useSession(user?.uid || '', activeSessionId);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingSessions(true);
      const userSessions = await getUserSessions(user.uid);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadSessions();
      // Check if we have an OpenAI key in localStorage
      const key = localStorage.getItem('openai-api-key');
      setHasOpenAIKey(!!key);
      if (!key) {
        setShowOpenAIKeyDialog(true);
      }
    }
  }, [user, authLoading, router, loadSessions]);

  const handleOpenAIKeySubmit = (apiKey: string) => {
    localStorage.setItem('openai-api-key', apiKey);
    setHasOpenAIKey(true);
    setShowOpenAIKeyDialog(false);
  };

  const handleCreateSession = async (questions: Question[]) => {
    if (!user) return;

    try {
      setIsCreatingSession(true);
      toast({
        description: "Creating session...",
      });
      const { sessionId } = await createNewSession(user.uid, questions);
      await loadSessions(); // Reload sessions after creating a new one
      setActiveSessionId(sessionId);
      setCurrentQuestionIndex(0);
      setShowQuestionSelector(false);
      toast({
        title: "Success",
        description: "New session started!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to create session:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start new session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!user || !sessionToDelete) return;

    try {
      setIsDeleting(true);
      toast({
        description: "Deleting session...",
      });

      if (!user.uid || !sessionToDelete.id) {
        throw new Error('Missing required data for deletion');
      }

      await deleteSession(user.uid, sessionToDelete.id);
      setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
      
      toast({
        description: "Session deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
    }
  };

  if (authLoading || (isLoadingSessions && !sessions.length)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">
            {authLoading ? "Checking authentication..." : "Loading sessions..."}
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (sessionError && activeSessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">{sessionError}</div>
      </div>
    );
  }

  return (
    <>
      <main className="container max-w-7xl p-6">
        {!activeSessionId && (
          <Button
            variant="outline"
            onClick={() => setShowQuestionSelector(true)}
            className="w-full gap-2 mb-6"
          >
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        )}

        <div className="grid gap-6">
          {activeSessionId && session ? (
            <div className="bg-card rounded-lg">
              <RecordingInterface
                sessionId={session.id}
                currentQuestion={session.questions[currentQuestionIndex]}
                currentQuestionIndex={currentQuestionIndex}
                onPrevious={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                onNext={() => setCurrentQuestionIndex(prev => Math.min(session.questions.length - 1, prev + 1))}
                isFirstQuestion={currentQuestionIndex === 0}
                isLastQuestion={currentQuestionIndex === session.questions.length - 1}
                allQuestions={session.questions}
              />
            </div>
          ) : (
            <div className="grid gap-6">
              {sessions.length > 0 ? (
                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-6 bg-card rounded-lg border hover:border-primary transition-colors group cursor-pointer"
                      onClick={() => setActiveSessionId(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="text-lg font-medium">{session.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(session.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDelete(session);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-card rounded-lg border">
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">Start a New Session</h2>
                    <p className="text-muted-foreground">
                      Begin recording your responses to a series of questions.
                    </p>
                    <Button
                      onClick={() => setShowQuestionSelector(true)}
                      disabled={isCreatingSession}
                      size="lg"
                      className="gap-2 text-lg h-auto py-6 px-8"
                    >
                      {isCreatingSession ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Session...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          New Session
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showQuestionSelector} onOpenChange={setShowQuestionSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
          </DialogHeader>
          <QuestionSelector
            onSubmit={handleCreateSession}
            onCancel={() => setShowQuestionSelector(false)}
            userId={user!.uid}
            hasOpenAIKey={hasOpenAIKey}
            onNeedApiKey={() => {
              setShowQuestionSelector(false);
              setShowOpenAIKeyDialog(true);
            }}
          />
        </DialogContent>
      </Dialog>

      <OpenAIKeyDialog 
        open={showOpenAIKeyDialog} 
        onOpenAIKeySubmit={handleOpenAIKeySubmit}
      />

      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Session'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 