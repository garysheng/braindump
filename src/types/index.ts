import { Timestamp } from 'firebase/firestore';

// Backend Types (Firestore)
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