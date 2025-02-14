import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ContentFormat, AdvancedSettings, LLMProvider } from '@/types';

interface RequestBody {
  apiKey: string;
  model: LLMProvider;
  responses: Array<{
    questionText: string;
    transcription: string;
  }>;
  format: ContentFormat;
  customFormat?: string;
  settings: AdvancedSettings;
}

function generatePrompt(
  responses: Array<{ questionText: string; transcription: string; }>,
  format: ContentFormat,
  customFormat: string | undefined,
  settings: AdvancedSettings
): string {
  const responsesText = responses
    .map(r => `Question: ${r.questionText}\nResponse: ${r.transcription}`)
    .join('\n\n');

  let formatDescription = '';
  switch (format) {
    case 'academic':
      formatDescription = 'an academic essay with proper citations and formal language';
      break;
    case 'blog':
      formatDescription = 'a blog post with engaging, conversational tone and clear sections';
      break;
    case 'personal':
      formatDescription = 'a personal reflection that maintains an introspective and authentic voice';
      break;
    case 'custom':
      formatDescription = customFormat || 'a well-structured piece';
      break;
  }

  let prompt = `Based on the following responses to questions, create ${formatDescription}. Maintain the original ideas and insights while improving the structure and flow.

${responsesText}

Guidelines:
1. Organize the content logically and maintain a coherent narrative
2. Preserve the personal voice and key insights from the responses
3. Expand on important points while maintaining clarity`;

  // Add settings-based instructions
  if (settings.length) {
    prompt += `\n4. Target length: approximately ${settings.length} words`;
  }
  if (settings.tone) {
    prompt += `\n5. Maintain a ${settings.tone} tone throughout`;
  }
  if (settings.audience) {
    prompt += `\n6. Write for ${settings.audience}`;
  }
  if (settings.customInstructions) {
    prompt += `\n\nAdditional Instructions:\n${settings.customInstructions}`;
  }

  return prompt;
}

async function generateWithClaude(apiKey: string, prompt: string, maxTokens: number) {
  const anthropic = new Anthropic({ apiKey });
  const completion = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.content[0].type === 'text' ? completion.content[0].text : null;
  if (!content) {
    throw new Error('No content generated');
  }

  return content;
}

async function generateWithGemini(apiKey: string, prompt: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();
  
  if (!content) {
    throw new Error('No content generated');
  }

  return content;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { apiKey, model, responses, format, customFormat, settings } = body;

    if (!apiKey || !model || !responses || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = generatePrompt(responses, format, customFormat, settings);
    const maxTokens = settings.length ? Math.min(4000, settings.length * 2) : 4000;

    let content: string;
    try {
      if (model === 'claude') {
        content = await generateWithClaude(apiKey, prompt, maxTokens);
      } else {
        content = await generateWithGemini(apiKey, prompt);
      }
    } catch (error) {
      console.error(`Error generating with ${model}:`, error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('not_found_error')) {
          return NextResponse.json(
            { error: 'Invalid model name or API configuration. Please check your API key and try again.' },
            { status: 400 }
          );
        }
        if (error.message.includes('invalid_api_key')) {
          return NextResponse.json(
            { error: 'Invalid API key. Please check your API key and try again.' },
            { status: 401 }
          );
        }
        if (error.message.includes('rate_limit')) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        { error: `Failed to generate draft with ${model}. Please try again.` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
      prompt,
    });
  } catch (error) {
    console.error('Error generating draft:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
} 