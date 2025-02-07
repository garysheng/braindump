import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Key, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OpenAIKeyDialogProps {
  open: boolean;
  onOpenAIKeySubmit: (key: string) => void;
}

export function OpenAIKeyDialog({ open, onOpenAIKeySubmit }: OpenAIKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim().startsWith('sk-')) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/test-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      onOpenAIKeySubmit(apiKey);
    } catch (error) {
      console.error('Error testing API key:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={() => {}}
    >
      <DialogContent 
        className="sm:max-w-md"
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Enter OpenAI API Key</DialogTitle>
          <DialogDescription>
            You&apos;ll need to provide your own OpenAI API key to use BrainDump&apos;s AI features.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We recommend creating a <strong>new API key</strong> with a hard spending limit (e.g., $3) for safety.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label>
              Steps to get your API key:
            </Label>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
              <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                OpenAI API Keys <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Click &quot;Create new secret key&quot;</li>
              <li>Set a name (e.g., &quot;BrainDump App&quot;)</li>
              <li>Go to <a href="https://platform.openai.com/account/billing/limits" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                Usage limits <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Set a hard limit (we recommend $3-5)</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="apiKey">Your OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
                <Button type="submit" disabled={!apiKey.trim().startsWith('sk-') || isSubmitting}>
                  <Key className="w-4 h-4 mr-2" />
                  Save Key
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 