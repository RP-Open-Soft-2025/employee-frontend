"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { useParams, usePathname, } from "next/navigation";
import { memo, useEffect, useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";
import { MessageSquare, Bell } from "lucide-react";

interface ChatResponse {
  chat_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  total_messages: number;
  chat_mode: string;
  is_escalated: boolean;
}

interface ChatsApiResponse {
  chats: ChatResponse[];
  total_chats: number;
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

type GroupedChats = {
  today: ChatHistory[];
  yesterday: ChatHistory[];
  lastWeek: ChatHistory[];
  lastMonth: ChatHistory[];
  older: ChatHistory[];
};

const PureChatItem = ({
  chat,
  isActive,
  setOpenMobile,
}: {
  chat: ChatHistory;
  isActive: boolean;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        {/* <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}> */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            <div className="flex flex-col">
              <span className="text-sm truncate">
                {chat.mode === "bot" ? "AI Assistant" : "HR Chat"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {chat.lastMessage}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chat.isEscalated && <Bell className="size-3 text-yellow-600" />}
            {chat.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
        {/* </Link> */}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat.unreadCount !== nextProps.chat.unreadCount) return false;
  if (prevProps.chat.lastMessage !== nextProps.chat.lastMessage) return false;
  return true;
});

export function SidebarHistory({ user }: { user: any }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchProtected } = useProtectedApi();

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const result = await fetchProtected<ChatsApiResponse>("/employee/chats");
      console.log("Chat history:", result);
      if (result?.chats && Array.isArray(result.chats)) {
        setChatHistory(
          result.chats.map((chat: ChatResponse) => ({
            id: chat.chat_id,
            lastMessage: chat.last_message,
            lastMessageTime: chat.last_message_time,
            mode: chat.chat_mode,
            isEscalated: chat.is_escalated,
            totalMessages: chat.total_messages,
            unreadCount: chat.unread_count,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch chat history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pathname]);

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (loading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Loading...
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      "--skeleton-width": `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (chatHistory.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-300 dark:text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupChatsByDate = (chats: ChatHistory[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.lastMessageTime);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats
    );
  };

  const groupedChats = groupChatsByDate(chatHistory);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {groupedChats.today.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                  Today
                </div>
                {groupedChats.today.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {groupedChats.yesterday.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Yesterday
                </div>
                {groupedChats.yesterday.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {groupedChats.lastWeek.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Last 7 days
                </div>
                {groupedChats.lastWeek.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {groupedChats.lastMonth.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Last 30 days
                </div>
                {groupedChats.lastMonth.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {groupedChats.older.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Older
                </div>
                {groupedChats.older.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
