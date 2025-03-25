"use client";

import { useState, } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { fetcher, } from "@/lib/utils";
import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";

// Create a simple message type that doesn't depend on the UIMessage type
interface SimpleMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'data';
  content: string;
  createdAt: Date | string;
}

export function Chat({
  id,
  initialMessages,
  isReadonly,
  useRawMessages = false,
}: {
  id: string;
  initialMessages: Array<any>;
  isReadonly: boolean;
  useRawMessages?: boolean;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const { mutate } = useSWRConfig();
  const { fetchProtected } = useProtectedApi();
  
  // Process initial messages to ensure they have the right format
  const processedInitialMessages = useRawMessages 
    ? initialMessages 
    : initialMessages.map((msg: any) => ({
        id: msg.id || `${id}-${Date.now()}-${msg.role}`,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt || new Date(),
      }));
  
  // State
  const [messages, setMessages] = useState<SimpleMessage[]>(processedInitialMessages || []);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<"streaming" | "error" | "submitted" | "ready">('ready');
  
  // Debug initialMessages to see if they're correct
  console.log("Initial messages in Chat component:", initialMessages);
  console.log("Processed initial messages:", processedInitialMessages);
  console.log("Current messages state:", messages);
  
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim()) return;
    
    try {
      // Set status to loading
      setStatus('streaming');
      
      // Add user message to UI
      const userMessage: SimpleMessage = {
        id: `${id}-${Date.now()}-user`,
        role: 'user',
        content: input,
        createdAt: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');
      
      // Send to backend using fetchProtected
      const data = await fetchProtected('/llm/chat/message', {
        method: 'POST',
        body: {
          chatId: id,
          message: input,
        },
      });
      
      // Add bot response to UI
      const botMessage: SimpleMessage = {
        id: `${id}-${Date.now()}-bot`,
        role: 'assistant',
        content: data.message || 'I received your message.',
        createdAt: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setStatus('ready');
    }
  };
  
  // Handle message reload
  const reload = async () => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    
    if (!lastUserMessage) return;
    
    try {
      setStatus('streaming');
      
      // Send to backend using fetchProtected
      const data = await fetchProtected('/llm/chat/message', {
        method: 'POST',
        body: {
          chatId: id,
          message: lastUserMessage.content,
        },
      });
      
      // Remove last bot message and add new one
      const filteredMessages = messages.filter(
        (_, index) => index !== messages.length - 1
      );
      
      const botMessage: SimpleMessage = {
        id: `${id}-${Date.now()}-bot`,
        role: 'assistant',
        content: data.message || 'I received your message.',
        createdAt: new Date(),
      };
      
      setMessages([...filteredMessages, botMessage]);
    } catch (error) {
      console.error('Failed to reload message:', error);
      toast.error('Failed to reload message. Please try again.');
    } finally {
      setStatus('ready');
    }
  };
  
  // Simple append function for compatibility
  const append = async (message: SimpleMessage | { content: string; role: 'user' | 'assistant' }) => {
    const fullMessage = 'id' in message ? message : {
      ...message,
      id: `${id}-${Date.now()}-${message.role}`,
      createdAt: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, fullMessage as SimpleMessage]);
    
    if (fullMessage.role === 'user') {
      try {
        const data = await fetchProtected('/llm/chat/message', {
          method: 'POST',
          body: {
            chatId: id,
            message: fullMessage.content,
          },
        });
        
        const botMessage: SimpleMessage = {
          id: `${id}-${Date.now()}-bot`,
          role: 'assistant',
          content: data.message || 'I received your message.',
          createdAt: new Date(),
        };
        
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error) {
        console.error('Failed to append message:', error);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col min-w-0 bg-white/70 dark:bg-black/70 h-[calc(100vh-125px)] rounded-lg">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages.map(msg => ({
            ...msg,
            parts: [{ type: 'text', text: msg.content }]
          })) as any}
          setMessages={setMessages as any}
          reload={reload as any}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form 
          className="flex mx-auto px-4 pb-4 md:pb-5 gap-2 w-full md:max-w-3xl"
          onSubmit={handleSubmit}
        >
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit as any}
              status={status}
              messages={messages.map(msg => ({
                ...msg,
                parts: [{ type: 'text', text: msg.content }]
              })) as any}
              setMessages={setMessages as any}
              append={append as any}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit as any}
        status={status}
        append={append as any}
        messages={messages.map(msg => ({
          ...msg,
          parts: [{ type: 'text', text: msg.content }]
        })) as any}
        setMessages={setMessages as any}
        reload={reload as any}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
