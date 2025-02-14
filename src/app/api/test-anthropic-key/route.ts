import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    // Test the API key by making a simple request
    const anthropic = new Anthropic({ apiKey });
    await anthropic.messages.create({
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'claude-3-haiku-20240307',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error testing Anthropic key:', error);
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }
} 