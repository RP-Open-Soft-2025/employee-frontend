'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkAuth } from '@/redux/features/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bell, Calendar, FileText, ChevronRight } from 'lucide-react';

export function EmployeeDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [notifications, setNotifications] = useState(3);
  const [upcomingEvents, setUpcomingEvents] = useState([
    { id: 1, title: 'Team Meeting', date: '2023-03-25 10:00 AM', type: 'Meeting' },
    { id: 2, title: 'Project Deadline', date: '2023-03-28', type: 'Deadline' },
    { id: 3, title: 'Training Session', date: '2023-03-30 2:00 PM', type: 'Training' }
  ]);
  
  const [recentChats, setRecentChats] = useState([
    { id: 'chat-1', title: 'HR Department', preview: 'About leave policy...' },
    { id: 'chat-2', title: 'Tech Support', preview: 'Laptop issue resolution...' }
  ]);

  // Add client-side only indicator to prevent hydration mismatch
  const [isClientSide, setIsClientSide] = useState(false);
  
  useEffect(() => {
    // This will only run on the client and after hydration
    setIsClientSide(true);
    
    dispatch(checkAuth());
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [dispatch, isAuthenticated, router]);

  // If not authenticated or still on server, show a placeholder with matching structure
  if (!isClientSide || !isAuthenticated) {
    return <div className="container mx-auto p-4 md:p-6">Loading dashboard...</div>;
  }

  // Normal render for client-side with authentication
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.empID || 'Employee'}</h1>
          <p className="text-muted-foreground mt-1">Your employee dashboard</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {notifications}
              </span>
            )}
          </Button>
          <Link href="/chat">
            <Button size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Your scheduled events and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{event.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto flex items-center">
              View Calendar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recent Chats
            </CardTitle>
            <CardDescription>Your recent conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentChats.map(chat => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <div className="flex items-center cursor-pointer hover:bg-muted p-2 rounded">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{chat.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{chat.preview}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/chat" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Open Chat
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6">
                <FileText className="h-6 w-6 mb-2" />
                <span>Documents</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Schedule</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6">
                <Bell className="h-6 w-6 mb-2" />
                <span>Notifications</span>
              </Button>
              <Link href="/chat" className="w-full">
                <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6 w-full">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span>Chat</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 