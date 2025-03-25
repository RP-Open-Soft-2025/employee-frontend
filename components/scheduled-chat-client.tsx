"use client";

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { LoadingScreen } from '@/components/loading-screen';
import type { RootState } from '@/redux/store';
import { useProtectedApi } from '@/lib/hooks/useProtectedApi';
import type { UIMessage } from 'ai';
import { setMessages, setChatStatus, clearChat, } from '@/redux/features/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

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

export function ScheduledChatClient() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingSession, setPendingSession] = useState<ScheduledSession | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isReadonly, setIsReadonly] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [initiatingChat, setInitiatingChat] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  
  // Get authentication status and active chat ID from Redux
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const reduxActiveChatId = useSelector((state: RootState) => state.chat.activeChatId);
  
  // Get chat status from Redux
  const chatStatus = useSelector((state: RootState) => state.chat.chatStatus);
  
  const { fetchProtected } = useProtectedApi();
  
  // Set up a simplified hook to always keep isReadonly as false
  useEffect(() => {
    // Always ensure isReadonly is false
    if (isReadonly) {
      console.log("Ensuring isReadonly is always FALSE");
      setIsReadonly(false);
    }
  }, [isReadonly]);
  
  // Add debug renderer to show current state
  useEffect(() => {
    console.log("Current state:", { 
      activeChatId, 
      chatStatus, 
      isReadonly
    });
  }, [activeChatId, chatStatus, isReadonly]);
  
  // Debug renderer that was previously conditional - moved to top level
  useEffect(() => {
    console.log("Render state:", { 
      activeChatId, 
      reduxActiveChatId, 
      isReadonly
    });
    
    // Always ensure the chat input is available
    if (isReadonly) {
      console.log("Setting isReadonly to false to ensure text input is available");
      setIsReadonly(false);
    }
  }, [activeChatId, reduxActiveChatId, isReadonly]);
  
  // Initial data loading
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Authenticated, fetching scheduled sessions and chat history");
      fetchScheduledSession();
      fetchChatHistory();
    }
    // fetchScheduledSession is intentionally omitted to prevent infinite loops
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
          const response = await fetchProtected(`/employee/chats/${chatId}/messages`);
          console.log("Chat messages response:", response);
          
          // Process messages only if component is still mounted and chatId hasn't changed
          if (response?.messages && chatId === activeChatId) {
            const uiMessages: UIMessage[] = response.messages.map((message: any, index: number) => ({
              id: `${chatId}-msg-${index}`,
              role: message.sender === "bot" ? "assistant" : "user",
              content: message.text,
              createdAt: new Date(message.timestamp).toISOString() 
            }));
            
            setInitialMessages(uiMessages);
            
            // Get chat mode for state tracking, but always keep editable
            const chatMode = response.chat_mode || "active";
            console.log("Chat mode from useEffect:", chatMode);
            
            // SIMPLIFIED: Always keep isReadonly false regardless of mode
            console.log("ALWAYS setting isReadonly to FALSE regardless of chat mode");
            setIsReadonly(false);
            
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
  
  // Component-level debug logger - this is not a hook, just a debug log
  console.log("Debug state on render:", { 
    activeChatId, 
    reduxActiveChatId, 
    isReadonly,
    pendingSession, 
    initialMessages,
    loading
  });

  // Fetch scheduled session and check status
  const fetchScheduledSession = async () => {
    try {
      setLoading(true);
      const result = await fetchProtected("/employee/scheduled-sessions");
      
      console.log("Scheduled sessions response:", result);
      
      if (result && result.length > 0) {
        // First priority: Find an active session
        let sessionToUse = result.find((session: ScheduledSession) => 
          session.status === "active"
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
        
        // Check for alternative active session status values (case insensitive)
        sessionToUse = result.find((session: ScheduledSession) => 
          session.status.toLowerCase() === "active" || 
          session.status.toLowerCase() === "in_progress" || 
          session.status.toLowerCase() === "inprogress"
        );
        
        if (sessionToUse) {
          console.log("Found session with alternative active status:", sessionToUse);
          setActiveChatId(sessionToUse.chat_id);
          dispatch(setChatStatus("active"));
          setIsReadonly(false);
          await fetchChatMessages(sessionToUse.chat_id);
          return;
        }
        
        // Second priority: Find a pending session
        sessionToUse = result.find((session: ScheduledSession) => 
          session.status === "pending"
        );
        
        console.log("Pending session found:", sessionToUse);
        
        if (sessionToUse) {
          // If status is pending, store it for the start button
          setPendingSession(sessionToUse);
        }
      } else {
        console.log("No scheduled sessions found or empty response");
      }
    } catch (error) {
      console.error("Failed to fetch scheduled sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Modified fetch chat messages for a specific chat ID
  const fetchChatMessages = async (id: string) => {
    try {
      setLoading(true);
      console.log("Fetching messages for chat ID:", id);
      const response = await fetchProtected(`/employee/chats/${id}/messages`);
      console.log("Chat messages response:", response);
      
      // The response is a ChatMessagesResponse object with messages array
      if (response?.messages) {
        // Convert API messages to UI messages format
        const uiMessages: UIMessage[] = response.messages.map((message: any, index: number) => ({
          // Use a stable ID from the original message or a stable index-based ID
          id: `${id}-msg-${index}`,
          role: message.sender === "bot" ? "assistant" : "user",
          content: message.text,
          // Store timestamp as ISO string instead of Date object for Redux serialization
          createdAt: new Date(message.timestamp).toISOString() 
        }));
        
        setInitialMessages(uiMessages);
        
        // Set session status from chat_mode (default to "active" if missing)
        const chatMode = response.chat_mode || "active";
        console.log("Chat mode:", chatMode);
        
        // SIMPLIFIED: Always keep isReadonly false regardless of mode
        console.log("ALWAYS setting isReadonly to FALSE regardless of chat mode");
        setIsReadonly(false);
        
        dispatch(setChatStatus(chatMode));
        
        // Only update messages in Redux, but don't affect activeChatId
        dispatch(setMessages(uiMessages));
        
        // Set escalation status if needed
        if (response.is_escalated) {
          console.log("Chat is escalated to HR");
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
    } finally {
      setLoading(false);
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
      
      // Mark as active (not read-only)
      console.log("Setting isReadonly to false for active chat");
      setIsReadonly(false);
      
      // Call API to initiate the chat
      const response = await fetchProtected("/llm/chat/initiate-chat", {
        method: "PATCH",
        body: {
          chatId,
          status: "bot"
        }
      });
      
      console.log("Chat initiation response:", response);
      
      // Make sure isReadonly is still false before fetching messages
      setIsReadonly(false);
      
      // Load the chat messages
      await fetchChatMessages(chatId);
      
      // Even after fetching messages, ensure the chat is still editable
      console.log("Final check - setting isReadonly to false");
      setIsReadonly(false);
      
      // Clear the pending session since it's now active
      setPendingSession(null);
    } catch (error) {
      console.error("Failed to initiate chat:", error);
      // Don't clear activeChatId on error
    } finally {
      setInitiatingChat(null);
    }
  };

  // Add fetchChatHistory function
  const fetchChatHistory = async () => {
    try {
      const result = await fetchProtected("/employee/chats");
      console.log("Chat history:", result);
      if (result && Array.isArray(result)) {
        setChatHistory(result.map(chat => ({
          id: chat.id,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          mode: chat.mode,
          isEscalated: chat.isEscalated,
          totalMessages: chat.totalMessages,
          unreadCount: chat.unreadCount
        })));
      }
    } catch (e) {
      console.error("Failed to fetch chat history:", e);
    }
  };

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, clearing chat");
      dispatch(clearChat());
    };
  }, [dispatch]);

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }
  
  // Debug log component state before rendering
  console.log("Component render state:", { 
    activeChatId, 
    reduxActiveChatId, 
    pendingSession, 
    initialMessages, 
    isReadonly,
    loading
  });

  // Check if we have an activeChatId in Redux, even if still loading
  console.log("Redux activeChatId check:", reduxActiveChatId);
  
  if (loading) {
    // Don't reset UI state during loading
    return <LoadingScreen />;
  }
  
  console.log("Render state:", { activeChatId, reduxActiveChatId, pendingSession, initialMessages });

  // If we have an active chat ID, render the chat interface
  if (activeChatId || reduxActiveChatId) {
    // Use the chat ID that is available (prefer local state but fall back to Redux)
    const chatIdToUse = activeChatId || reduxActiveChatId;
    console.log("Rendering chat with ID:", chatIdToUse, "isReadonly:", isReadonly);
    return (
      <>
        <Chat
          key={chatIdToUse}
          id={chatIdToUse || ""}
          initialMessages={initialMessages}
          isReadonly={false} // Hard-code to false to ensure text input is always available
          useRawMessages={true} // Added flag to force using raw messages
        />
        <DataStreamHandler id={chatIdToUse || ""} />
      </>
    );
  }
  
  // If we have a pending session, show the start button
  if (pendingSession) {
    return (
      <div className="h-[calc(100vh-125px)] flex justify-center items-center">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Wellness Session</CardTitle>
            <CardDescription>
              Scheduled for {formatDate(pendingSession.scheduled_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Session ID:</span>
                <span className="text-sm">{pendingSession.session_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    Pending
                  </span>
                </span>
              </div>
              {pendingSession.notes && (
                <div>
                  <span className="text-sm font-medium">Notes:</span>
                  <p className="text-sm text-muted-foreground mt-1">{pendingSession.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => initiateChat(pendingSession.chat_id)}
              disabled={initiatingChat === pendingSession.chat_id}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 text-lg"
              size="lg"
            >
              {initiatingChat === pendingSession.chat_id ? "Initiating Session..." : "Start Scheduled Session"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // No active or pending sessions
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-125px)] p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">No Active Sessions</h2>
      <p className="text-muted-foreground mb-6">You don&apos;t have any active or pending chat sessions at the moment.</p>
      <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
    </div>
  );
} 