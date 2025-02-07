import { useState, useEffect } from 'react';

const AUTO_ADVANCE_KEY = 'braindump-auto-advance';

export function useAutoAdvance() {
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    // Only access localStorage during client-side rendering
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AUTO_ADVANCE_KEY);
      return saved !== null ? JSON.parse(saved) : true; // Default to true
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem(AUTO_ADVANCE_KEY, JSON.stringify(autoAdvance));
  }, [autoAdvance]);

  return [autoAdvance, setAutoAdvance] as const;
} 