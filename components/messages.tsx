import type { UIMessage } from 'ai'
import { PreviewMessage, ThinkingMessage } from './message'
import { useScrollToBottom } from './use-scroll-to-bottom'
import { Overview } from './overview'
import { memo, useState, useEffect } from 'react'
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
				{formattedDate && !Number.isNaN(new Date(createdAt).getTime())
					? formattedDate
					: chatId}
			</div>
		</div>
	)
}

interface MessagesProps {
	chatId: string
	status: UseChatHelpers['status'] | 'initiating'
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
	const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
	const [isVisible, setIsVisible] = useState(true)

	const loadingMessages = [
		'Please wait a moment...',
		'Fetching your documents...',
		'This may take a moment...',
		'Sit back and relax...'
	]

	useEffect(() => {
		if (status === 'initiating') {
			const interval = setInterval(() => {
				setIsVisible(false)
				setTimeout(() => {
					setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
					setIsVisible(true)
				}, 500) // Half second for fade out
			}, 1500) // 1.5 seconds total (1s visible + 0.5s transition)

			return () => clearInterval(interval)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status])

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

	if (status === 'initiating') {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="flex flex-col items-center">
					<svg
						className="animate-spin size-5 text-blue-500"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
					<div className="flex flex-col items-center mt-2 h-20 overflow-hidden">
						<div
							className={`transition-all duration-500 ${
								isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
							}`}
						>
							{loadingMessages[currentMessageIndex]}
						</div>
					</div>
				</div>
			</div>
		)
	}

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
