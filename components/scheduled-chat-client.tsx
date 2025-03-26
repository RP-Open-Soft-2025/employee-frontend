"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { LoadingScreen } from "@/components/loading-screen";
import type { RootState } from "@/redux/store";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";
import type { UIMessage } from "ai";
import { setMessages, setChatStatus, clearChat } from "@/redux/features/chat";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

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

interface ChatHistory {
  id: string;
  lastMessage: string;
  lastMessageTime: string;
  mode: string;
  isEscalated: boolean;
  totalMessages: number;
  unreadCount: number;
}

interface ChatHistoryResponse {
  chat_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  total_messages: number;
  chat_mode: string;
  is_escalated: boolean;
}

export function ScheduledChatClient() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingSession, setPendingSession] = useState<ScheduledSession | null>(
    null
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isReadonly, setIsReadonly] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [allMessages, setAllMessages] = useState<UIMessage[]>([]);
  const [initiatingChat, setInitiatingChat] = useState<string | null>(null);

  // Get authentication status and active chat ID from Redux
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const reduxActiveChatId = useSelector(
    (state: RootState) => state.chat.activeChatId
  );

  // Get chat status from Redux
  const chatStatus = useSelector((state: RootState) => state.chat.chatStatus);

  const { fetchProtected } = useProtectedApi();

  // Initial data loading
  useEffect(() => {
    if (isAuthenticated) {
      console.log(
        "Authenticated, fetching scheduled sessions and chat history"
      );
      fetchScheduledSession();
      fetchChatHistory();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  // Handle active chat from Redux
  useEffect(() => {
    const chatId = activeChatId;
    console.log("activeChatId effect running:", chatId);

    if (chatId && !loading) {
      console.log("Fetching messages for active chat:", chatId);

      // Use inline function to avoid stale closure issues
      (async () => {
        try {
          setLoading(true);
          const response = await fetchProtected(
            `/employee/chats/${chatId}/messages`
          );
          console.log("Chat messages response:", response);

          // Process messages only if component is still mounted and chatId hasn't changed
          if (response?.messages && chatId === activeChatId) {
            const uiMessages: UIMessage[] = response.messages.map(
              (message: any, index: number) => ({
                id: `${chatId}-msg-${index}`,
                role: message.sender === "bot" ? "assistant" : "user",
                content: message.text,
                createdAt: new Date(message.timestamp).toISOString(),
              })
            );

            setInitialMessages(uiMessages);

            // Get chat mode for state tracking, but always keep editable
            const chatMode = response.chat_mode || "active";
            console.log("Chat mode from useEffect:", chatMode);

            dispatch(setChatStatus(chatMode));

            // Only update messages in Redux, but don't affect activeChatId
            dispatch(setMessages(uiMessages));

            if (response.is_escalated) {
              console.log("Chat is escalated to HR");
            }
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        } finally {
          // Only set loading to false if component is still mounted and chatId hasn't changed
          if (chatId === activeChatId) {
            setLoading(false);
          }
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]); // Only depend on activeChatId, use refs for other dependencies

  // Fetch scheduled session and check status
  const fetchScheduledSession = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Modified fetch chat messages for a specific chat ID
  const fetchChatMessages = async (id: string): Promise<UIMessage[] | null> => {
    try {
      console.log("Fetching messages for chat ID:", id);
      const response = await fetchProtected(`/employee/chats/${id}/messages`);
      console.log("Chat messages response:", response);

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

  // Initiate a pending chat session
  const initiateChat = async (chatId: string) => {
    try {
      console.log("Initiating chat with ID:", chatId);
      setInitiatingChat(chatId);

      // Update local state and Redux
      setActiveChatId(chatId);
      dispatch(setChatStatus("active"));

      // Call API to initiate the chat
      const response = await fetchProtected("/llm/chat/initiate-chat", {
        method: "PATCH",
        body: {
          chatId,
          status: "bot",
        },
      });

      console.log("Chat initiation response:", response);

      // Make isReadonly false
      setIsReadonly(false);

      // Load the chat messages
      await fetchChatMessages(chatId);

      // Clear the pending session since it's now active
      setPendingSession(null);
    } catch (error) {
      console.error("Failed to initiate chat:", error);
      // Don't clear activeChatId on error
    } finally {
      setInitiatingChat(null);
    }
  };

  // Modified fetchChatHistory function to also fetch messages for each chat
  const fetchChatHistory = async () => {
    try {
      const result = await fetchProtected("/employee/chats");
      console.log("Chat history:", result);
      if (result && result.chats && Array.isArray(result.chats)) {
        // sort chats based on date with latest chat at the end
        result.chats.sort((a: ChatHistoryResponse, b: ChatHistoryResponse) => {
          return (
            new Date(a.last_message_time).getTime() -
            new Date(b.last_message_time).getTime()
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
        }));

        // Fetch messages for all chats
        const allChatMessages: UIMessage[] = [];
        for (const chat of chats) {
          try {
            const messages = await fetchChatMessages(chat.id);
            if (messages) {
              allChatMessages.push(...messages);
            }
          } catch (error) {
            console.error(
              `Failed to fetch messages for chat ${chat.id}:`,
              error
            );
          }
        }

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
  const chatIdToUse = activeChatId || reduxActiveChatId;
  console.log("Rendering chat with ID:", chatIdToUse);

  return (
    <>
      <Chat
        key={chatIdToUse}
        id={chatIdToUse || ""}
        initialMessages={allMessages}
        isReadonly={isReadonly}
        useRawMessages={true}
      />
      <DataStreamHandler id={chatIdToUse || ""} />
    </>
  );
}
