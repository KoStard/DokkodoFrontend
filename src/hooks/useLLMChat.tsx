import { useState, useEffect, useCallback } from 'react';
import { Message, ChatError } from '@/types';

export const useLLMChat = (threadId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [error, setError] = useState<ChatError | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/threads/${threadId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      if (data.messages) setIsStarted(true);
      setMessages(data.messages);
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (threadId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [fetchMessages, threadId]);

  const saveAssistantMessage = async (content: string, messageId: string) => {
    const assistantFormData = new FormData();
    assistantFormData.append('content', content);
    assistantFormData.append('role', 'assistant');
    assistantFormData.append('message_id', messageId);

    await fetch(`http://localhost:8000/api/threads/${threadId}/messages`, {
      method: 'POST',
      body: assistantFormData,
    });
  };

  const updateAssistantMessage = useCallback((content: string, messageId: string) => {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.content = content;
      } else {
        newMessages.push({
          id: messageId,
          role: 'assistant',
          content: content,
          visible: true,
        });
      }
      return newMessages;
    });
  }, []);

  const callChat = async (messages: Message[]) => {
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
      updateAssistantMessage(assistantResponse, assistantMessageId);
    }

    await saveAssistantMessage(assistantResponse, assistantMessageId);
  };

  const sendMessage = useCallback(async (formData: FormData) => {
    setIsStarted(true);
    setIsLoading(true);
    setError(null);
    try {
      const message = await (await fetch(`http://localhost:8000/api/threads/${threadId}/messages`, {
        method: 'POST',
        body: formData,
      })).json();

      const newMessages = [...messages, message];
      setMessages([...newMessages]);
      await callChat(newMessages);
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, threadId]);

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

      const newMessages = (prevMessages => {
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
      })(messages);

      setMessages(messages);
      await callChat(messages);
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [messages, threadId]);

  const startJourney = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsStarted(true);
    // Additional logic for starting a journey can be added here
    setIsLoading(false);
  }, []);

  return {
    messages,
    sendMessage,
    editMessage,
    startJourney,
    isLoading,
    error,
  };
};