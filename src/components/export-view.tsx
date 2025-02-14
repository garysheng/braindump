import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DraftGenerator } from "@/components/draft-generator";
import { FileText, Copy, Download, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { GenerationParams } from '@/types';
import { cn } from "@/lib/utils";

interface ExportViewProps {
  responses: Array<{
    questionText: string;
    transcription: string;
  }>;
  onGenerateDraft: (params: GenerationParams) => Promise<void>;
  isGenerating?: boolean;
  generatedContent?: string | null;
}

export function ExportView({ responses, onGenerateDraft, isGenerating = false, generatedContent = null }: ExportViewProps) {
  const [activeTab, setActiveTab] = useState<string>('raw');

  const handleCopyToClipboard = async () => {
    try {
      const text = responses.map(response => (
        `${response.questionText}\n${response.transcription}\n`
      )).join('\n');
      
      await navigator.clipboard.writeText(text);
      toast({
        description: "All responses copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const text = responses.map(response => (
      `${response.questionText}\n${response.transcription}\n`
    )).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responses-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="raw" className="gap-2 data-[state=active]:bg-blue-500/20">
            <FileText className="w-4 h-4" />
            Raw Export
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-2 data-[state=active]:bg-purple-500/20">
            <Wand2 className="w-4 h-4" />
            Draft Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="raw" 
          className={cn(
            "space-y-4 rounded-lg p-6 border-2 border-transparent",
            "bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5",
            "[background-clip:padding-box]",
            "before:absolute before:inset-0 before:-z-10 before:m-[-2px] before:rounded-lg",
            "before:bg-gradient-to-r before:from-blue-500/40 before:via-blue-500/40 before:to-blue-500/40",
            "relative"
          )}
        >
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyToClipboard}
              className="flex-1 gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy All
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          <div className="space-y-4">
            {responses.map((response, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-medium">{response.questionText}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {response.transcription}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent 
          value="draft" 
          className={cn(
            "space-y-4 rounded-lg p-6 border-2 border-transparent",
            "bg-gradient-to-r from-purple-500/5 via-purple-500/10 to-purple-500/5",
            "[background-clip:padding-box]",
            "before:absolute before:inset-0 before:-z-10 before:m-[-2px] before:rounded-lg",
            "before:bg-gradient-to-r before:from-purple-500/40 before:via-purple-500/40 before:to-purple-500/40",
            "relative"
          )}
        >
          <DraftGenerator
            responses={responses}
            onGenerate={onGenerateDraft}
            isGenerating={isGenerating}
          />

          {generatedContent && (
            <div className="mt-8 space-y-4 bg-muted/50 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">Generated Draft</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent);
                    toast({
                      description: "Draft copied to clipboard",
                    });
                  }}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Draft
                </Button>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{generatedContent}</div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 