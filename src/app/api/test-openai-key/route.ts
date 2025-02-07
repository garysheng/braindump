import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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
    const openai = new OpenAI({ apiKey });
    await openai.models.list();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error testing OpenAI key:', error);
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }
} 