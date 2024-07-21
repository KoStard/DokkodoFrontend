import React, { useState, useRef, useEffect } from 'react';
import { useLLMChat } from '@/hooks/useLLMChat';

interface ChatProps {
  threadId: string;
}

interface MediaFile {
  filename: string;
  content_type: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  media_files?: MediaFile[];
}

const Chat: React.FC<ChatProps> = ({ threadId }) => {
  const [input, setInput] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const { messages, sendMessage, editMessage, isLoading, error } = useLLMChat(threadId);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || files.length > 0) && !isLoading) {
      const formData = new FormData();
      formData.append('content', input);
      formData.append('role', 'user');
      files.forEach((file) => formData.append('files', file));

      setInput('');
      setFiles([]);

      if (editingIndex !== null) {
        await editMessage(editingIndex, formData);
        setEditingIndex(null);
      } else {
        await sendMessage(formData);
      }
    }
  };

  const handleEdit = (messageId: string) => {
    const messageToEdit = messages.find(msg => msg.id === messageId);
    if (messageToEdit) {
      setEditingIndex(messageId);
      setInput(messageToEdit.content);
      setFiles(messageToEdit.media_files?.map(file => new File([], file.filename, { type: file.content_type })) || []);
      inputRef.current?.focus();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFiles([...files, ...Array.from(e.dataTransfer.files)]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-screen flex-grow">
      <div className="flex-grow overflow-y-auto p-4" ref={chatContainerRef}>
        {messages.map((message: Message) => (
          <div key={message.id} className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'}`}>
            <div className="chat-bubble">
              <span className="font-bold">{message.role}: </span>
              <span>{message.content}</span>
              {isLoading && message.id === messages[messages.length - 1].id && (
                <span className="animate-pulse">▮</span>
              )}
              {message.media_files && message.media_files.length > 0 && (
                <div className="mt-2">
                  {message.media_files.map((file, fileIndex) => (
                    <div key={fileIndex} className="mt-1">
                      {file.content_type.startsWith('image/') ? (
                        <img src={`http://localhost:8000/api/media/${file.filename}`} alt={file.filename} className="max-w-xs" />
                      ) : file.content_type.startsWith('audio/') ? (
                        <audio controls src={`http://localhost:8000/api/media/${file.filename}`} />
                      ) : (
                        <a href={`http://localhost:8000/api/media/${file.filename}`} target="_blank" rel="noopener noreferrer">{file.filename}</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {message.role === 'user' && (
                <button
                  className="btn btn-xs ml-2"
                  onClick={() => handleEdit(message.id)}
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div
            className="border-2 border-dashed border-gray-300 p-4 rounded-lg"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input
              ref={inputRef}
              className="input input-bordered w-full"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={editingIndex !== null ? "Edit your message..." : "Type your message here..."}
            />
            <div className="mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
              >
                Attach Files
              </button>
              {files.length > 0 && (
                <div className="mt-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center mt-1">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="btn btn-xs btn-ghost ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow" disabled={isLoading}>
              {editingIndex !== null ? 'Update' : 'Send'}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingIndex(null);
                  setInput('');
                  setFiles([]);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;