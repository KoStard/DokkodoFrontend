import { useState, useEffect, useCallback } from 'react';
import { Journey } from '@/types';

export const useJourneys = () => {
  const [journeys, setJourneys] = useState<Journey[]>([]);

  const fetchJourneys = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/journeys');
      const data: Journey[] = await response.json();
      setJourneys(data);
    } catch (error) {
      console.error('Failed to fetch journeys:', error);
    }
  }, []);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  return { journeys };
};