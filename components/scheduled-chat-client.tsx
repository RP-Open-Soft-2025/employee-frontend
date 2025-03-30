"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { LoadingScreen } from "@/components/loading-screen";
import type { RootState } from "@/redux/store";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";
import type { UIMessage } from "ai";
import { setMessages, setChatStatus, clearChat } from "@/redux/features/chat";

interface ScheduledSession {
  session_id: string;
  user_id: string;
  chat_id: string;
  status: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  notes: string | null;
}

interface ChatHistoryResponse {
  chat_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  total_messages: number;
  chat_mode: string;
  is_escalated: boolean;
  created_at: string;
}

export function ScheduledChatClient() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [pendingSession, setPendingSession] = useState<ScheduledSession | null>(
    null
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isReadonly, setIsReadonly] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [allMessages, setAllMessages] = useState<UIMessage[]>([]);

  // Get authentication status and active chat ID from Redux
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const reduxActiveChatId = useSelector(
    (state: RootState) => state.chat.activeChatId
  );

  // Add effect to handle URL parameter and scroll to specific chat
  useEffect(() => {
    if (!loading) {
      const chatId = searchParams.get("id");
      console.log("Chat ID from URL:", chatId);
      if (chatId) {
        // Add a small delay to ensure DOM is updated
        setTimeout(() => {
          const element = document.getElementById(`chat-${chatId}`);
          console.log("Looking for element:", `chat-${chatId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            console.log("Scrolling to chat:", chatId);
          } else {
            console.log("Element not found, retrying in 500ms...");
            // Retry once after a longer delay
            setTimeout(() => {
              const retryElement = document.getElementById(`chat-${chatId}`);
              if (retryElement) {
                retryElement.scrollIntoView({ behavior: "smooth", block: "start" });
                console.log("Successfully scrolled to chat on retry:", chatId);
              } else {
                console.log("Element still not found after retry");
              }
            }, 500);
          }
        }, 1000);
      }
    }
  }, [searchParams, loading]);

  const { fetchProtected } = useProtectedApi();

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        console.log(
          "Authenticated, fetching scheduled sessions and chat history"
        );
        await Promise.all([fetchScheduledSession(), fetchChatHistory()]);
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [isAuthenticated]);

  // Fetch scheduled session and check status
  const fetchScheduledSession = async () => {
    try {
      const result = await fetchProtected("/employee/scheduled-sessions");

      console.log("Scheduled sessions response:", result);

      if (result && result.length > 0) {
        // First priority: Find an active session
        let sessionToUse = result.find(
          (session: ScheduledSession) => session.status === "active"
        );

        console.log("Active session found:", sessionToUse);

        if (sessionToUse) {
          // If an active session exists, load it immediately
          console.log("Setting active chat ID to:", sessionToUse.chat_id);
          setActiveChatId(sessionToUse.chat_id);
          dispatch(setChatStatus("active"));
          setIsReadonly(false); // Active sessions are not read-only
          await fetchChatMessages(sessionToUse.chat_id);
          return;
        }

        setIsReadonly(true);

        // Second priority: Find a pending session
        sessionToUse = result.find(
          (session: ScheduledSession) => session.status === "pending"
        );

        console.log("Pending session found:", sessionToUse);

        if (sessionToUse) {
          // If status is pending, store it for the start button
          setPendingSession(sessionToUse);
        }
      } else {
        setIsReadonly(true);
        console.log("No scheduled sessions found or empty response");
      }
    } catch (error) {
      console.error("Failed to fetch scheduled sessions:", error);
    }
  };

  // Modified fetch chat messages for a specific chat ID
  const fetchChatMessages = async (id: string): Promise<UIMessage[] | null> => {
    try {
      console.log("Fetching messages for chat ID:", id);
      const response = await fetchProtected(`/employee/chats/${id}/messages`);
      // console.log("Chat messages response:", response);

      if (response?.messages) {
        const uiMessages: UIMessage[] = response.messages.map(
          (message: any, index: number) => ({
            id: `${id}-msg-${index}`,
            role: message.sender === "bot" ? "assistant" : "user",
            content: message.text,
            createdAt: new Date(message.timestamp).toISOString(),
          })
        );

        // If this is the active chat, update initialMessages
        if (id === activeChatId) {
          setInitialMessages(uiMessages);
          dispatch(setMessages(uiMessages));
        }

        return uiMessages;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
      return null;
    }
  };

  // Modified fetchChatHistory function to also fetch messages for each chat
  const fetchChatHistory = async () => {
    try {
      const result = await fetchProtected("/employee/chats");
      console.log("Chat history:", result);
      if (result?.chats && Array.isArray(result.chats)) {
        // sort chats based on date with latest chat at the end
        result.chats.sort((a: ChatHistoryResponse, b: ChatHistoryResponse) => {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        const chats = result.chats.map((chat: ChatHistoryResponse) => ({
          id: chat.chat_id,
          lastMessage: chat.last_message,
          lastMessageTime: chat.last_message_time,
          mode: chat.chat_mode,
          isEscalated: chat.is_escalated,
          totalMessages: chat.total_messages,
          unreadCount: chat.unread_count,
          created_at: chat.created_at,
        }));

        // console.log("Chats:", chats);

        // Fetch messages for all chats
        const allChatMessages: UIMessage[] = [];
        for (const chat of chats) {
          try {
            const messages = await fetchChatMessages(chat.id);
            if (messages) {
              // Add created_at to each message's ID
              const messagesWithCreatedAt = messages.map((msg) => ({
                ...msg,
                id: `${chat.id}-${chat.created_at}-${msg.id.split("-").pop()}`,
              }));
              allChatMessages.push(...messagesWithCreatedAt);
            }
          } catch (error) {
            console.error(
              `Failed to fetch messages for chat ${chat.id}:`,
              error
            );
          }
        }
        // console.log("All chat messages:", allChatMessages);
        setAllMessages(allChatMessages);
      }
    } catch (e) {
      console.error("Failed to fetch chat history:", e);
    }
  };

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      dispatch(clearChat());
    };
  }, [dispatch]);

  if (!isAuthenticated || loading) {
    return <LoadingScreen />;
  }

  // If we have an active chat ID, render the chat interface
  // Use the chat ID that is available (prefer local state but fall back to Redux)
  const chatIdToUse =
    activeChatId || reduxActiveChatId || pendingSession?.chat_id || null;
  console.log("Rendering chat with ID:", chatIdToUse);

  return (
    <>
      <Chat
        key={chatIdToUse}
        id={chatIdToUse || ""}
        initialMessages={allMessages}
        isReadonly={isReadonly}
        useRawMessages={true}
        onReadonlyChange={setIsReadonly}
      />
      <DataStreamHandler id={chatIdToUse || ""} />
    </>
  );
}
