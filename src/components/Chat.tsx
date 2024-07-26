import React, { useState, useRef, useEffect } from 'react';
import { useLLMChat } from '@/hooks/useLLMChat';
import ReactMarkdown from 'react-markdown';
import { Message, MediaFile } from '@/types';

interface ChatProps {
  threadId: string;
}

export const Chat: React.FC<ChatProps> = ({ threadId }) => {
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
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
    <div className="flex flex-col h-screen w-full max-w-none mx-auto p-6 bg-gray-400 bg-opacity-10 from-base-100 to-base-200">
      <ChatMessages
        messages={visibleMessages}
        isLoading={isLoading}
        error={error}
        onEditMessage={handleEdit}
        chatContainerRef={chatContainerRef}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        files={files}
        isLoading={isLoading}
        editingIndex={editingIndex}
        hasInvisibleMessage={hasInvisibleMessage}
        visibleMessagesCount={visibleMessages.length}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onFileChange={handleFileChange}
        onRemoveFile={removeFile}
        onStartJourney={startJourney}
        inputRef={inputRef}
        fileInputRef={fileInputRef}
      />
    </div>
  );
};

const ChatMessages = ({ messages, isLoading, error, onEditMessage, chatContainerRef }) => (
  <div className="flex-grow overflow-y-auto" ref={chatContainerRef}>
    {messages.map((message: Message, index: number) => (
      <React.Fragment key={message.id}>
        {index > 0 && <OrnamentalSeparator />}
        <MessageItem
          message={message}
          isLoading={isLoading}
          isLastMessage={index === messages.length - 1}
          onEditMessage={onEditMessage}
        />
      </React.Fragment>
    ))}
    {isLoading && <div className="text-base-content opacity-50 italic mt-4">Wisdom is pondering...</div>}
    {error && <div className="text-error mt-4">Error: {error.message}</div>}
  </div>
);

const MessageItem = ({ message, isLoading, isLastMessage, onEditMessage }) => (
  <div className={`mb-4 ${message.role === 'user' ? 'text-primary' : 'text-secondary'}`}>
    <ReactMarkdown className="prose max-w-none [&>p]:mb-4">
      {message.content}
    </ReactMarkdown>
    {isLoading && isLastMessage && <span className="animate-pulse">▮</span>}
    <MediaFiles mediaFiles={message.media_files} />
    {message.role === 'user' && (
      <button
        className="text-xs text-base-content opacity-50 hover:opacity-100 mt-2"
        onClick={() => onEditMessage(message.id)}
      >
        Edit
      </button>
    )}
  </div>
);

const MediaFiles = ({ mediaFiles }) => (
  mediaFiles && mediaFiles.length > 0 && (
    <div className="mt-2">
      {mediaFiles.map((file: MediaFile, fileIndex: number) => (
        <MediaFileItem key={fileIndex} file={file} />
      ))}
    </div>
  )
);

const MediaFileItem = ({ file }) => {
  const fileUrl = `http://localhost:8000/api/media/${file.filename}`;
  
  if (file.content_type.startsWith('image/')) {
    return <img src={fileUrl} alt={file.filename} className="max-w-xs" />;
  } else if (file.content_type.startsWith('audio/')) {
    return <audio controls src={fileUrl} />;
  } else {
    return <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="link link-accent">{file.filename}</a>;
  }
};

const ChatInput = ({
  input,
  setInput,
  files,
  isLoading,
  editingIndex,
  hasInvisibleMessage,
  visibleMessagesCount,
  onSubmit,
  onKeyDown,
  onFileChange,
  onRemoveFile,
  onStartJourney,
  inputRef,
  fileInputRef
}) => (
  <div className="mt-6">
    {hasInvisibleMessage && visibleMessagesCount === 0 ? (
      <button
        onClick={onStartJourney}
        className="btn btn-primary w-full"
        disabled={isLoading}
      >
        Begin Your Journey
      </button>
    ) : (
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          ref={inputRef}
          className="textarea textarea-bordered w-full focus:textarea-primary resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={editingIndex !== null ? "Edit your thoughts..." : "Share your thoughts..."}
          rows={3}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          multiple
          className="hidden"
        />
        <ChatInputButtons
          onAttachFiles={() => fileInputRef.current?.click()}
          isLoading={isLoading}
          editingIndex={editingIndex}
          onCancelEdit={() => {
            setInput('');
            setEditingIndex(null);
          }}
        />
        <AttachedFiles files={files} onRemoveFile={onRemoveFile} />
      </form>
    )}
  </div>
);

const ChatInputButtons = ({ onAttachFiles, isLoading, editingIndex, onCancelEdit }) => (
  <div className="flex items-center space-x-4">
    <button
      type="button"
      onClick={onAttachFiles}
      className="btn btn-secondary btn-outline"
    >
      Attach Files
    </button>
    <button
      type="submit"
      className="btn btn-primary"
      disabled={isLoading}
    >
      {editingIndex !== null ? 'Update' : 'Send'}
    </button>
    {editingIndex !== null && (
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onCancelEdit}
      >
        Cancel
      </button>
    )}
  </div>
);

const AttachedFiles = ({ files, onRemoveFile }) => (
  files.length > 0 && (
    <div className="mt-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center mt-1">
          <span className="text-sm text-base-content opacity-70">{file.name}</span>
          <button
            type="button"
            onClick={() => onRemoveFile(index)}
            className="ml-2 text-xs text-error hover:text-error-content"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
);

const OrnamentalSeparator = () => (
  <div className="my-4 flex items-center">
    <div className="flex-grow border-t border-base-300"></div>
    <div className="mx-4 text-base-300">✦</div>
    <div className="flex-grow border-t border-base-300"></div>
  </div>
);