'use client';

import { useState, useEffect } from 'react';
import ThreadList from '@/components/ThreadList';
import Chat from '@/components/Chat';

interface Thread {
  id: string;
  name: string;
}

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  useEffect(() => {
    fetchThreads();
    const hashThreadId = window.location.hash.slice(1);
    if (hashThreadId) {
      setCurrentThreadId(hashThreadId);
    }
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/threads');
      const data: Thread[] = await response.json();
      setThreads(data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const createThread = async (name: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
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
    } else {
      window.location.hash = '';
    }
  };

  return (
    <div className="flex h-screen">
      <ThreadList
        threads={threads}
        currentThreadId={currentThreadId}
        onSelectThread={setCurrentThreadIdAndUpdateHash}
        onCreateThread={createThread}
        onDeleteThread={deleteThread}
        onRenameThread={renameThread}
      />
      {currentThreadId ? (
        <Chat threadId={currentThreadId} />
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-xl text-gray-500">Select a thread or create a new one to start chatting</p>
        </div>
      )}
    </div>
  );
}