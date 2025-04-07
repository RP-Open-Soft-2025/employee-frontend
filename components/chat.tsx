'use client'

import { useState, useEffect } from 'react'
import { ChatHeader } from '@/components/chat-header'
import type { Vote } from '@/lib/db/schema'
import { Artifact } from './artifact'
import { MultimodalInput } from './multimodal-input'
import { Messages } from './messages'
import { useArtifactSelector } from '@/hooks/use-artifact'
import { toast } from 'sonner'
import { useProtectedApi } from '@/lib/hooks/useProtectedApi'
import { useDispatch } from 'react-redux'
import { setChatStatus } from '@/redux/features/chat'

// API Response Types
interface ChatMessageResponse {
	message: string
	chatId: string
	sessionStatus: string
	chainStatus: string
	can_end_chat: boolean
	ended: boolean
}

interface InitiateChatResponse {
	message: string
	chatId: string
	sessionStatus: string
	chainStatus: string
}

// Create a simple message type that doesn't depend on the UIMessage type
interface SimpleMessage {
	id: string
	role: 'user' | 'assistant' | 'system' | 'function' | 'data'
	content: string
	createdAt: Date | string
}

export function Chat({
	id,
	initialMessages,
	isReadonly,
	useRawMessages = false,
	onReadonlyChange,
	currChain,
	scheduledAt,
}: {
	id: string
	initialMessages: Array<any>
	isReadonly: boolean
	useRawMessages?: boolean
	onReadonlyChange?: (readonly: boolean) => void
	currChain: string
	scheduledAt: string
}) {
	const { fetchProtected } = useProtectedApi()
	const dispatch = useDispatch()
	const [chainStatus, setChainStatus] = useState<string | null>(null)
	const [can_end_chat, setCan_end_chat] = useState(false)
	const [ended, setEnded] = useState(false)
	const [activeChain, setActiveChain] = useState<string>('')
	const [isInitiating, setIsInitiating] = useState(false)

	// Fetch chain status for this chat
	useEffect(() => {
		const checkForEscalatedChains = async () => {
			try {
				// Fetch all chains
				const result = await fetchProtected('/employee/chains', {
					method: 'GET',
				})

				let chains = []

				if (result && Array.isArray(result)) {
					chains = result
				} else if (result?.chains && Array.isArray(result.chains)) {
					chains = result.chains
				}

				// Check if ANY chain is escalated
				const hasEscalatedChain = chains.some(
					(chain: any) => chain.status === 'escalated'
				)

				if (hasEscalatedChain) {
					console.log('Found escalated chain')
					console.log('escalated')
					setChainStatus('escalated')
				} else {
					// Set the status of the first chain as fallback
					if (chains.length > 0) {
						setChainStatus(chains[0].status)
					}
				}
			} catch (error) {
				console.error('Failed to check for escalated chains:', error)
			}
		}

		checkForEscalatedChains()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Add ping effect for active chats
	useEffect(() => {
		let pingInterval: NodeJS.Timeout

		// Function to handle ping
		const handlePing = async () => {
			try {
				console.log('Making ping request')
				const response = await fetchProtected('/employee/ping', {
					method: 'GET',
				})
				console.log('Ping response:', response)
			} catch (error) {
				console.error('Failed to ping employee endpoint:', error)
			}
		}

		if (!isReadonly && id) {
			// Call ping immediately
			handlePing()

			// Set up interval for subsequent pings
			pingInterval = setInterval(handlePing, 30000) // 30 seconds
		}

		// Cleanup interval on unmount or when chat becomes readonly
		return () => {
			if (pingInterval) {
				// console.log("Cleaning up ping interval");
				clearInterval(pingInterval)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Process initial messages to ensure they have the right format
	const processedInitialMessages = useRawMessages
		? initialMessages
		: initialMessages.map((msg: any) => ({
				id: msg.id || `${id}-${Date.now()}-${msg.role}`,
				role: msg.role,
				content: msg.content,
				createdAt: msg.createdAt || new Date(),
			}))

	const messageCount = processedInitialMessages.filter(
		msg => msg.id.startsWith(id) && msg.role === 'user'
	).length

	// State
	const [messages, setMessages] = useState<SimpleMessage[]>([])
	const [input, setInput] = useState('')
	const [status, setStatus] = useState<
		'streaming' | 'error' | 'submitted' | 'ready'
	>('ready')

	// Add effect to log messages when they change
	useEffect(() => {
		setMessages(processedInitialMessages)
	}, [processedInitialMessages])

	const isArtifactVisible = useArtifactSelector(state => state.isVisible)

	// const { data: votes } = useSWR<Array<Vote>>(
	//   messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
	//   fetcher
	// );

	const votes: Array<Vote> = []

	// Handle message submission
	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault()

		if (!input.trim()) return

		try {
			// Set status to submitted
			setStatus('submitted')

			// Add user message to UI
			const userMessage: SimpleMessage = {
				id: `${id}-${Date.now()}-user`,
				role: 'user',
				content: input,
				createdAt: new Date(),
			}

			setMessages(prevMessages => [...prevMessages, userMessage])
			setInput('')

			// Send to backend using fetchProtected
			const data = await fetchProtected<ChatMessageResponse>(
				'/llm/chat/message',
				{
					method: 'POST',
					body: {
						chatId: id,
						message: input,
					},
				}
			)

			// Update chain status if provided
			if (data.chainStatus) {
				setChainStatus(data.chainStatus)
			}

			// Check if chat can be ended
			if (data.can_end_chat !== undefined) {
				setCan_end_chat(data.can_end_chat)
			}

			// Check if session has ended
			if (data.ended) {
				setEnded(true)
				// If the session has ended, update readonly state
				if (onReadonlyChange) {
					onReadonlyChange(true)
					toast.info('Session has ended.')
				}
			}

			// Add bot response to UI
			const botMessage: SimpleMessage = {
				id: `${id}-${Date.now()}-bot`,
				role: 'assistant',
				content: data.message,
				createdAt: new Date(),
			}

			setMessages(prevMessages => [...prevMessages, botMessage])
		} catch (error) {
			setStatus('error')
			console.error('Failed to send message:', error)
			toast.error('Failed to send message. Please try again.')
		} finally {
			setStatus('ready')
		}
	}

	// Handle message reload
	const reload = async () => {
		// Find the last user message
		const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')

		if (!lastUserMessage) return

		try {
			setStatus('streaming')

			// Send to backend using fetchProtected
			const data = await fetchProtected<ChatMessageResponse>(
				'/llm/chat/message',
				{
					method: 'POST',
					body: {
						chatId: id,
						message: lastUserMessage.content,
					},
				}
			)

			// Update chain status if provided
			if (data.chainStatus) {
				setChainStatus(data.chainStatus)
			}

			// Check if chat can be ended
			if (data.can_end_chat !== undefined) {
				setCan_end_chat(data.can_end_chat)
			}

			// Check if session has ended
			if (data.ended) {
				setEnded(true)
				// If the session has ended, update readonly state
				if (onReadonlyChange) {
					onReadonlyChange(true)
					toast.info('Session has ended.')
				}
			}

			// Remove last bot message and add new one
			const filteredMessages = messages.filter(
				(_, index) => index !== messages.length - 1
			)

			const botMessage: SimpleMessage = {
				id: `${id}-${Date.now()}-bot`,
				role: 'assistant',
				content: data.message || 'I received your message.',
				createdAt: new Date(),
			}

			setMessages([...filteredMessages, botMessage])
		} catch (error) {
			console.error('Failed to reload message:', error)
			toast.error('Failed to reload message. Please try again.')
		} finally {
			setStatus('ready')
		}
	}

	// Simple append function for compatibility
	const append = async (
		message: SimpleMessage | { content: string; role: 'user' | 'assistant' }
	) => {
		const fullMessage =
			'id' in message
				? message
				: {
						...message,
						id: `${id}-${Date.now()}-${message.role}`,
						createdAt: new Date(),
					}

		setMessages(prevMessages => [...prevMessages, fullMessage as SimpleMessage])

		if (fullMessage.role === 'user') {
			try {
				const data = await fetchProtected<ChatMessageResponse>(
					'/llm/chat/message',
					{
						method: 'POST',
						body: {
							chatId: id,
							message: fullMessage.content,
						},
					}
				)

				// Update chain status if provided
				if (data.chainStatus) {
					setChainStatus(data.chainStatus)
				}

				// Check if chat can be ended
				if (data.can_end_chat !== undefined) {
					setCan_end_chat(data.can_end_chat)
				}

				// Check if session has ended
				if (data.ended) {
					setEnded(true)
					// If the session has ended, update readonly state
					if (onReadonlyChange) {
						onReadonlyChange(true)
						toast.info('Session has ended.')
					}
				}

				const botMessage: SimpleMessage = {
					id: `${id}-${Date.now()}-bot`,
					role: 'assistant',
					content: data.message || 'I received your message.',
					createdAt: new Date(),
				}

				setMessages(prevMessages => [...prevMessages, botMessage])
			} catch (error) {
				console.error('Failed to append message:', error)
			}
		}
	}

	// Initiate a pending chat session
	const initiateChat = async (chatId: string) => {
		try {
			setIsInitiating(true)
			setStatus('submitted')

			console.log('Initiating chat with ID:', chatId)

			// Call API to initiate the chat
			const response = await fetchProtected<InitiateChatResponse>(
				'/llm/chat/initiate-chat',
				{
					method: 'PATCH',
					body: {
						chatId,
						status: 'bot',
					},
				}
			)

			console.log('Chat initiation response:', response)
			dispatch(setChatStatus('active'))

			// Update chain status from response
			if (response.chainStatus) {
				setChainStatus(response.chainStatus)
			}

			// Add bot's initial message to UI
			const botMessage: SimpleMessage = {
				id: `${chatId}-${Date.now()}-bot`,
				role: 'assistant',
				content: response.message,
				createdAt: new Date(),
			}

			setMessages(prevMessages => [...prevMessages, botMessage])

			// Update isReadonly state based on session status
			if (onReadonlyChange && response.sessionStatus === 'active') {
				onReadonlyChange(false)
			}
		} catch (error) {
			setStatus('error')
			console.error('Failed to initiate chat:', error)
		} finally {
			setStatus('ready')
			setIsInitiating(false)
		}
	}

	// Handle chat end from the End Chat button
	const handleChatEnd = () => {
		setEnded(true)
		if (onReadonlyChange) {
			onReadonlyChange(true)
			toast.info('Session has ended.')
		}
	}

	useEffect(() => {
		const res = async () => {
			const data = await fetchProtected(`/employee/chat-to-chain/${id}`)
			setActiveChain(data.chain_id)
		}

		res()
	})

	return (
		<>
			<div className="flex flex-col min-w-0 bg-white/70 dark:bg-black/30 h-[calc(100vh-125px)] rounded-lg">
				<ChatHeader
					chatId={id}
					isReadonly={isReadonly}
					can_end_chat={can_end_chat || messageCount >= 10}
					onChatEnd={handleChatEnd}
				/>

				<Messages
					chatId={id}
					status={isInitiating ? 'initiating' : status}
					votes={votes}
					messages={
						messages.map(msg => ({
							...msg,
							parts: [{ type: 'text', text: msg.content }],
						})) as any
					}
					setMessages={setMessages as any}
					reload={reload as any}
					isReadonly={isReadonly}
					isArtifactVisible={isArtifactVisible}
				/>

				{currChain === activeChain && (
					<>
						<form
							className="flex mx-auto px-4 pb-4 md:pb-5 gap-2 w-full md:max-w-3xl"
							onSubmit={handleSubmit}
						>
							{!isReadonly && (
								<MultimodalInput
									chatId={id}
									input={input}
									setInput={setInput}
									handleSubmit={handleSubmit as any}
									status={status}
									messages={
										messages.map(msg => ({
											...msg,
											parts: [{ type: 'text', text: msg.content }],
										})) as any
									}
									setMessages={setMessages as any}
									append={append as any}
								/>
							)}
						</form>

						{isReadonly && !(id === '' || id === null) && (
							<div className="flex mx-auto px-4 pb-4 md:pb-5 gap-2 w-full md:max-w-3xl">
								<div className="flex flex-col w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm p-4">
									<div className="flex flex-col space-y-3">
										<div className="flex items-center justify-between">
											<h3 className="text-base font-medium">
												Scheduled Chat Available
											</h3>
										</div>
										<div className="mt-2 space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
											<div className="flex items-center text-sm">
												<svg
													className="size-4 text-green-500 mr-2"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
												<span className="font-medium text-gray-700 dark:text-gray-300">
													Start:
												</span>
												<span className="ml-2 text-gray-600 dark:text-gray-400">
													{scheduledAt
														? new Date(new Date(scheduledAt).getTime() + 19800000).toLocaleString('en-US', {
																timeZone: 'Asia/Kolkata',
																hour: 'numeric',
																minute: 'numeric',
																hour12: true,
																day: 'numeric',
																month: 'short',
																year: 'numeric',
															})
														: 'Time not specified'}
												</span>
											</div>
											<div className="flex items-center text-sm">
												<svg
													className="size-4 text-red-500 mr-2"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
												<span className="font-medium text-gray-700 dark:text-gray-300">
													End:
												</span>
												<span className="ml-2 text-gray-600 dark:text-gray-400">
													{scheduledAt
														? (() => {
																const endDate = new Date(new Date(scheduledAt).getTime() + 19800000)
																endDate.setHours(endDate.getHours() + 48)
																return endDate.toLocaleString('en-US', {
																	timeZone: 'Asia/Kolkata',
																	hour: 'numeric',
																	minute: 'numeric',
																	hour12: true,
																	day: 'numeric',
																	month: 'short',
																	year: 'numeric',
																})
															})()
														: 'Time not specified'}
												</span>
											</div>
										</div>
										<button
											type="button"
											onClick={() => {
												const button =
													document.activeElement as HTMLButtonElement
												button.disabled = true
												button.innerHTML =
													'<span class="mr-2">Processing...</span><svg class="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'

												initiateChat(id).finally(() => {
													button.disabled = false
													button.innerHTML = 'Start Session'
												})
											}}
											disabled={(() => {
												const now = new Date()
												const startTime = scheduledAt
													? new Date(new Date(scheduledAt).getTime() + 19800000)
													: null
												if (!startTime) return true

												const endTime = new Date(startTime)
												endTime.setHours(endTime.getHours() + 48)

												return now < startTime || now > endTime
											})()}
											title={(() => {
												const now = new Date()
												const startTime = scheduledAt
													? new Date(new Date(scheduledAt).getTime() + 19800000)
													: null
												if (!startTime)
													return 'Schedule information unavailable'

												const endTime = new Date(startTime)
												endTime.setHours(endTime.getHours() + 48)

												if (now < startTime) {
													return 'Cannot start this session yet'
												} else if (now > endTime) {
													return 'This session has expired'
												}
												return 'Start your scheduled session'
											})()}
											className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
										>
											{(() => {
												const now = new Date()
												const startTime = scheduledAt
													? new Date(new Date(scheduledAt).getTime() + 19800000)
													: null
												if (!startTime) return 'Session Unavailable'

												const endTime = new Date(startTime)
												endTime.setHours(endTime.getHours() + 48)

												if (now < startTime) {
													return 'Cannot start this session yet'
												} else if (now > endTime) {
													return 'Session Expired'
												}
												return 'Start Session'
											})()}
										</button>
									</div>
								</div>
							</div>
						)}

						{isReadonly && (id === '' || id === null) && (
							<div className="flex mx-auto px-4 pb-4 md:pb-5 gap-2 w-full md:max-w-3xl">
								<div className="flex flex-col w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm p-4">
									<p className="text-sm text-muted-foreground text-center">
										{chainStatus === 'escalated'
											? 'Escalated to HR'
											: 'No Active/Scheduled sessions available'}
									</p>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{currChain === activeChain && (
				<Artifact
					chatId={id}
					input={input}
					setInput={setInput}
					handleSubmit={handleSubmit as any}
					status={status}
					append={append as any}
					messages={
						messages.map(msg => ({
							...msg,
							parts: [{ type: 'text', text: msg.content }],
						})) as any
					}
					setMessages={setMessages as any}
					reload={reload as any}
					votes={votes}
					isReadonly={isReadonly}
				/>
			)}
		</>
	)
}
