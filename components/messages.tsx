import type { UIMessage } from 'ai'
import { PreviewMessage, ThinkingMessage } from './message'
import { useScrollToBottom } from './use-scroll-to-bottom'
import { Overview } from './overview'
import { memo } from 'react'
import type { Vote } from '@/lib/db/schema'
import equal from 'fast-deep-equal'
import type { UseChatHelpers } from '@ai-sdk/react'
import { cn } from '@/lib/utils'

// Chat separator component
const ChatSeparator = ({
	chatId,
	createdAt,
}: {
	chatId: string
	createdAt: string
}) => {
	const formattedDate = createdAt
		? new Date(createdAt).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
		: null

	return (
		<div className="flex items-center justify-center">
			<div
				className={cn(
					'px-3 py-1 rounded-full text-xs font-medium',
					'bg-muted text-muted-foreground',
					'dark:bg-secondary/50 dark:text-muted-foreground/80'
				)}
			>
				{formattedDate && !isNaN(new Date(createdAt).getTime()) ? formattedDate : chatId}
			</div>
		</div>
	)
}

interface MessagesProps {
	chatId: string
	status: UseChatHelpers['status']
	votes: Array<Vote> | undefined
	messages: Array<UIMessage>
	setMessages: UseChatHelpers['setMessages']
	reload: UseChatHelpers['reload']
	isReadonly: boolean
	isArtifactVisible: boolean
}

function PureMessages({
	chatId,
	status,
	votes,
	messages,
	setMessages,
	reload,
	isReadonly,
}: MessagesProps) {
	const [messagesContainerRef, messagesEndRef] =
		useScrollToBottom<HTMLDivElement>()

	// console.log("Messages:", messages);

	// Group messages by chat ID and extract created_at from message ID
	const groupedMessages = messages.reduce(
		(acc, message) => {
			const messageId = message.id

			// First split by the last hyphen to separate the message number
			const [chatIdAndDate, messageNumber] = messageId.split(/(?=-[0-9]+$)/)
			// chatIdAndDate = "CHATE54BE2-2025-03-22T06:45:44.055000Z"
			// messageNumber = "-1"

			// Then split by the first hyphen to get chat ID and date
			const [messageChatId, createdAt] = chatIdAndDate.split(/(?<=^[^-]+)-/)
			// chatId = "CHATE54BE2"
			// date = "2025-03-22T06:45:44.055000Z"

			// console.log(chatIdAndDate, messageNumber, messageChatId, createdAt);

			if (!acc[messageChatId]) {
				acc[messageChatId] = {
					messages: [],
					createdAt,
				}
			}
			acc[messageChatId].messages.push(message)
			return acc
		},
		{} as Record<string, { messages: UIMessage[]; createdAt: string }>
	)

	console.log('Grouped messages:', groupedMessages)

	return (
		<div
			ref={messagesContainerRef}
			className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto [scrollbar-width:_none] pt-4"
		>
			{messages.length === 0 && <Overview />}

			{Object.entries(groupedMessages).map(
				(
					[messageChatId, { messages: chatMessages, createdAt }],
					groupIndex
				) => (
					<div
						key={messageChatId}
						id={`chat-${messageChatId}`}
						className={`flex flex-col gap-6 ${
							groupIndex !== Object.entries(groupedMessages).length - 1
								? 'mb-5'
								: ''
						}`}
					>
						<ChatSeparator chatId={messageChatId} createdAt={createdAt} />
						{chatMessages.map((message, index) => (
							<PreviewMessage
								key={message.id}
								chatId={chatId}
								message={message}
								isLoading={
									status === 'streaming' && messages.length - 1 === index
								}
								vote={
									votes
										? votes.find(vote => vote.messageId === message.id)
										: undefined
								}
								setMessages={setMessages}
								reload={reload}
								isReadonly={isReadonly}
							/>
						))}
					</div>
				)
			)}

			{status === 'submitted' &&
				messages.length > 0 &&
				messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

			<div ref={messagesEndRef} className="h-0" />
		</div>
	)
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
	return (
		equal(prevProps.messages, nextProps.messages) &&
		equal(prevProps.votes, nextProps.votes) &&
		prevProps.status === nextProps.status &&
		prevProps.isReadonly === nextProps.isReadonly &&
		prevProps.isArtifactVisible === nextProps.isArtifactVisible
	)
})
