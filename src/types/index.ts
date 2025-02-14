import { Timestamp } from 'firebase/firestore';

// LLM Types
export type LLMProvider = 'claude' | 'gemini';

export type ContentFormat = 'academic' | 'blog' | 'personal' | 'custom';

export interface AdvancedSettings {
  length?: number;  // undefined means no specific length requirement
  tone?: string;    // undefined means natural/default tone
  audience?: string; // undefined means general audience
  customInstructions?: string; // any additional instructions
}

export interface GenerationParams {
  model: LLMProvider;
  format: ContentFormat;
  customFormat?: string;
  settings: AdvancedSettings;
}

// Backend Types (Firestore)
export interface GeneratedEssayBackend {
  id: string;
  sessionId: string;
  userId: string;
  model: LLMProvider;
  format: ContentFormat;
  customFormat?: string;  // only used when format is 'custom'
  settings: AdvancedSettings;
  content: string;
  prompt: string;  // store the prompt used to generate the essay
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserBackend {
  id: string;
  email: string;
  deepgramApiKey?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SessionBackend {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  questions: QuestionBackend[];
}

export interface QuestionBackend {
  id: string;
  text: string;
  order: number;
  responses: ResponseBackend[];
}

export interface ResponseBackend {
  id: string;
  audioUrl: string;
  transcription: string;
  createdAt: Timestamp;
}

export interface TemplateBackend {
  id: string;
  userId: string;
  name: string;
  description: string;
  questions: {
    id: string;
    text: string;
    order: number;
  }[];
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Frontend Types
export interface GeneratedEssay extends Omit<GeneratedEssayBackend, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Omit<UserBackend, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

export interface Session extends Omit<SessionBackend, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

export interface Question extends Omit<QuestionBackend, 'responses'> {
  responses: Response[];
}

export interface Response extends Omit<ResponseBackend, 'createdAt'> {
  createdAt: Date;
}

export interface Template extends Omit<TemplateBackend, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
} 