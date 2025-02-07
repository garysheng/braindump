'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { defaultQuestions } from '@/data/defaultQuestions';

interface Response {
  id: string;
  transcription: string;
  createdAt: Date;
}

interface Question {
  id: string;
  text: string;
  order: number;
  responses: Response[];
}

interface Session {
  id: string;
  title: string;
  questions: Question[];
  currentQuestionIndex: number;
}

export function useSession(userId: string, sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !sessionId) {
      setLoading(false);
      return;
    }

    // Subscribe to the session document and its questions
    const sessionRef = collection(db, 'users', userId, 'sessions');
    const questionsRef = collection(db, 'users', userId, 'sessions', sessionId, 'questions');
    const questionsQuery = query(questionsRef, orderBy('order'));

    let responseUnsubscribers: (() => void)[] = [];

    const unsubscribe = onSnapshot(
      questionsQuery,
      async (snapshot) => {
        try {
          // Clean up previous response listeners
          responseUnsubscribers.forEach(unsubscribe => unsubscribe());
          responseUnsubscribers = [];

          const questions: Question[] = snapshot.docs.map(questionDoc => {
            const questionData = questionDoc.data();
            return {
              id: questionDoc.id,
              text: questionData.text,
              order: questionData.order,
              responses: [], // Initialize with empty responses
            };
          });

          // Sort questions by order
          questions.sort((a, b) => a.order - b.order);

          // Get session data
          const sessionDoc = await getDocs(query(sessionRef));
          const sessionData = sessionDoc.docs.find(doc => doc.id === sessionId)?.data();

          if (!sessionData) {
            throw new Error('Session not found');
          }

          // Set initial session state
          setSession({
            id: sessionId,
            title: sessionData.title || new Date(sessionData.createdAt?.toDate() || new Date()).toLocaleDateString(),
            questions,
            currentQuestionIndex: 0,
          });

          // Set up response listeners for each question
          questions.forEach((question, index) => {
            const responsesRef = collection(db, 'users', userId, 'sessions', sessionId, 'questions', question.id, 'responses');
            const responsesQuery = query(responsesRef, orderBy('createdAt', 'desc'));

            const unsubscribeResponses = onSnapshot(responsesQuery, (responsesSnapshot) => {
              const responses: Response[] = responsesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  transcription: data.transcription || '',
                  createdAt: data.createdAt?.toDate() || new Date(),
                };
              });

              // Update the session state with new responses
              setSession(prevSession => {
                if (!prevSession) return prevSession;
                const updatedQuestions = [...prevSession.questions];
                updatedQuestions[index] = {
                  ...updatedQuestions[index],
                  responses,
                };
                return {
                  ...prevSession,
                  questions: updatedQuestions,
                };
              });
            });

            responseUnsubscribers.push(unsubscribeResponses);
          });

          setLoading(false);
        } catch (err) {
          console.error('Error fetching session data:', err);
          setError('Failed to load session data');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error in questions subscription:', err);
        setError('Failed to subscribe to session updates');
        setLoading(false);
      }
    );

    return () => {
      // Clean up all subscriptions
      unsubscribe();
      responseUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, sessionId]);

  return {
    session,
    loading,
    error,
    defaultQuestions,
  };
} 