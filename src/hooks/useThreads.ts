import { useState, useEffect, useCallback } from 'react';
import { Thread } from '@/types';

export const useThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);

  const fetchThreads = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/threads');
      const data: Thread[] = await response.json();
      setThreads(data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = useCallback(async (name: string, journeyId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, journey_id: journeyId }),
      });
      const data: Thread = await response.json();
      setThreads((prevThreads) => [...prevThreads, data]);
      return data;
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  }, []);

  const deleteThread = useCallback(async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/threads/${id}`, {
        method: 'DELETE',
      });
      setThreads((prevThreads) =>
        prevThreads.filter((thread) => thread.id !== id),
      );
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  }, []);

  const renameThread = useCallback(async (id: string, newName: string) => {
    try {
      await fetch(`http://localhost:8000/api/threads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === id ? { ...thread, name: newName } : thread,
        ),
      );
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  }, []);

  return { threads, createThread, deleteThread, renameThread };
};
