'use client';

import { useState, useRef, useEffect } from 'react';
import { useLLMChat } from '@/hooks/useLLMChat';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, editMessage, isLoading, error } = useLLMChat();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      if (editingIndex !== null) {
        // Edit the message and discard subsequent history
        editMessage(editingIndex, input);
        setEditingIndex(null);
      } else {
        // Send a new message
        sendMessage(input);
      }
      setInput('');
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setInput(messages[index].content);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto p-4" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'}`}>
            <div className="chat-bubble">
              <span className="font-bold">{message.role}: </span>
              <span>{message.content}</span>
              {message.role === 'user' && index !== messages.length - 1 && (
                <button 
                  className="btn btn-xs ml-2" 
                  onClick={() => handleEdit(index)}
                  disabled={isLoading || editingIndex !== null}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="alert alert-info mt-4">Loading...</div>}
        {error && <div className="alert alert-error mt-4">Error: {error.message}</div>}
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            className="input input-bordered flex-grow"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={editingIndex !== null ? "Edit your message..." : "Type your message here..."}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {editingIndex !== null ? 'Update' : 'Send'}
          </button>
          {editingIndex !== null && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setEditingIndex(null);
                setInput('');
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  );
}