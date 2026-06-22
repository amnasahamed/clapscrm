import { useEffect } from 'react';

// Keep track of the number of active scroll locks globally
let activeLocksCount = 0;

/** Prevent background scroll while an overlay is open */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    activeLocksCount++;
    if (activeLocksCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      activeLocksCount--;
      if (activeLocksCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [locked]);
}

