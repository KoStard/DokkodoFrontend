import { useState, useCallback } from 'react';
import { Message } from '@/types';

export function useLLMChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessageToAPI = useCallback(async (updatedMessages: Message[]) => {
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: updatedMessages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      const chunk = decoder.decode(value);
      assistantMessage += chunk;

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = assistantMessage;
        } else {
          newMessages.push({ role: 'assistant', content: assistantMessage });
        }
        return newMessages;
      });
    }
  }, []);

  const sendMessage = useCallback(async (newMessage: string) => {
    setIsLoading(true);
    setError(null);

    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: newMessage }
    ];

    setMessages(updatedMessages);

    try {
      await sendMessageToAPI(updatedMessages);
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, sendMessageToAPI]);

  const editMessage = useCallback(async (index: number, newContent: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Keep only messages up to the edited message
      const updatedMessages = messages.slice(0, index);
      // Add the edited message
      updatedMessages.push({ role: 'user', content: newContent });

      setMessages(updatedMessages);

      await sendMessageToAPI(updatedMessages);
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, sendMessageToAPI]);

  return {
    messages,
    sendMessage,
    editMessage,
    isLoading,
    error,
  };
}