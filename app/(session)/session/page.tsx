import { redirect } from 'next/navigation';
import { ScheduledChatClient } from '@/components/scheduled-chat-client';

export default function ChatPage({ searchParams }: { searchParams: { id?: string } }) {
  // If there's an id in the query parameters, redirect to the new route pattern
  if (searchParams.id) {
    redirect(`/session/${searchParams.id}`);
  }
  
  // Otherwise, render the client component without an ID
  return <ScheduledChatClient />;
}
