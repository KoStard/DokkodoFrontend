import React, { useState, useRef, useEffect } from 'react';
import { useLLMChat } from '@/hooks/useLLMChat';
import ReactMarkdown from 'react-markdown';

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
  visible: boolean;
}

const OrnamentalSeparator = () => (
  <div className="my-4 flex items-center">
    <div className="flex-grow border-t border-gray-300"></div>
    <div className="mx-4 text-gray-500">✦</div>
    <div className="flex-grow border-t border-gray-300"></div>
  </div>
);

const MagicalDocumentChat: React.FC<ChatProps> = ({ threadId }) => {
  const { messages, sendMessage, editMessage, startJourney, isLoading, error } = useLLMChat(threadId);
  const [input, setInput] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const visibleMessages = messages.filter(message => message.visible);
  const hasInvisibleMessage = messages.some(message => !message.visible);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-6 bg-gradient-to-b from-white to-gray-50 w-full">
      <div className="flex-grow overflow-y-auto" ref={chatContainerRef}>
        {visibleMessages.map((message: Message, index: number) => (
          <React.Fragment key={message.id}>
            {index > 0 && <OrnamentalSeparator />}
            <div className={`mb-4 ${message.role === 'user' ? 'text-blue-600' : 'text-purple-600'}`}>
              <ReactMarkdown className="prose max-w-none">
                {message.content}
              </ReactMarkdown>
              {isLoading && message.id === visibleMessages[visibleMessages.length - 1].id && (
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
                  className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                  onClick={() => handleEdit(message.id)}
                  disabled={isLoading || editingIndex !== null}
                >
                  Edit
                </button>
              )}
            </div>
          </React.Fragment>
        ))}
        {isLoading && <div className="text-gray-500 italic mt-4">Wisdom is pondering...</div>}
        {error && <div className="text-red-500 mt-4">Error: {error.message}</div>}
      </div>
      <div className="mt-6">
        {hasInvisibleMessage && visibleMessages.length === 0 ? (
          <button
            onClick={startJourney}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            Begin Your Journey
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              ref={inputRef}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={editingIndex !== null ? "Edit your thoughts..." : "Share your thoughts..."}
              rows={3}
            />
            <div className="flex items-center space-x-4">
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
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Attach Files
              </button>
              <button 
                type="submit" 
                className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                disabled={isLoading}
              >
                {editingIndex !== null ? 'Update' : 'Send'}
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
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
            {files.length > 0 && (
              <div className="mt-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center mt-1">
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default MagicalDocumentChat;