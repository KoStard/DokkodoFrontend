import { Journey, Thread } from '@/types';
import React, { FormEvent, useState } from 'react';

interface ThreadListProps {
  threads: Thread[];
  journeys: Journey[];
  currentThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (name: string, journeyId: string) => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, newName: string) => void;
}

export const ThreadList: React.FC<ThreadListProps> = ({ 
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
    <div className="w-64 min-w-[16rem] h-full p-4 overflow-y-auto bg-base-200 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Threads</h2>
      <NewThreadForm
        newThreadName={newThreadName}
        setNewThreadName={setNewThreadName}
        selectedJourneyId={selectedJourneyId}
        setSelectedJourneyId={setSelectedJourneyId}
        journeys={journeys}
        onCreateThread={handleCreateThread}
      />
      <ThreadListItems
        threads={threads}
        currentThreadId={currentThreadId}
        editingThreadId={editingThreadId}
        editingThreadName={editingThreadName}
        setEditingThreadId={setEditingThreadId}
        setEditingThreadName={setEditingThreadName}
        onSelectThread={onSelectThread}
        onRenameThread={handleRenameThread}
        onDeleteThread={onDeleteThread}
      />
    </div>
  );
};

interface NewThreadFormProps {
  newThreadName: string;
  setNewThreadName: (value: string) => void;
  selectedJourneyId: string;
  setSelectedJourneyId: (value: string) => void;
  journeys: Journey[];
  onCreateThread: (e: FormEvent) => void;
}

const NewThreadForm: React.FC<NewThreadFormProps> = ({ newThreadName, setNewThreadName, selectedJourneyId, setSelectedJourneyId, journeys, onCreateThread }) => {
  return <form onSubmit={onCreateThread} className="mb-4">
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
};

interface ThreadListItemsProps {
  threads: Thread[];
  currentThreadId: string | null;
  editingThreadId: string | null;
  editingThreadName: string;
  setEditingThreadId: (id: string | null) => void;
  setEditingThreadName: (name: string) => void;
  onSelectThread: (id: string) => void;
  onRenameThread: (e: FormEvent) => void;
  onDeleteThread: (id: string) => void;
}

const ThreadListItems: React.FC<ThreadListItemsProps> = ({ threads, currentThreadId, editingThreadId, editingThreadName, setEditingThreadId, setEditingThreadName, onSelectThread, onRenameThread, onDeleteThread }) => {
  return <ul>
    {threads.map((thread) => (
      <ThreadListItem
        key={thread.id}
        thread={thread}
        isEditing={editingThreadId === thread.id}
        isSelected={currentThreadId === thread.id}
        editingThreadName={editingThreadName}
        setEditingThreadName={setEditingThreadName}
        onSelectThread={onSelectThread}
        onRenameThread={onRenameThread}
        onDeleteThread={onDeleteThread}
        setEditingThreadId={setEditingThreadId}
      />
    ))}
  </ul>
};

interface ThreadListItemProps {
  thread: Thread;
  isEditing: boolean;
  isSelected: boolean;
  editingThreadName: string;
  setEditingThreadName: (name: string) => void;
  onSelectThread: (id: string) => void;
  onRenameThread: (e: FormEvent) => void;
  onDeleteThread: (id: string) => void;
  setEditingThreadId: (id: string | null) => void;
}

const ThreadListItem: React.FC<ThreadListItemProps> = ({ thread, isEditing, isSelected, editingThreadName, setEditingThreadName, onSelectThread, onRenameThread, onDeleteThread, setEditingThreadId }) => {
  return <li className="mb-2">
    {isEditing ? (
      <form onSubmit={onRenameThread} className="flex">
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
          className={`flex-grow text-left ${isSelected ? 'font-bold' : ''}`}
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
};