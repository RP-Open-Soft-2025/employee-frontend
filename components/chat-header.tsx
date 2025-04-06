'use client'

import { useRouter } from 'next/navigation'
import { useWindowSize } from 'usehooks-ts'
import { ChevronDown, LayoutDashboard, UserCircle, XCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { logout, checkAuth } from '@/redux/features/auth'
import type { RootState } from '@/redux/store'
import { memo, useEffect, useState } from 'react'

import { SidebarToggle } from '@/components/sidebar-toggle'
import { Button } from '@/components/ui/button'
import { useSidebar } from './ui/sidebar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function HeaderUserNav() {
	const router = useRouter()
	const dispatch = useDispatch()
	const user = useSelector((state: RootState) => state.auth.user)
	const isAuthenticated = useSelector(
		(state: RootState) => state.auth.isAuthenticated
	)
	const [isLoggingOut, setIsLoggingOut] = useState(false)

	useEffect(() => {
		dispatch(checkAuth())
	}, [dispatch])

	useEffect(() => {
		if (!isAuthenticated) {
			router.push('/login')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

	const handleLogOut = async () => {
		setIsLoggingOut(true)
		try {
			// Proceed with local logout using Redux
			dispatch(logout())
			router.push('/login')
		} catch (error) {
			console.error('Error during logout:', error)
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="bg-white dark:bg-[#0b1423] text-black dark:text-white flex py-1.5 px-4 order-4 md:ml-auto gap-2 border-gray-200 dark:border-gray-800"
				>
					<UserCircle className="size-5" />
					<span className="truncate hidden md:block">{user?.employee_id}</span>
					<ChevronDown className="size-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[--radix-popper-anchor-width] min-w-fit whitespace-nowrap notification-dropdown-content"
			>
				<DropdownMenuItem
					className="cursor-pointer notification-item"
					onSelect={() => router.push('/')}
				>
					<LayoutDashboard className="mr-2 size-4 text-[hsl(var(--deep-blue-accent))]" />
					Dashboard
				</DropdownMenuItem>
				{/* <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => {
            router.push("/session");
          }}
        >
          <MessageSquare className="mr-2 size-4" />
          View Session
        </DropdownMenuItem> */}
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<button
						type="button"
						className="w-full cursor-pointer notification-item relative"
						onClick={handleLogOut}
						disabled={isLoggingOut}
					>
						{isLoggingOut ? (
							<>
								<span className="opacity-0">Sign out</span>
								<div className="absolute inset-0 flex items-center justify-center">
									<svg className="animate-spin h-4 w-4 text-[hsl(var(--deep-blue-accent))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								</div>
							</>
						) : (
							"Sign out"
						)}
					</button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function PureChatHeader({
	chatId,
	isReadonly,
	onChatEnd,
	can_end_chat = false,
}: {
	chatId: string
	isReadonly: boolean
	onChatEnd?: () => void
	can_end_chat?: boolean
}) {
	const router = useRouter()
	const { open } = useSidebar()
	const [isEndingChat, setIsEndingChat] = useState(false)
	
	const { width: windowWidth } = useWindowSize()

	const handleEndChat = async () => {
		if (!chatId || !can_end_chat) return;
		
		setIsEndingChat(true);
		const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
		
		try {
			const response = await fetch(`${API_URL}/llm/chat/end-session`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					chat_id: chatId,
					chain_id: chatId // Assuming chain_id is the same as chatId, adjust if needed
				})
			});
			
			if (response.ok) {
				console.log('Chat ended successfully');
				
				// Call the callback to update parent component states
				if (onChatEnd) {
					onChatEnd();
				}
			} else {
				console.error('Failed to end chat:', await response.json());
			}
		} catch (error) {
			console.error('Error ending chat:', error);
		} finally {
			setIsEndingChat(false);
		}
	};

	return (
		<header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2 justify-between">
			<div className="flex items-center">
				<SidebarToggle />
			</div>
			
			{can_end_chat && (
				<Button
					variant="destructive"
					size="sm"
					onClick={handleEndChat}
					disabled={isEndingChat}
					className="gap-2"
				>
					{isEndingChat ? (
						<>
							<span className="opacity-0">End Chat</span>
							<div className="absolute inset-0 flex items-center justify-center">
								<svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							</div>
						</>
					) : (
						<>
							<XCircle className="size-4" />
							End Chat
						</>
					)}
				</Button>
			)}
		</header>
	)
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
	return (
		prevProps.chatId === nextProps.chatId &&
		prevProps.isReadonly === nextProps.isReadonly &&
		prevProps.can_end_chat === nextProps.can_end_chat
	);
});
