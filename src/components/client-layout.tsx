'use client';

import { useState, useEffect } from "react";
import { OpenAIKeyDialog } from "@/components/openai-key-dialog";
import { Toaster } from "@/components/ui/toaster";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showOpenAIKeyDialog, setShowOpenAIKeyDialog] = useState(false);

  useEffect(() => {
    // Check if we have an OpenAI key in localStorage
    const key = localStorage.getItem('openai-api-key');
    if (!key) {
      setShowOpenAIKeyDialog(true);
    }
  }, []);

  const handleOpenAIKeySubmit = (apiKey: string) => {
    localStorage.setItem('openai-api-key', apiKey);
    setShowOpenAIKeyDialog(false);
  };

  return (
    <>
      {children}
      <OpenAIKeyDialog 
        open={showOpenAIKeyDialog} 
        onOpenAIKeySubmit={handleOpenAIKeySubmit} 
      />
      <Toaster />
    </>
  );
} 