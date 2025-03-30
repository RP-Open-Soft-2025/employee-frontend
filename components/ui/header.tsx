"use client";

import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Circle } from "lucide-react";
import { HeaderUserNav } from "@/components/chat-header";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
}

interface HeaderProps {
  notifications?: Notification[];
  onNotificationClick?: (notificationId: string) => void;
  children: React.ReactNode;
}

export function Header({ notifications, onNotificationClick, children }: HeaderProps) {
  const unreadCount = notifications?.filter(n => n.status === 'unread').length || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'unread' && onNotificationClick) {
      onNotificationClick(notification.id);
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // If less than 24 hours, show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // If more than 24 hours, show date and time
      return date.toLocaleString([], { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="flex flex-row justify-between items-center my-4 px-4 md:px-6 py-2 md:py-4 bg-card text-card-foreground rounded-lg border border-accent/20 shadow-sm dark:bg-dark-mode-bg bg-[#F9FAFC]">
      <Link href="/">{children}</Link>
      <div className="flex items-center space-x-5">
        {notifications && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative hidden md:flex"
              >
                <Bell className="size-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full size-5 flex items-center justify-center text-xs">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-4 cursor-pointer ${
                      notification.status === 'unread' ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between w-full items-start">
                      <div className="flex items-center gap-2">
                        {notification.status === 'unread' ? (
                          <Circle className="size-4 text-muted-foreground" />
                        ) : (
                          <CheckCircle2 className="size-4 text-muted-foreground" />
                        )}
                        <h4 className="font-medium">{notification.title}</h4>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatNotificationTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.description}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <HeaderUserNav />
      </div>
    </div>
  );
}
