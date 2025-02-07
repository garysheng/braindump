import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, GripVertical, X, Sparkles, Wand2 } from "lucide-react";
import type { Template } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const DEFAULT_PROMPTS = [
  "Generate questions for daily reflection and personal growth",
  "Create questions to plan and review my week",
  "Make questions about my career goals and progress",
  "Generate questions about my relationships and social connections"
];

interface TemplateFormProps {
  initialData?: Partial<Template>;
  onSubmit: (data: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  isLoading?: boolean;
}

interface GeneratedQuestion {
  text: string;
  id: string;
  order: number;
}

interface GeneratedMetadata {
  name: string;
  description: string;
}

export function TemplateForm({ initialData, onSubmit, isLoading = false }: TemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [questions, setQuestions] = useState(initialData?.questions || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;

    setQuestions([
      ...questions,
      {
        id: `new-${Date.now()}`,
        text: newQuestion.trim(),
        order: questions.length,
      },
    ]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    // Update order after removal
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order after drag
    setQuestions(items.map((item, index) => ({ ...item, order: index })));
  };

  const handleGenerateQuestions = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for generating questions",
        variant: "destructive",
      });
      return;
    }

    const apiKey = localStorage.getItem('openai-api-key');
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please set your OpenAI API key in your profile settings",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      // Generate questions
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          apiKey
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const { questions: generatedQuestions } = await response.json() as { questions: GeneratedQuestion[] };
      
      // Add generated questions to existing questions
      const updatedQuestions = [
        ...questions,
        ...generatedQuestions.map((q, index) => ({
          ...q,
          order: questions.length + index,
        }))
      ];
      setQuestions(updatedQuestions);
      setAiPrompt(''); // Clear the prompt

      // Automatically generate metadata
      setIsGeneratingMetadata(true);
      const metadataResponse = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `Based on these questions, generate a concise and descriptive template name and a one-sentence description that captures the purpose of this question set. Format the response as JSON with "name" and "description" fields. Questions: ${updatedQuestions.map(q => q.text).join(", ")}`,
          apiKey
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error('Failed to generate metadata');
      }

      const metadata = await metadataResponse.json() as GeneratedMetadata;
      if (metadata.name && metadata.description) {
        setName(metadata.name);
        setDescription(metadata.description);
      }
      
      toast({
        description: `Generated ${generatedQuestions.length} questions and template details`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
      setIsGeneratingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        questions: questions.map((q, i) => ({ ...q, order: i })),
      });
    } catch (error) {
      console.error('Error submitting template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <Label>Questions</Label>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {questions.map((question, index) => (
                  <Draggable
                    key={question.id}
                    draggableId={question.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2 bg-card rounded-lg border p-3"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab"
                        >
                          <GripVertical className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="flex-1">{question.text}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Add Questions Manually</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a new question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuestion}
                disabled={!newQuestion.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Generate Questions with AI</Label>
            <div className="space-y-3">
              <Textarea
                placeholder="Describe what kind of questions you want to generate..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Or choose a preset prompt:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setAiPrompt(prompt)}
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

              <Button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={!aiPrompt.trim() || isGeneratingQuestions}
                className="w-full gap-2"
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
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-6 rounded-lg border bg-card p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Template Details</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGeneratingMetadata(true)}
                disabled={isGeneratingMetadata}
                className="gap-2"
              >
                {isGeneratingMetadata ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Auto-generate
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="Daily Reflection"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A set of questions for daily reflection and mindfulness"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Make this template public</Label>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !name.trim() || questions.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Template'
          )}
        </Button>
      </div>
    </form>
  );
} 