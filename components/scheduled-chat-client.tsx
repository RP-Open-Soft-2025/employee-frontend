'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'next/navigation'
import { Chat } from '@/components/chat'
import { DataStreamHandler } from '@/components/data-stream-handler'
import { LoadingScreen } from '@/components/loading-screen'
import type { RootState } from '@/redux/store'
import { useProtectedApi } from '@/lib/hooks/useProtectedApi'
import type { UIMessage } from 'ai'
import { setMessages, setChatStatus, clearChat } from '@/redux/features/chat'

interface ScheduledSession {
	session_id: string
	user_id: string
	chat_id: string
	status: string
	scheduled_at: string
	created_at: string
	updated_at: string
	completed_at: string | null
	cancelled_at: string | null
	cancelled_by: string | null
	notes: string | null
}

interface ChatHistoryResponse {
	chat_id: string
	last_message: string
	last_message_time: string
	unread_count: number
	total_messages: number
	chat_mode: string
	is_escalated: boolean
	created_at: string
}

export function ScheduledChatClient() {
	const params = useParams()
	const id = params?.id as string
	const dispatch = useDispatch()
	const [loading, setLoading] = useState(true)
	const [pendingSession, setPendingSession] = useState<ScheduledSession | null>(
		null
	)
	const [activeChatId, setActiveChatId] = useState<string | null>(null)
	const [isReadonly, setIsReadonly] = useState(false)
	const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
	const [allMessages, setAllMessages] = useState<UIMessage[]>([])

	// Get authentication status and active chat ID from Redux
	const isAuthenticated = useSelector(
		(state: RootState) => state.auth.isAuthenticated
	)
	const reduxActiveChatId = useSelector(
		(state: RootState) => state.chat.activeChatId
	)

	const { fetchProtected } = useProtectedApi()

	// Add a function to fetch messages for a specific chain
	const fetchChainMessages = async (chainId: string) => {
		try {
			console.log(`Fetching messages for chain: ${chainId}`)
			const response = await fetchProtected(
				`/employee/chains/${chainId}/messages`
			)

			if (!response) {
				console.error('No data returned for chain:', chainId)
				return
			}

			console.log('Chain data received:', response)

			// Clear existing messages
			setAllMessages([])

			// Process all sessions in the chain
			const allChainMessages: UIMessage[] = []
			let firstChatId = null

			if (response.sessions && Array.isArray(response.sessions)) {
				for (const session of response.sessions) {
					const chatId = session.chat_id

					// Store the first chat ID we encounter
					if (!firstChatId) {
						firstChatId = chatId
					}

					// Process messages for this session
					if (session.messages && Array.isArray(session.messages)) {
						const sessionMessages = session.messages.map(
							(msg: any, index: number) => ({
								id: `${chatId}-${msg.timestamp}-${index}`,
								role:
									msg.sender === 'bot' || msg.sender === 'hr'
										? 'assistant'
										: 'user',
								content: msg.sender === 'hr' ? `HR: ${msg.text}` : msg.text,
								createdAt: new Date(msg.timestamp).toISOString(),
								senderType: msg.sender,
							})
						)

						allChainMessages.push(...sessionMessages)
					}
				}
			}

			// Sort messages by timestamp
			allChainMessages.sort((a, b) => {
				const dateA = new Date(a.createdAt || Date.now())
				const dateB = new Date(b.createdAt || Date.now())
				return dateA.getTime() - dateB.getTime()
			})

			console.log(
				`Found ${allChainMessages.length} messages across ${
					response.sessions?.length || 0
				} sessions for chain ${chainId}`
			)

			// Set active chat ID if we found one
			if (firstChatId) {
				setActiveChatId(firstChatId)
			}

			// Update messages and read-only status
			setAllMessages(allChainMessages)
			setIsReadonly(response.is_escalated || false)
		} catch (error) {
			console.error('Error fetching chain messages:', error)
		}
	}

	// Initial data loading
	useEffect(() => {
		const fetchData = async () => {
			if (isAuthenticated) {
				// Get ID from dynamic route params instead of search params
				console.log('Route ID parameter:', id)

				// Check if this is a chain ID
				const isChainId = id?.startsWith('CHAIN')
				if (isChainId && id) {
					console.log(
						'Chain ID detected in URL, fetching chain-specific messages'
					)
					await fetchChainMessages(id)
					await fetchScheduledSession()
					console.log('OP')
				} else if (id) {
					// Regular chat ID
					console.log('Regular chat ID, fetching specific chat')
					setActiveChatId(id)
					await fetchChatMessages(id)
					await fetchScheduledSession()
				} else {
					console.log('No ID, fetching all data')
					await Promise.all([fetchScheduledSession(), fetchChatHistory()])
				}
				setLoading(false)
			}
		}

		fetchData()
		// eslint-disable-next-line
	}, [])

	// Fetch scheduled session and check status
	const fetchScheduledSession = async () => {
		try {
			const result = await fetchProtected('/employee/scheduled-sessions')

			console.log('Scheduled sessions response:', result)

			// Set readonly to true by default, unless we explicitly find an active session
			setIsReadonly(true)

			// Clear pending session first
			setPendingSession(null)

			// Check if we have a valid array with sessions
			if (result && Array.isArray(result) && result.length > 0) {
				// First priority: Find an active session
				let sessionToUse = result.find(
					(session: ScheduledSession) => session.status === 'active'
				)

				console.log('Active session found:', sessionToUse)

				if (sessionToUse) {
					// Look for chain data that includes this session

					console.log('Setting active chat ID to:', sessionToUse.chat_id)
					setActiveChatId(sessionToUse.chat_id)
					dispatch(setChatStatus('active'))
					setIsReadonly(false) // Active sessions are not read-only

					return
				}

				// If no active session, check for pending session
				console.log('No active session found, looking for pending session')

				// Second priority: Find a pending session
				sessionToUse = result.find(
					(session: ScheduledSession) => session.status === 'pending'
				)

				console.log('Pending session found:', sessionToUse)

				if (sessionToUse) {
					// If status is pending, store it for the start button
					setPendingSession(sessionToUse)
				}
			} else {
				// No sessions at all or invalid response
				console.log('No scheduled sessions found or empty response', result)
				setIsReadonly(true)
				setPendingSession(null)
				setActiveChatId(null)
			}
		} catch (error) {
			console.error('Failed to fetch scheduled sessions:', error)
			setIsReadonly(true)
			setPendingSession(null)
		}
	}

	// Helper function to find which chain contains a specific session

	// Modified fetch chat messages function to use the chains API endpoint
	const fetchChatMessages = async (id: string): Promise<UIMessage[] | null> => {
		try {
			console.log('Fetching messages for chat ID:', id)

			// Try to get the chain ID for this chat
			const chainId = id

			// If the ID doesn't look like a chain ID, we need to find the associated chain
			if (!id.startsWith('chain-') && !id.startsWith('CHAIN')) {
				// For now, we'll just use the chain messages endpoint directly
				// In a real implementation, you might need to look up which chain contains this chat
				console.log('Non-chain ID detected, searching for associated chain...')
			}

			// Use the chains endpoint instead of chats endpoint
			const response = await fetchProtected(
				`/employee/chains/${chainId}/messages`
			)
			console.log('Chain messages response:', response)

			if (response?.sessions) {
				// Create a flat array of all messages from all sessions
				const allMessages: UIMessage[] = []

				for (const session of response.sessions) {
					if (session.messages && Array.isArray(session.messages)) {
						const sessionMessages = session.messages.map(
							(message: any, index: number) => ({
								id: `${session.chat_id}-msg-${index}`,
								role:
									message.sender === 'bot' || message.sender === 'hr'
										? 'assistant'
										: 'user',
								content:
									message.sender === 'hr'
										? `HR: ${message.text}`
										: message.text,
								createdAt: new Date(message.timestamp).toISOString(),
								senderType: message.sender,
							})
						)

						allMessages.push(...sessionMessages)
					}
				}

				// Sort messages by timestamp
				allMessages.sort((a, b) => {
					const dateA = new Date(a.createdAt || Date.now())
					const dateB = new Date(b.createdAt || Date.now())
					return dateA.getTime() - dateB.getTime()
				})

				// If this is the active chat, update initialMessages
				if (id === activeChatId) {
					setInitialMessages(allMessages)
					dispatch(setMessages(allMessages))
				}

				return allMessages
			}
			return null
		} catch (error) {
			console.error('Failed to fetch chat messages:', error)
			return null
		}
	}

	// Modified fetchChatHistory function to use chains endpoint
	const fetchChatHistory = async () => {
		try {
			// Get all chains instead of chats
			const result = await fetchProtected('/employee/chains')
			console.log('Chains history:', result)

			let chains = []
			if (result && Array.isArray(result)) {
				chains = result
			} else if (result?.chains && Array.isArray(result.chains)) {
				chains = result.chains
			}

			if (chains.length > 0) {
				// Sort chains based on date with latest chain at the end
				chains.sort((a: any, b: any) => {
					return (
						new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					)
				})

				// Fetch messages for all chains
				const allChainMessages: UIMessage[] = []
				for (const chain of chains) {
					try {
						const messages = await fetchChatMessages(chain.chain_id)
						if (messages) {
							allChainMessages.push(...messages)
						}
					} catch (error) {
						console.error(
							`Failed to fetch messages for chain ${chain.chain_id}:`,
							error
						)
					}
				}

				console.log('All chain messages:', allChainMessages)
				setAllMessages(allChainMessages)
			}
		} catch (e) {
			console.error('Failed to fetch chat history:', e)
		}
	}

	// Cleanup only on unmount
	useEffect(() => {
		return () => {
			dispatch(clearChat())
		}
	}, [dispatch])

	// Add effect to handle chat scrolling based on ID
	useEffect(() => {
		if (!loading && id) {
			// Add a small delay to ensure DOM is updated
			setTimeout(() => {
				const element = document.getElementById(`chat-${id}`)
				console.log('Looking for element:', `chat-${id}`)
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' })
					console.log('Scrolling to chat:', id)
				} else {
					console.log('Element not found, retrying in 500ms...')
					// Retry once after a longer delay
					setTimeout(() => {
						const retryElement = document.getElementById(`chat-${id}`)
						if (retryElement) {
							retryElement.scrollIntoView({
								behavior: 'smooth',
								block: 'start',
							})
							console.log('Successfully scrolled to chat on retry:', id)
						} else {
							console.log('Element still not found after retry')
						}
					}, 500)
				}
			}, 1000)
		}
	}, [id, loading])

	if (!isAuthenticated || loading) {
		return <LoadingScreen />
	}

	// If we have an active chat ID, render the chat interface
	// Use the chat ID that is available (prefer local state but fall back to Redux)
	const chatIdToUse =
		activeChatId || reduxActiveChatId || pendingSession?.chat_id || null
	console.log('Rendering chat with ID:', chatIdToUse)

	return (
		<>
			<Chat
				key={chatIdToUse}
				id={chatIdToUse || ''}
				initialMessages={allMessages}
				isReadonly={isReadonly}
				useRawMessages={true}
				onReadonlyChange={setIsReadonly}
			/>
			<DataStreamHandler id={chatIdToUse || ''} />
		</>
	)
}
