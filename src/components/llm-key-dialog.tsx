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
import type { LLMProvider } from "@/types";

interface LLMKeyDialogProps {
  open: boolean;
  onClose: () => void;
  provider: LLMProvider;
  onSubmit: (key: string) => Promise<void>;
}

const PROVIDER_INFO = {
  claude: {
    name: "Anthropic",
    keyPrefix: "sk-",
    dashboardUrl: "https://console.anthropic.com/account/keys",
    instructions: [
      "Go to the Anthropic Console",
      "Click 'Create API Key'",
      "Set a name (e.g., 'BrainDump App')",
      "Copy your key (it starts with 'sk-')",
      "Set a spending limit in your account settings",
    ],
  },
  gemini: {
    name: "Google AI Studio",
    keyPrefix: "",
    dashboardUrl: "https://aistudio.google.com/app/apikey",
    instructions: [
      "Go to Google AI Studio",
      "Click 'Get API key'",
      "Create a new project or select an existing one",
      "Copy your API key",
      "Monitor usage in Google Cloud Console",
    ],
  },
} as const;

export function LLMKeyDialog({ open, onClose, provider, onSubmit }: LLMKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const info = PROVIDER_INFO[provider];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || (info.keyPrefix && !apiKey.trim().startsWith(info.keyPrefix))) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(apiKey);
      onClose();
    } catch (error) {
      console.error(`Error setting ${info.name} API key:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter {info.name} API Key</DialogTitle>
          <DialogDescription>
            You&apos;ll need to provide your own {info.name} API key to use their AI model.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We recommend setting up usage limits and monitoring to control costs.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label>
              Steps to get your API key:
            </Label>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
              {info.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <a
              href={info.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 text-sm mt-2"
            >
              Open {info.name} Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="apiKey">Your {info.name} API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={info.keyPrefix ? `${info.keyPrefix}...` : "Enter API key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
                <Button 
                  type="submit" 
                  disabled={!apiKey.trim() || (info.keyPrefix && !apiKey.trim().startsWith(info.keyPrefix)) || isSubmitting}
                >
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