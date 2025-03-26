"use client";

import { useState, useEffect } from "react";
import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";

// Create a simple message type that doesn't depend on the UIMessage type
interface SimpleMessage {
  id: string;
  role: "user" | "assistant" | "system" | "function" | "data";
  content: string;
  createdAt: Date | string;
}

export function Chat({
  id,
  initialMessages,
  isReadonly,
  useRawMessages = false,
  pendingSession,
  onStartSession,
}: {
  id: string;
  initialMessages: Array<any>;
  isReadonly: boolean;
  useRawMessages?: boolean;
  pendingSession?: {
    session_id: string;
    scheduled_at: string;
    notes: string | null;
  } | null;
  onStartSession?: (chatId: string) => void;
}) {
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
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "streaming" | "error" | "submitted" | "ready"
  >("ready");

  // Add effect to log messages when they change
  useEffect(() => {
    setMessages(processedInitialMessages);
  }, [processedInitialMessages]);

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // const { data: votes } = useSWR<Array<Vote>>(
  //   messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
  //   fetcher
  // );

  const votes: Array<Vote> = [];

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim()) return;

    try {
      // Set status to loading
      setStatus("streaming");

      // Add user message to UI
      const userMessage: SimpleMessage = {
        id: `${id}-${Date.now()}-user`,
        role: "user",
        content: input,
        createdAt: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");

      // Send to backend using fetchProtected
      const data = await fetchProtected("/llm/chat/message", {
        method: "POST",
        body: {
          chatId: id,
          message: input,
        },
      });

      // Add bot response to UI
      const botMessage: SimpleMessage = {
        id: `${id}-${Date.now()}-bot`,
        role: "assistant",
        content: data.message || "I received your message.",
        createdAt: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setStatus("submitted");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setStatus("ready");
    }
  };

  // Handle message reload
  const reload = async () => {
    // Find the last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage) return;

    try {
      setStatus("streaming");

      // Send to backend using fetchProtected
      const data = await fetchProtected("/llm/chat/message", {
        method: "POST",
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
        role: "assistant",
        content: data.message || "I received your message.",
        createdAt: new Date(),
      };

      setMessages([...filteredMessages, botMessage]);
    } catch (error) {
      console.error("Failed to reload message:", error);
      toast.error("Failed to reload message. Please try again.");
    } finally {
      setStatus("ready");
    }
  };

  // Simple append function for compatibility
  const append = async (
    message: SimpleMessage | { content: string; role: "user" | "assistant" }
  ) => {
    const fullMessage =
      "id" in message
        ? message
        : {
            ...message,
            id: `${id}-${Date.now()}-${message.role}`,
            createdAt: new Date(),
          };

    setMessages((prevMessages) => [
      ...prevMessages,
      fullMessage as SimpleMessage,
    ]);

    if (fullMessage.role === "user") {
      try {
        const data = await fetchProtected("/llm/chat/message", {
          method: "POST",
          body: {
            chatId: id,
            message: fullMessage.content,
          },
        });

        const botMessage: SimpleMessage = {
          id: `${id}-${Date.now()}-bot`,
          role: "assistant",
          content: data.message || "I received your message.",
          createdAt: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Failed to append message:", error);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col min-w-0 bg-white/70 dark:bg-black/70 h-[calc(100vh-125px)] rounded-lg">
        <ChatHeader chatId={id} isReadonly={isReadonly} />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={
            messages.map((msg) => ({
              ...msg,
              parts: [{ type: "text", text: msg.content }],
            })) as any
          }
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
              messages={
                messages.map((msg) => ({
                  ...msg,
                  parts: [{ type: "text", text: msg.content }],
                })) as any
              }
              setMessages={setMessages as any}
              append={append as any}
            />
          )}
        </form>

        {isReadonly && !(id == "" || id === null) && pendingSession && (
          <div className="flex mx-auto px-4 pb-4 md:pb-5 gap-2 w-full md:max-w-3xl">
            <div className="flex flex-col w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">Scheduled Chat Available</h3>
                  <span className="text-sm text-muted-foreground">
                    {new Date(pendingSession.scheduled_at).toLocaleString()}
                  </span>
                </div>
                {pendingSession.notes && (
                  <p className="text-sm text-muted-foreground">
                    {pendingSession.notes}
                  </p>
                )}
                <button
                  onClick={() => onStartSession?.(id)}
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        )}

        {isReadonly && (id == "" || id === null) && (
          <div className="flex mx-auto px-4 pb-4 md:pb-5 gap-2 w-full md:max-w-3xl">
            <div className="flex flex-col w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm p-4">
              <p className="text-sm text-muted-foreground text-center">No Active/Scheduled sessions available</p>
            </div>
          </div>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit as any}
        status={status}
        append={append as any}
        messages={
          messages.map((msg) => ({
            ...msg,
            parts: [{ type: "text", text: msg.content }],
          })) as any
        }
        setMessages={setMessages as any}
        reload={reload as any}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
