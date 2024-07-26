'use client';

import { useState, useEffect } from 'react';
import { ThreadList } from '@/components/ThreadList';
import { Chat } from '@/components/Chat';
import { useThreads } from '@/hooks/useThreads';
import { useJourneys } from '@/hooks/useJourneys';

export default function App() {
  const { threads, createThread, deleteThread, renameThread } = useThreads();
  const { journeys } = useJourneys();
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isThreadListVisible, setIsThreadListVisible] = useState(true);

  useEffect(() => {
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
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [currentThreadId]);

  const handleSelectThread = (id: string) => {
    setCurrentThreadId(id);
    window.location.hash = id;
    setIsThreadListVisible(false);
  };

  return (
    <div className="flex h-screen relative">
      <ThreadListSidebar
        isVisible={isThreadListVisible}
        threads={threads}
        journeys={journeys}
        currentThreadId={currentThreadId}
        onSelectThread={handleSelectThread}
        onCreateThread={createThread}
        onDeleteThread={deleteThread}
        onRenameThread={renameThread}
      />
      <MainContent
        currentThreadId={currentThreadId}
      />
    </div>
  );
}

const ThreadListSidebar = ({ isVisible, ...props }) => (
  <div
    className={`absolute top-0 left-0 h-full transition-transform duration-300 ease-in-out z-10 ${
      isVisible ? 'translate-x-0' : '-translate-x-full'
    }`}
  >
    <ThreadList {...props} />
  </div>
);

const MainContent = ({ currentThreadId }) => (
  <div className="flex-grow">
    {currentThreadId ? (
      <Chat threadId={currentThreadId} />
    ) : (
      <div className="flex-grow flex items-center justify-center">
        <p className="text-xl text-gray-500">Select a thread or create a new one to start chatting</p>
      </div>
    )}
  </div>
);