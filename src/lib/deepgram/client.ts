import { createClient } from '@deepgram/sdk';

export function getDeepgramClient(apiKey: string) {
  return createClient(apiKey);
}

export async function transcribeAudio(blob: Blob) {
  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('Deepgram API key not found');
  }

  const deepgram = getDeepgramClient(apiKey);
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { result } = await deepgram.listen.prerecorded.transcribeFile(buffer, {
      smart_format: true,
      punctuate: true,
      model: 'general',
      language: 'en-US',
    });
    
    if (!result?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      throw new Error('No transcription found in response');
    }
    
    return result.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
} 