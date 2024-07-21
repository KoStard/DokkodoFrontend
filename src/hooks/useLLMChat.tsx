import { useState, useEffect, useCallback } from 'react';

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

interface ChatError {
  message: string;
}

export const useLLMChat = (threadId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  useEffect(() => {
    if (threadId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [threadId]);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/threads/${threadId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const sendMessage = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const content = formData.get('content') as string;
      const role = formData.get('role') as 'user' | 'assistant';
      const files = formData.getAll('files') as File[];
      
      const userMessage: Message = {
        id: Date.now().toString(),
        role,
        content,
        media_files: files.map(file => ({
          filename: file.name,
          content_type: file.type
        }))
      };

      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Send user message to the backend
      await fetch(`http://localhost:8000/api/threads/${threadId}/messages`, {
        method: 'POST',
        body: formData,
      });

      // Start streaming the assistant's response
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) throw new Error('Failed to get assistant response');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get response reader');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          lastMessage.content += text;
          return newMessages;
        });
      }

      setIsStreaming(false);
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const editMessage = useCallback(async (messageIndex: number, formData: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const messageId = messages[messageIndex].id;
      const response = await fetch(`http://localhost:8000/api/threads/${threadId}/messages/${messageId}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to edit message');
      
      const content = formData.get('content') as string;
      const files = formData.getAll('files') as File[];
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content,
          media_files: files.map(file => ({
            filename: file.name,
            content_type: file.type
          }))
        };
        return newMessages.slice(0, messageIndex + 1);
      });
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [threadId, messages]);

  return {
    messages,
    sendMessage,
    editMessage,
    isLoading,
    isStreaming,
    error,
  };
};