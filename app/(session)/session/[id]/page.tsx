import { Metadata } from 'next'
import { ScheduledChatClient } from '@/components/scheduled-chat-client'

export const metadata: Metadata = {
	title: 'Session | DeloConnect',
	description:
		'Chat with DeloConnect to get personalized support and guidance.',
}

export default function ChatPage() {
	return <ScheduledChatClient />
}
