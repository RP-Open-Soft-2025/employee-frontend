import { useState, useCallback } from 'react';
import type { UIMessage } from 'ai';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

// Environment variable for API URL - fallback to default if not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseChatOptions {
  id: string;
  initialMessages?: UIMessage[];
  onError?: (error: Error) => void;
}

// Creating a compatible message type that works with both the UI and our backend
type CustomUIMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'data';
  content: string;
  createdAt: string | Date;
};

export function useChatWithDirectBackend({
  id,
  initialMessages = [],
  onError,
}: UseChatOptions) {
  // Debug the incoming initialMessages
  console.log('useChatWithDirectBackend initialMessages:', initialMessages);
  
  // Convert initialMessages to our CustomUIMessage format if needed
  const formattedInitialMessages = initialMessages.map(msg => ({
    ...msg,
    createdAt: msg.createdAt 
      ? (msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt as string))
      : new Date()
  })) as CustomUIMessage[];
  
  console.log('Formatted initial messages:', formattedInitialMessages);
  
  const [messages, setMessages] = useState<CustomUIMessage[]>(formattedInitialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'streaming'>('idle');

  // Function to send a message directly to the backend
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!input.trim() || status !== 'idle') {
        return;
      }

      try {
        // Set status to loading
        setStatus('loading');

        // Create a new user message
        const userMessage: CustomUIMessage = {
          id: nanoid(),
          role: 'user',
          content: input,
          createdAt: new Date().toISOString(),
        };

        // Add the user message to the messages list
        setMessages((messages) => [...messages, userMessage]);
        
        // Clear the input field
        setInput('');

        console.log('Sending message to backend:', input);
        
        // Send the message to the backend
        const response = await fetch(`${API_URL}/llm/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: id,
            message: input,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send message: ${errorText}`);
        }

        // Parse the response
        const responseData = await response.json();
        console.log('Received response from backend:', responseData);

        // Create an assistant message from the response
        const assistantMessage: CustomUIMessage = {
          id: nanoid(),
          role: 'assistant',
          content: responseData.message || 'I received your message.',
          createdAt: new Date().toISOString(),
        };

        // Add the assistant message to the messages list
        setMessages((messages) => [...messages, assistantMessage]);
      } catch (error) {
        console.error('Failed to send message:', error);
        if (onError && error instanceof Error) {
          onError(error);
        } else {
          toast.error('Failed to send message. Please try again.');
        }
      } finally {
        // Set status back to idle
        setStatus('idle');
      }
    },
    [id, input, status, onError]
  );

  // Custom function to append a new message (simpler than the AI SDK version)
  const append = useCallback(
    async (message: CustomUIMessage | { content: string; role: 'user' | 'assistant' }) => {
      // Convert to CustomUIMessage if needed
      const completeMessage: CustomUIMessage = 'id' in message
        ? message as CustomUIMessage
        : {
            id: nanoid(),
            role: message.role,
            content: message.content,
            createdAt: new Date().toISOString(),
          };

      // Add to messages
      setMessages((messages) => [...messages, completeMessage]);

      // If it's a user message, simulate a response (only for programmatic append)
      if (completeMessage.role === 'user') {
        try {
          const response = await fetch(`${API_URL}/llm/chat/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: id,
              message: completeMessage.content,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to get response: ${response.statusText}`);
          }

          const responseData = await response.json();
          
          const assistantMessage: CustomUIMessage = {
            id: nanoid(),
            role: 'assistant',
            content: responseData.message || 'I received your message.',
            createdAt: new Date().toISOString(),
          };

          setMessages((messages) => [...messages, assistantMessage]);
        } catch (error) {
          console.error('Failed to get response:', error);
          if (onError && error instanceof Error) {
            onError(error);
          }
        }
      }
    },
    [id, onError]
  );

  // Function to reload the last user-assistant exchange
  const reload = useCallback(async () => {
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    
    if (lastUserMessageIndex === -1) {
      return; // No user message found
    }
    
    // Calculate the actual index in the messages array
    const userMessageIndex = messages.length - 1 - lastUserMessageIndex;
    const userMessage = messages[userMessageIndex];
    
    // Remove all messages after the last user message
    const newMessages = messages.slice(0, userMessageIndex + 1);
    setMessages(newMessages);
    
    // Send the user message again
    try {
      setStatus('loading');
      
      const response = await fetch(`${API_URL}/llm/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: id,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      const assistantMessage: CustomUIMessage = {
        id: nanoid(),
        role: 'assistant',
        content: responseData.message || 'I received your message.',
        createdAt: new Date().toISOString(),
      };
      
      setMessages((messages) => [...messages, assistantMessage]);
    } catch (error) {
      console.error('Failed to reload message:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setStatus('idle');
    }
  }, [id, messages, onError]);

  // Simpler stop function for consistency with AI SDK
  const stop = useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    handleSubmit,
    status,
    append,
    reload,
    stop,
  };
} 