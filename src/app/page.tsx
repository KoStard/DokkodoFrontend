'use client';

import { useState, useEffect } from 'react';
import ThreadList from '@/components/ThreadList';
import Chat from '@/components/Chat';

interface Thread {
  id: string;
  name: string;
}

interface Journey {
  id: string;
  name: string;
  description: string;
}

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isThreadListVisible, setIsThreadListVisible] = useState(true);

  useEffect(() => {
    fetchThreads();
    fetchJourneys();
    const hashThreadId = window.location.hash.slice(1);
    if (hashThreadId) {
      setCurrentThreadId(hashThreadId);
      setIsThreadListVisible(false);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 20) {
        setIsThreadListVisible(true);
      } else if (e.clientX > 300 && currentThreadId) {
        setIsThreadListVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [currentThreadId]);

  const fetchThreads = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/threads');
      const data: Thread[] = await response.json();
      setThreads(data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const fetchJourneys = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/journeys');
      const data: Journey[] = await response.json();
      setJourneys(data);
    } catch (error) {
      console.error('Failed to fetch journeys:', error);
    }
  };

  const createThread = async (name: string, journeyId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, journey_id: journeyId }),
      });
      const data: Thread = await response.json();
      setThreads([...threads, data]);
      setCurrentThreadId(data.id);
      window.location.hash = data.id;
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const deleteThread = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this thread?')) {
      try {
        await fetch(`http://localhost:8000/api/threads/${id}`, { method: 'DELETE' });
        setThreads(threads.filter(thread => thread.id !== id));
        if (currentThreadId === id) {
          setCurrentThreadId(null);
          window.location.hash = '';
        }
      } catch (error) {
        console.error('Failed to delete thread:', error);
      }
    }
  };

  const renameThread = async (id: string, newName: string) => {
    try {
      await fetch(`http://localhost:8000/api/threads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      setThreads(threads.map(thread => 
        thread.id === id ? { ...thread, name: newName } : thread
      ));
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  const setCurrentThreadIdAndUpdateHash = (id: string | null) => {
    setCurrentThreadId(id);
    if (id) {
      window.location.hash = id;
      setIsThreadListVisible(false);
    } else {
      window.location.hash = '';
      setIsThreadListVisible(true);
    }
  };

  return (
    <div className="flex h-screen relative">
      <div
        className={`absolute top-0 left-0 h-full transition-transform duration-300 ease-in-out z-10 ${
          isThreadListVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ThreadList
          threads={threads}
          journeys={journeys}
          currentThreadId={currentThreadId}
          onSelectThread={setCurrentThreadIdAndUpdateHash}
          onCreateThread={createThread}
          onDeleteThread={deleteThread}
          onRenameThread={renameThread}
        />
      </div>
      <div className="flex-grow">
        {currentThreadId ? (
          <Chat threadId={currentThreadId} />
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-xl text-gray-500">Select a thread or create a new one to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}