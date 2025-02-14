import type { GenerationParams } from '@/types';

interface GenerateDraftParams extends GenerationParams {
  responses: Array<{
    questionText: string;
    transcription: string;
  }>;
}

export async function generateDraft({
  model,
  responses,
  format,
  customFormat,
  settings,
}: GenerateDraftParams) {
  // Get the appropriate API key based on the model
  const apiKey = localStorage.getItem(
    model === 'claude' ? 'anthropic-api-key' : 'gemini-api-key'
  );

  if (!apiKey) {
    throw new Error(`${model === 'claude' ? 'Anthropic' : 'Gemini'} API key not found`);
  }

  const response = await fetch('/api/generate-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      model,
      responses,
      format,
      customFormat,
      settings,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate draft');
  }

  const { content, prompt } = await response.json();
  return { content, prompt };
} 