import { useState, useEffect } from 'react';

export interface Teacher {
  id: number;
  teacher_name: string;
  teacher_code: string;
  type: string;
  subject: string;
  medium: string;
}

// Module-level cache to persist data across component mounts during a single session
let cachedTeachers: Teacher[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>(cachedTeachers || []);
  const [loading, setLoading] = useState(!cachedTeachers);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      const now = Date.now();
      
      // Use cache if it's fresh (less than 1 hour old)
      if (cachedTeachers && (now - lastFetchTime) < CACHE_DURATION_MS) {
        setTeachers(cachedTeachers);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/teachers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch teachers');
        }
        
        const data = await response.json();
        
        // Update cache
        cachedTeachers = data;
        lastFetchTime = Date.now();
        
        setTeachers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return { teachers, loading, error };
}
