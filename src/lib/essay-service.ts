import { collection, doc, addDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import type { GeneratedEssay, GeneratedEssayBackend, LLMProvider, ContentFormat, AdvancedSettings } from '@/types';

interface CreateEssayParams {
  userId: string;
  sessionId: string;
  model: LLMProvider;
  format: ContentFormat;
  customFormat?: string;
  settings: AdvancedSettings;
  content: string;
  prompt: string;
}

export async function createGeneratedEssay({
  userId,
  sessionId,
  model,
  format,
  customFormat,
  settings,
  content,
  prompt,
}: CreateEssayParams): Promise<string> {
  const essaysRef = collection(db, 'users', userId, 'essays');
  
  const docRef = await addDoc(essaysRef, {
    userId,
    sessionId,
    model,
    format,
    customFormat,
    settings,
    content,
    prompt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getSessionEssays(userId: string, sessionId: string): Promise<GeneratedEssay[]> {
  const essaysRef = collection(db, 'users', userId, 'essays');
  const q = query(
    essaysRef,
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data() as GeneratedEssayBackend;
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  });
}

export async function getEssay(userId: string, essayId: string): Promise<GeneratedEssay | null> {
  const essayRef = doc(db, 'users', userId, 'essays', essayId);
  const essayDoc = await getDoc(essayRef);

  if (!essayDoc.exists()) {
    return null;
  }

  const data = essayDoc.data() as GeneratedEssayBackend;
  return {
    ...data,
    id: essayDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export async function getAllUserEssays(userId: string): Promise<GeneratedEssay[]> {
  const essaysRef = collection(db, 'users', userId, 'essays');
  const q = query(essaysRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data() as GeneratedEssayBackend;
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  });
} 