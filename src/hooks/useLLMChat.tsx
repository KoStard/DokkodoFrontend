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

  const callChat = useCallback(async () => {
    // Start streaming the assistant's response
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) throw new Error('Failed to get assistant response');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');

    let assistantResponse = '';
    let assistantMessageId = crypto.randomUUID();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = new TextDecoder().decode(value);
      assistantResponse += text;
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = assistantResponse;
        } else {
          newMessages.push({
            id: assistantMessageId,
            role: 'assistant',
            content: assistantResponse,
          });
        }
        return newMessages;
      });
    }

    // Save the assistant's message to the thread
    const assistantFormData = new FormData();
    assistantFormData.append('content', assistantResponse);
    assistantFormData.append('role', 'assistant');
    assistantFormData.append('message_id', assistantMessageId);

    await fetch(`http://localhost:8000/api/threads/${threadId}/messages`, {
      method: 'POST',
      body: assistantFormData,
    });
  }, [threadId]);

  const sendMessage = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Send user message to the backend
      const message = await (await fetch(`http://localhost:8000/api/threads/${threadId}/messages`, {
        method: 'POST',
        body: formData,
      })).json();

      setMessages(prevMessages => [...prevMessages, message]);

      await callChat();
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const editMessage = useCallback(async (messageId: string, formData: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/threads/${threadId}/messages/${messageId}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to edit message');

      const content = formData.get('content') as string;
      const files = formData.getAll('files') as File[];

      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const messageIndex = newMessages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content,
            media_files: files.map(file => ({
              filename: file.name,
              content_type: file.type
            }))
          };
          return newMessages.slice(0, messageIndex + 1);
        }
        return newMessages;
      });

      await callChat();
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  return {
    messages,
    sendMessage,
    editMessage,
    isLoading,
    error,
  };
};