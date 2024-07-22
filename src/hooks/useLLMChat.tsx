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
  visible: boolean;
}

interface ChatError {
  message: string;
}

export const useLLMChat = (threadId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ChatError | null>(null);

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

  useEffect(() => {
    if (threadId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [fetchMessages, threadId]);

  const callChat = useCallback(async () => {
    console.log(messages);
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
            visible: true,
          });
        }
        return newMessages;
      });
    }

    const assistantFormData = new FormData();
    assistantFormData.append('content', assistantResponse);
    assistantFormData.append('role', 'assistant');
    assistantFormData.append('message_id', assistantMessageId);

    await fetch(`http://localhost:8000/api/threads/${threadId}/messages`, {
      method: 'POST',
      body: assistantFormData,
    });
  }, [messages, threadId]);

  const sendMessage = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
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
  }, [callChat, threadId]);

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
  }, [callChat, threadId]);

  const startJourney = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/threads/${threadId}`);
      if (!response.ok) throw new Error('Failed to fetch thread');
      const threadData = await response.json();
      
      const invisibleMessage = threadData.messages.find((msg: Message) => !msg.visible);
      if (invisibleMessage) {
        const visibleMessage: Message = { ...invisibleMessage, visible: true };
        setMessages([visibleMessage]);
        
        await fetch(`http://localhost:8000/api/threads/${threadId}/messages/${invisibleMessage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visible: true }),
        });

        await callChat();
      }
    } catch (err) {
      setError({ message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [threadId, callChat]);

  return {
    messages,
    sendMessage,
    editMessage,
    startJourney,
    isLoading,
    error,
  };
};