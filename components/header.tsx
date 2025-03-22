'use client';

import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { HeaderUserNav } from '@/components/chat-header';

interface HeaderProps {
  notifications: number;
  children: React.ReactNode;
}

export function Header({ notifications, children }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        {children}
      </div>
      <div className="flex items-center space-x-2 mt-4 md:mt-0">
        <Button variant="outline" size="sm" className="relative">
          <Bell className="size-4 mr-2" />
          Notifications
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full size-5 flex items-center justify-center text-xs">
              {notifications}
            </span>
          )}
        </Button>
        <HeaderUserNav />
      </div>
    </div>
  );
}
