import { doc, collection, addDoc, setDoc, serverTimestamp, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import { v4 as uuidv4 } from 'uuid';

interface CreateSessionResponse {
  sessionId: string;
}

interface CreateResponseParams {
  userId: string;
  sessionId: string;
  questionId: string;
  blob: Blob;
}

export async function createNewSession(
  userId: string,
  questions: Array<{ id: string; text: string; order: number; }>
): Promise<CreateSessionResponse> {
  if (!userId || !questions || !Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid session data');
  }

  // Validate questions
  questions.forEach((question, index) => {
    if (!question.text || typeof question.text !== 'string') {
      throw new Error(`Invalid question text at index ${index}`);
    }
  });

  // Get API key from localStorage
  const apiKey = localStorage.getItem('openai-api-key');
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  // Generate title using OpenAI
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      prompt: `Based on these questions, generate a concise and descriptive title (max 50 characters) for this recording session. Format the response as JSON with a "title" field. Questions: ${questions.map(q => q.text).join(", ")}`,
      apiKey
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate title');
  }

  const { title } = await response.json();

  // Create a new session document in users/{userId}/sessions
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const sessionDoc = await addDoc(sessionsRef, {
    userId,
    title: title || new Date().toLocaleDateString(), // Use generated title or fallback to date
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Add each question as a document in the questions subcollection
  const questionsRef = collection(db, 'users', userId, 'sessions', sessionDoc.id, 'questions');
  
  try {
    await Promise.all(
      questions.map(async (question, index) => {
        if (!question.text) {
          console.error('Invalid question:', question);
          throw new Error(`Question at index ${index} is missing text`);
        }

        const questionData = {
          text: question.text.trim(),
          order: index,
          responses: [],
        };

        const questionDocRef = doc(questionsRef);
        await setDoc(questionDocRef, {
          id: questionDocRef.id,
          ...questionData,
        });
      })
    );
  } catch (error) {
    // If questions fail to save, clean up the session document
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionDoc.id));
    throw error;
  }

  return { sessionId: sessionDoc.id };
}

export async function addResponseToQuestion({
  userId,
  sessionId,
  questionId,
  blob,
}: CreateResponseParams) {
  const responseId = uuidv4();

  // Send audio to server for transcription
  const formData = new FormData();
  formData.append('audio', blob);
  
  // Get API key from localStorage
  const apiKey = localStorage.getItem('openai-api-key');
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }
  formData.append('apiKey', apiKey);
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to transcribe audio');
  }

  const { transcript } = await response.json();

  // Add the response to the responses subcollection
  const responsesRef = collection(
    db,
    'users',
    userId,
    'sessions',
    sessionId,
    'questions',
    questionId,
    'responses'
  );

  await addDoc(responsesRef, {
    id: responseId,
    transcription: transcript,
    createdAt: serverTimestamp(),
  });

  return { responseId, transcription: transcript };
}

export async function getMostRecentSession(userId: string): Promise<string | null> {
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const recentSessionQuery = query(sessionsRef, orderBy('createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(recentSessionQuery);
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].id;
}

export async function deleteResponse({
  userId,
  sessionId,
  questionId,
  responseId,
}: {
  userId: string;
  sessionId: string;
  questionId: string;
  responseId: string;
}) {
  const responseRef = doc(
    db,
    'users',
    userId,
    'sessions',
    sessionId,
    'questions',
    questionId,
    'responses',
    responseId
  );

  await deleteDoc(responseRef);
}

export async function deleteSession(userId: string, sessionId: string) {
  if (!userId || !sessionId) {
    throw new Error('Invalid userId or sessionId');
  }

  // First, get all questions for this session
  const questionsRef = collection(db, 'users', userId, 'sessions', sessionId, 'questions');
  const questionsSnapshot = await getDocs(questionsRef);

  // Delete all responses for each question
  await Promise.all(questionsSnapshot.docs.map(async (questionDoc) => {
    const responsesRef = collection(questionsRef, questionDoc.id, 'responses');
    const responsesSnapshot = await getDocs(responsesRef);
    
    // Delete each response document
    await Promise.all(responsesSnapshot.docs.map(async (responseDoc) => {
      await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId, 'questions', questionDoc.id, 'responses', responseDoc.id));
    }));

    // Delete the question document
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId, 'questions', questionDoc.id));
  }));

  // Finally, delete the session document
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  await deleteDoc(sessionRef);
}

export async function getUserSessions(userId: string) {
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const sessionsQuery = query(sessionsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(sessionsQuery);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    title: doc.data().title || new Date(doc.data().createdAt?.toDate() || new Date()).toLocaleDateString(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  }));
}