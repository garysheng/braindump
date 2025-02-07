import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import type { Template } from '@/types';

export async function createTemplate(userId: string, template: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const templatesRef = collection(db, 'users', userId, 'templates');
  const docRef = await addDoc(templatesRef, {
    ...template,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateTemplate(userId: string, templateId: string, updates: Partial<Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const templateRef = doc(db, 'users', userId, 'templates', templateId);
  await updateDoc(templateRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTemplate(userId: string, templateId: string) {
  const templateRef = doc(db, 'users', userId, 'templates', templateId);
  await deleteDoc(templateRef);
}

export async function getUserTemplates(userId: string) {
  const templatesRef = collection(db, 'users', userId, 'templates');
  const q = query(templatesRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Template[];
}

export async function getPublicTemplates() {
  const templatesRef = collection(db, 'templates');
  const q = query(templatesRef, where('isPublic', '==', true), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Template[];
}