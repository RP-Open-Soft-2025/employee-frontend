"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { HeaderUserNav } from "@/components/chat-header";
import Link from "next/link";

interface HeaderProps {
  notifications?: number;
  children: React.ReactNode;
}

export function Header({ notifications, children }: HeaderProps) {
  return (
    <div className="flex flex-row justify-between items-center my-4 px-4 md:px-6 py-2 md:py-4 bg-card text-card-foreground rounded-lg border border-accent/20 shadow-sm dark:bg-dark-mode-bg bg-[#F9FAFC]">
      <Link href="/">{children}</Link>
      <div className="flex items-center space-x-2">
        {notifications && (
          <Button
            variant="outline"
            size="sm"
            className="relative hidden md:flex"
          >
            <Bell className="size-4 mr-2" />
            Notifications
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full size-5 flex items-center justify-center text-xs">
                {notifications}
              </span>
            )}
          </Button>
        )}
        <HeaderUserNav />
      </div>
    </div>
  );
}
