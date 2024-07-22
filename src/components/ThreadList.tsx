import React, { useState } from 'react';

interface Thread {
  id: string;
  name: string;
}

interface Journey {
  id: string;
  name: string;
  description: string;
}

interface ThreadListProps {
  threads: Thread[];
  journeys: Journey[];
  currentThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (name: string, journeyId: string) => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, newName: string) => void;
}

const ThreadList: React.FC<ThreadListProps> = ({ 
  threads, 
  journeys,
  currentThreadId, 
  onSelectThread, 
  onCreateThread, 
  onDeleteThread, 
  onRenameThread 
}) => {
  const [newThreadName, setNewThreadName] = useState<string>('');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingThreadName, setEditingThreadName] = useState<string>('');

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (newThreadName.trim() && selectedJourneyId) {
      onCreateThread(newThreadName, selectedJourneyId);
      setNewThreadName('');
      setSelectedJourneyId('');
    }
  };

  const handleRenameThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingThreadName.trim() && editingThreadId) {
      onRenameThread(editingThreadId, editingThreadName);
      setEditingThreadId(null);
    }
  };

  return (
    <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Threads</h2>
      <form onSubmit={handleCreateThread} className="mb-4">
        <input
          type="text"
          value={newThreadName}
          onChange={(e) => setNewThreadName(e.target.value)}
          placeholder="New thread name"
          className="input input-bordered w-full mb-2"
        />
        <select
          value={selectedJourneyId}
          onChange={(e) => setSelectedJourneyId(e.target.value)}
          className="select select-bordered w-full mb-2"
        >
          <option value="">Select a Journey</option>
          {journeys.map((journey) => (
            <option key={journey.id} value={journey.id}>{journey.name}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary w-full">Create Thread</button>
      </form>
      <ul>
        {threads.map((thread) => (
          <li key={thread.id} className="mb-2">
            {editingThreadId === thread.id ? (
              <form onSubmit={handleRenameThread} className="flex">
                <input
                  type="text"
                  value={editingThreadName}
                  onChange={(e) => setEditingThreadName(e.target.value)}
                  className="input input-bordered flex-grow"
                />
                <button type="submit" className="btn btn-sm btn-primary ml-2">Save</button>
              </form>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => onSelectThread(thread.id)}
                  className={`flex-grow text-left ${currentThreadId === thread.id ? 'font-bold' : ''}`}
                >
                  {thread.name}
                </button>
                <button
                  onClick={() => {
                    setEditingThreadId(thread.id);
                    setEditingThreadName(thread.name);
                  }}
                  className="btn btn-xs btn-ghost"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteThread(thread.id)}
                  className="btn btn-xs btn-ghost text-red-500"
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThreadList;