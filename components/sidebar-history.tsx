'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { memo, useEffect, useState } from 'react'
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubItem,
	SidebarMenuSubButton,
	useSidebar,
} from '@/components/ui/sidebar'
import { useProtectedApi } from '@/lib/hooks/useProtectedApi'
import { MessageSquare, Bell, ChevronDown, ChevronRight } from 'lucide-react'

// Chain API Interfaces
interface ChainResponse {
	chain_id: string
	employee_id: string
	session_ids: string[]
	status: string
	context: string
	created_at: string
	updated_at: string
	completed_at: string | null
	escalated_at: string | null
	cancelled_at: string | null
	notes: string | null
}

interface ChainsApiResponse {
	chains: ChainResponse[]
}

// Chain data structure for UI
interface Chain {
	id: string
	employeeId: string
	sessionIds: string[]
	status: string
	context: string
	createdAt: string
	updatedAt: string
	completedAt: string | null
	escalatedAt: string | null
	cancelledAt: string | null
	notes: string | null
	isOpen?: boolean // UI state to track if dropdown is open
	sessions?: Session[] // Store sessions within chain
}

// Session data structure for UI
interface Session {
	id: string // This remains as sessionId for backward compatibility
	chatId: string // Add chatId field
	lastMessage: string
	lastMessageTime: string
	mode: string
	isEscalated: boolean
	totalMessages: number
	unreadCount: number
	created_at: string
}

function formatDate(date: Date): string {
	const pad = (n: number) => n.toString().padStart(2, '0')

	// const day = pad(date.getDate());
	// const month = pad(date.getMonth() + 1); // Months are 0-indexed
	let hours = date.getHours()
	const minutes = pad(date.getMinutes())
	// const year = pad(date.getUTCFullYear());

	const ampm = hours >= 12 ? 'PM' : 'AM'
	hours = hours % 12
	hours = hours ? hours : 12 // Convert 0 to 12 for midnight

	return `${hours}:${minutes} ${ampm}`
}
// Chain item component with expandable sessions
const ChainItem = ({
	chain,
	activeChatId,
	setOpenMobile,
	onChatClick,
	onToggleChain,
}: {
	chain: Chain
	activeChatId: string | undefined
	setOpenMobile: (open: boolean) => void
	onChatClick: (chatId: string) => void
	onToggleChain: (chainId: string) => void
}) => {
	const formattedDate = new Date(chain.createdAt).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	const isEscalated = chain.escalatedAt !== null
	const statusText =
		chain.status.charAt(0).toUpperCase() + chain.status.slice(1)

	// Sessions are now fetched at page load and passed down
	// No need for useState or fetching logic here
	const sessions = chain.sessions || []

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				onClick={() => onToggleChain(chain.id)}
				className="justify-between"
			>
				<div className="flex items-center gap-2">
					{chain.isOpen ? (
						<ChevronDown className="size-4" />
					) : (
						<ChevronRight className="size-4" />
					)}
					<div className="flex flex-col">
						<span className="text-sm truncate">{formattedDate}</span>
						<span className="text-xs text-sidebar-foreground/80 truncate">
							{statusText} - {`Chain ${chain.id.substring(0, 8)}`}
						</span>
					</div>
				</div>
				{/* <div className="flex items-center gap-2">
					{isEscalated && <Bell className="size-3 text-yellow-600" />}
				</div> */}
			</SidebarMenuButton>

			{chain.isOpen && (
				<SidebarMenuSub>
					{sessions.length === 0 ? (
						<SidebarMenuSubItem>
							<div className="text-xs text-sidebar-foreground/50 py-1">
								No sessions found
							</div>
						</SidebarMenuSubItem>
					) : (
						sessions.map(session => (
							<SidebarMenuSubItem key={session.id}>
								<SidebarMenuSubButton
									isActive={session.chatId === activeChatId}
									onClick={() => {
										// console.log(
										// 	`Session clicked in sidebar: ${session.id}, Chat ID: ${session.chatId}`
										// )
										onChatClick(chain.id)
										setOpenMobile(false)
									}}
									className="cursor-pointer"
								>
									<MessageSquare className="size-3" />
									<span className="truncate">Session {session.id}</span>
									{session.unreadCount > 0 && (
										<span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center">
											{session.unreadCount}
										</span>
									)}
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						))
					)}
				</SidebarMenuSub>
			)}
		</SidebarMenuItem>
	)
}

// Memoized chain item component
const MemoizedChainItem = memo(ChainItem)

export function SidebarHistory({ user }: { user: any }) {
	const { setOpenMobile } = useSidebar()
	const params = useParams()
	// This id from URL params represents a chat ID, not a session ID
	const activeChatId = params?.id as string | undefined
	const pathname = usePathname()
	const router = useRouter()
	const [chains, setChains] = useState<Chain[]>([])
	const [loading, setLoading] = useState(false)
	const { fetchProtected } = useProtectedApi()

	const handleChatClick = (chatId: string) => {
		// console.log('========== CHAT CLICK DEBUGGING ==========')
		// console.log(`Chat clicked with ID: "${chatId}"`)

		// Update to use dynamic routing instead of query params
		// console.log(`Navigating to session page: /session/${chatId}`)
		router.push(`/session/${chatId}`)

		// console.log('===========================================')
	}

	const toggleChain = (chainId: string) => {
		setChains(prevChains =>
			prevChains.map(chain =>
				chain.id === chainId ? { ...chain, isOpen: !chain.isOpen } : chain
			)
		)
	}

	// Completely rewrite the session fetching function to properly handle errors
	const fetchSessionsForChain = async (chain: Chain): Promise<Session[]> => {
		// console.log(`Fetching sessions for chain ${chain.id}`)

		if (!chain.sessionIds || chain.sessionIds.length === 0) {
			return []
		}

		const sessionsData: Session[] = []

		// Process each session ID sequentially to avoid overwhelming the API
		for (const sessionId of chain.sessionIds) {
			try {
				// Use a safe fetch approach that never throws
				const result = await safeApiFetch(
					`/employee/chains/${chain.id}/messages`
				)

				if (result?.success) {
					const data = result.data
					const messages = data.messages || []
					const lastMessage =
						messages.length > 0
							? messages[messages.length - 1].text
							: 'No messages'

					// Find the session data from the response that matches this sessionId
					const sessionInfo = data.sessions?.find(
						(s: any) => s.session_id === sessionId
					)
					const chatId = sessionInfo?.chat_id || sessionId // Fall back to sessionId if chat_id not found

					sessionsData.push({
						id: sessionId,
						chatId: chatId, // Store the chat_id
						lastMessage: lastMessage,
						lastMessageTime: data.last_updated || chain.updatedAt,
						mode: data.chat_mode || 'default',
						isEscalated: data.is_escalated || false,
						totalMessages: data.total_messages || messages.length || 0,
						unreadCount: 0,
						created_at: chain.createdAt,
					})
				} else {
					// API request failed or returned error response
					// console.log(`Using mock data for session ${sessionId} (API error)`)
					sessionsData.push(createMockSession(sessionId, chain))
				}
			} catch (e) {
				// This should never happen with safeApiFetch, but just in case
				// console.error(`Unexpected error for session ${sessionId}:`, e)
				sessionsData.push(createMockSession(sessionId, chain))
			}
		}

		return sessionsData
	}

	// A wrapper around fetchProtected that never throws errors
	const safeApiFetch = async (endpoint: string) => {
		// console.log(`API request to ${endpoint} failed silently`)
		try {
			const data = await fetchProtected(endpoint)
			return { success: true, data }
		} catch (error) {
			// console.log(`API request to ${endpoint} failed silently`)
			return { success: false, error }
		}
	}

	const fetchChains = async () => {
		// console.log('Starting to fetch chains...')
		try {
			setLoading(true)

			// Try to fetch from the API using our safe wrapper
			const result = await safeApiFetch('/employee/chains')
			let chainsData: ChainResponse[] = []

			if (result?.success) {
				const data = result.data
				// console.log('Chains API response successful:', data)

				// Check different possible response structures
				if (Array.isArray(data)) {
					chainsData = data
					// console.log('API returned chains as direct array')
				} else if (data?.chains && Array.isArray(data.chains)) {
					chainsData = data.chains
					// console.log("API returned chains in 'chains' property")
				} else if (data && typeof data === 'object') {
					// Try to extract chains if it's not in the expected format
					// console.log(
					// 	'Unexpected API response format, attempting to find chains'
					// )

					// Check if the result itself matches our expected chain shape
					if (data.chain_id) {
						chainsData = [data]
						// console.log('API returned a single chain object')
					} else {
						// Look for array properties that might contain chains
						for (const key in data) {
							if (Array.isArray(data[key]) && data[key].length > 0) {
								if (data[key][0].chain_id) {
									chainsData = data[key]
									// console.log(`Found chains in property: ${key}`)
									break
								}
							}
						}
					}
				}
			} else {
				// console.log('API request for chains failed, using mock data')
			}

			// If we couldn't get chains from the API, use mock data

			// console.log('Processed chainsData:', chainsData)

			// Sort chains by creation date, newest first
			chainsData.sort((a: ChainResponse, b: ChainResponse) => {
				return (
					new Date(b.created_at || Date.now()).getTime() -
					new Date(a.created_at || Date.now()).getTime()
				)
			})

			// Convert API response to our Chain model
			const processedChains = chainsData.map((chain: ChainResponse) => ({
				id: chain.chain_id,
				employeeId: chain.employee_id || '',
				sessionIds: chain.session_ids || [],
				status: chain.status || 'unknown',
				context: chain.context || '',
				createdAt: chain.created_at || new Date().toISOString(),
				updatedAt:
					chain.updated_at || chain.created_at || new Date().toISOString(),
				completedAt: chain.completed_at,
				escalatedAt: chain.escalated_at,
				cancelledAt: chain.cancelled_at,
				notes: chain.notes,
				isOpen: false, // Initially closed
				sessions: [], // Will be populated with session data
			}))

			// Set initial chains without session data
			setChains(processedChains)

			// Fetch sessions for all chains in parallel
			const chainsWithSessions = await Promise.all(
				processedChains.map(async chain => {
					const sessions = await fetchSessionsForChain(chain)
					return {
						...chain,
						sessions,
					}
				})
			)

			// Update chains with session data
			setChains(chainsWithSessions)
			// console.log('All chains and sessions loaded:', chainsWithSessions)
		} catch (e) {
			// console.error('Completely failed to fetch chains:', e)
			// If everything fails, still show mock data

			// Fetch mock sessions for each chain
		} finally {
			// console.log('Chains fetch process completed')
			setLoading(false)
		}
	}

	// Function to generate mock chain data for testing

	// Create a mock session for when API fails
	const createMockSession = (sessionId: string, chain: Chain): Session => {
		return {
			id: sessionId,
			chatId: sessionId, // For mock data, use sessionId as chatId
			lastMessage: 'Session data unavailable',
			lastMessageTime: chain.updatedAt,
			mode: 'default',
			isEscalated: false,
			totalMessages: 0,
			unreadCount: 0,
			created_at: chain.createdAt,
		}
	}

	useEffect(() => {
		if (user) {
			fetchChains()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])

	if (!user) {
		return (
			<SidebarGroup>
				<SidebarGroupContent>
					<div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
						Login to save and revisit previous sessions!
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		)
	}

	if (loading && chains.length === 0) {
		return (
			<SidebarGroup>
				<div className="px-2 py-1 text-xs text-sidebar-foreground/50">
					Loading...
				</div>
				<SidebarGroupContent>
					<div className="flex flex-col">
						{[44, 32, 28, 64, 52].map(item => (
							<div
								key={item}
								className="rounded-md h-8 flex gap-2 px-2 items-center"
							>
								<div
									className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
									style={
										{
											'--skeleton-width': `${item}%`,
										} as React.CSSProperties
									}
								/>
							</div>
						))}
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		)
	}

	if (chains.length === 0) {
		return (
			<SidebarGroup>
				<SidebarGroupContent>
					<div className="px-2 text-zinc-300 dark:text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
						Your sessions will appear here once you start chatting!
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		)
	}

	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{chains.map(chain => (
						<MemoizedChainItem
							key={chain.id}
							chain={chain}
							activeChatId={activeChatId}
							setOpenMobile={setOpenMobile}
							onChatClick={handleChatClick}
							onToggleChain={toggleChain}
						/>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
