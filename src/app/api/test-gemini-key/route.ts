import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key by making a simple request
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Test with a simple prompt
    await model.generateContent('Hi');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error testing Gemini key:', error);
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }
} 