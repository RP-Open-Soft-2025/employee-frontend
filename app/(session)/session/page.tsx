import { Metadata } from 'next'
import ChatPageClient from './chat-page-client'

export const metadata: Metadata = {
	title: 'All Sessions',
	description:
		'View and manage your active DeloConnect chat sessions for employee support.',
}

export default function ChatPage() {
	return <ChatPageClient />
}
