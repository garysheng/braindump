import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Loader2, Settings2 } from "lucide-react";
import type { LLMProvider, ContentFormat, AdvancedSettings } from '@/types';
import { useLLMKeys } from '@/hooks/use-llm-keys';
import { toast } from '@/hooks/use-toast';
import { LLMKeyDialog } from "@/components/llm-key-dialog";

interface DraftGeneratorProps {
  responses: Array<{
    questionText: string;
    transcription: string;
  }>;
  onGenerate: (params: {
    model: LLMProvider;
    format: ContentFormat;
    customFormat?: string;
    settings: AdvancedSettings;
  }) => Promise<void>;
  isGenerating?: boolean;
}

export function DraftGenerator({ responses, onGenerate, isGenerating = false }: DraftGeneratorProps) {
  const { anthropicKey, geminiKey, setAnthropicKey, setGeminiKey } = useLLMKeys();
  const [model, setModel] = useState<LLMProvider>('claude');
  const [format, setFormat] = useState<ContentFormat>('blog');
  const [customFormat, setCustomFormat] = useState('');
  const [settings, setSettings] = useState<AdvancedSettings>({});
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const handleGenerate = async () => {
    // Check API key availability
    if (model === 'claude' && !anthropicKey) {
      setShowKeyDialog(true);
      return;
    }

    if (model === 'gemini' && !geminiKey) {
      setShowKeyDialog(true);
      return;
    }

    // Validate format
    if (format === 'custom' && !customFormat.trim()) {
      toast({
        title: "Custom Format Required",
        description: "Please specify the custom format.",
        variant: "destructive",
      });
      return;
    }

    await onGenerate({
      model,
      format,
      customFormat: format === 'custom' ? customFormat : undefined,
      settings,
    });
  };

  const handleKeySubmit = async (key: string) => {
    try {
      if (model === 'claude') {
        await setAnthropicKey(key);
      } else {
        await setGeminiKey(key);
      }
      // Automatically trigger generation after key is set
      await handleGenerate();
    } catch (error) {
      console.error('Error setting API key:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>AI Model</Label>
          <Select value={model} onValueChange={(value: LLMProvider) => setModel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude (Anthropic)</SelectItem>
              <SelectItem value="gemini">Gemini (Google)</SelectItem>
            </SelectContent>
          </Select>
          {model === 'claude' && !anthropicKey && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">Anthropic API key required</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowKeyDialog(true)}
                className="text-primary"
              >
                Add API Key
              </Button>
            </div>
          )}
          {model === 'gemini' && !geminiKey && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">Gemini API key required</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowKeyDialog(true)}
                className="text-primary"
              >
                Add API Key
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={format} onValueChange={(value: ContentFormat) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic">Academic Essay</SelectItem>
              <SelectItem value="blog">Blog Post</SelectItem>
              <SelectItem value="personal">Personal Reflection</SelectItem>
              <SelectItem value="custom">Custom Format</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {format === 'custom' && (
          <div className="space-y-2">
            <Label>Custom Format Description</Label>
            <Textarea
              placeholder="Describe your desired format..."
              value={customFormat}
              onChange={(e) => setCustomFormat(e.target.value)}
            />
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Advanced Settings
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Length (words)</Label>
                <Input
                  type="number"
                  min="100"
                  placeholder="e.g., 500"
                  value={settings.length || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, length: parseInt(e.target.value) || undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Input
                  placeholder="e.g., professional, casual, academic"
                  value={settings.tone || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value || undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Input
                  placeholder="e.g., general public, experts, students"
                  value={settings.audience || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, audience: e.target.value || undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Instructions</Label>
                <Textarea
                  placeholder="Any specific requirements or preferences..."
                  value={settings.customInstructions || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, customInstructions: e.target.value || undefined }))}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating || (format === 'custom' && !customFormat.trim())}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Draft...
          </>
        ) : (
          'Generate Draft'
        )}
      </Button>

      <div className="text-sm text-muted-foreground">
        <p>Your responses that will be used:</p>
        <ul className="list-disc pl-4 mt-2 space-y-2">
          {responses.map((response, index) => (
            <li key={index} className="text-xs">
              <span className="font-medium">{response.questionText}:</span>{' '}
              {response.transcription.length > 100
                ? response.transcription.slice(0, 100) + '...'
                : response.transcription}
            </li>
          ))}
        </ul>
      </div>

      <LLMKeyDialog
        open={showKeyDialog}
        onClose={() => setShowKeyDialog(false)}
        provider={model}
        onSubmit={handleKeySubmit}
      />
    </div>
  );
} 