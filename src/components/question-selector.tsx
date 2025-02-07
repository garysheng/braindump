import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Settings, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getUserTemplates, getPublicTemplates } from '@/lib/template-service';
import type { Template } from '@/types';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  order: number;
}

interface QuestionSelectorProps {
  onSubmit: (questions: Question[]) => Promise<void>;
  onCancel: () => void;
  userId: string;
  hasOpenAIKey: boolean;
  onNeedApiKey: () => void;
}

const DEFAULT_PROMPTS = [
  "Generate questions for daily reflection and personal growth",
  "Create questions to plan and review my week",
  "Make questions about my career goals and progress",
  "Generate questions about my relationships and social connections"
];

export function QuestionSelector({ onSubmit, onCancel, userId, hasOpenAIKey, onNeedApiKey }: QuestionSelectorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customQuestions, setCustomQuestions] = useState('');
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const [userT, publicT] = await Promise.all([
          getUserTemplates(userId),
          getPublicTemplates()
        ]);
        setUserTemplates(userT);
        setPublicTemplates(publicT);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, [userId]);

  const handleSubmitCustom = async () => {
    if (!customQuestions.trim()) return;

    setIsSubmitting(true);
    try {
      const questions = customQuestions
        .split('\n')
        .map(text => text.trim())
        .filter(text => text.length > 0)
        .map((text, index) => ({
          id: `custom-${index}`,
          text,
          order: index,
        }));

      if (questions.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one question",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(questions);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!hasOpenAIKey) {
      onNeedApiKey();
      return;
    }

    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for generating questions",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          apiKey: localStorage.getItem('openai-api-key')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const { questions } = await response.json();
      await onSubmit(questions);
      
      // Show success toast with the prompt used
      toast({
        title: "Session Started!",
        description: `Generated ${questions.length} questions based on: "${aiPrompt.length > 50 ? aiPrompt.slice(0, 50) + '...' : aiPrompt}"`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    setIsSubmitting(true);
    try {
      const questions = template.questions.map(q => ({
        id: q.id,
        text: q.text,
        order: q.order,
      }));
      await onSubmit(questions);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setAiPrompt(prompt);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose questions for your session using one of the methods below.
      </p>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Write Questions</TabsTrigger>
          <TabsTrigger value="ai">AI Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => router.push('/templates')}
            >
              <Settings className="w-4 h-4" />
              Manage Templates
            </Button>
          </div>

          {isLoadingTemplates ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {userTemplates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Templates</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative flex flex-col min-h-[200px]"
                      >
                        <div className="space-y-2 flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <p className="text-sm text-muted-foreground">{template.questions.length} questions</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                            disabled={isSubmitting}
                          >
                            Use Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {publicTemplates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Public Templates</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {publicTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative flex flex-col min-h-[200px]"
                      >
                        <div className="space-y-2 flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <p className="text-sm text-muted-foreground">{template.questions.length} questions</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                            disabled={isSubmitting}
                          >
                            Use Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userTemplates.length === 0 && publicTemplates.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">No templates found.</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/templates')}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Template
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-questions">Enter your questions (one per line)</Label>
            <Textarea
              id="custom-questions"
              placeholder="What did you accomplish today?&#10;What are you grateful for?&#10;What's on your mind?"
              className="min-h-[200px]"
              value={customQuestions}
              onChange={(e) => setCustomQuestions(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCustom}
              disabled={!customQuestions.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Session...
                </>
              ) : (
                'Start Session'
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">
              Describe what kind of questions you want
            </Label>
            <Textarea
              id="ai-prompt"
              placeholder="Example: Generate questions for a daily reflection focused on personal growth and productivity."
              className="min-h-[100px]"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              AI will generate 5-10 thoughtful questions based on your prompt.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Or choose a preset prompt:
            </Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSelectPrompt(prompt)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    aiPrompt === prompt
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/70'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isGeneratingQuestions}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateQuestions}
              disabled={!aiPrompt.trim() || isGeneratingQuestions}
              className="gap-2"
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 