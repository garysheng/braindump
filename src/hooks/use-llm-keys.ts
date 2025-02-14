import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

const ANTHROPIC_KEY = 'anthropic-api-key';
const GEMINI_KEY = 'gemini-api-key';

interface LLMKeys {
  anthropicKey: string | null;
  geminiKey: string | null;
}

interface UseLLMKeysReturn extends LLMKeys {
  setAnthropicKey: (key: string) => Promise<void>;
  setGeminiKey: (key: string) => Promise<void>;
  removeAnthropicKey: () => void;
  removeGeminiKey: () => void;
  validateAnthropicKey: (key: string) => Promise<boolean>;
  validateGeminiKey: (key: string) => Promise<boolean>;
}

export function useLLMKeys(): UseLLMKeysReturn {
  const [keys, setKeys] = useState<LLMKeys>({
    anthropicKey: null,
    geminiKey: null,
  });

  useEffect(() => {
    // Only access localStorage during client-side rendering
    if (typeof window !== 'undefined') {
      setKeys({
        anthropicKey: localStorage.getItem(ANTHROPIC_KEY),
        geminiKey: localStorage.getItem(GEMINI_KEY),
      });
    }
  }, []);

  const validateAnthropicKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/test-anthropic-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating Anthropic key:', error);
      return false;
    }
  };

  const validateGeminiKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/test-gemini-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating Gemini key:', error);
      return false;
    }
  };

  const setAnthropicKey = async (key: string) => {
    if (!key.trim().startsWith('sk-')) {
      toast({
        title: "Error",
        description: "Invalid Anthropic API key format",
        variant: "destructive",
      });
      return;
    }

    const isValid = await validateAnthropicKey(key);
    if (!isValid) {
      toast({
        title: "Error",
        description: "Invalid Anthropic API key",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(ANTHROPIC_KEY, key);
    setKeys(prev => ({ ...prev, anthropicKey: key }));
    toast({
      description: "Anthropic API key updated successfully",
    });
  };

  const setGeminiKey = async (key: string) => {
    const isValid = await validateGeminiKey(key);
    if (!isValid) {
      toast({
        title: "Error",
        description: "Invalid Gemini API key",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(GEMINI_KEY, key);
    setKeys(prev => ({ ...prev, geminiKey: key }));
    toast({
      description: "Gemini API key updated successfully",
    });
  };

  const removeAnthropicKey = () => {
    localStorage.removeItem(ANTHROPIC_KEY);
    setKeys(prev => ({ ...prev, anthropicKey: null }));
    toast({
      description: "Anthropic API key removed",
    });
  };

  const removeGeminiKey = () => {
    localStorage.removeItem(GEMINI_KEY);
    setKeys(prev => ({ ...prev, geminiKey: null }));
    toast({
      description: "Gemini API key removed",
    });
  };

  return {
    ...keys,
    setAnthropicKey,
    setGeminiKey,
    removeAnthropicKey,
    removeGeminiKey,
    validateAnthropicKey,
    validateGeminiKey,
  };
} 