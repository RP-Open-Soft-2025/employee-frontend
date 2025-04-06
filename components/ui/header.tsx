'use client'

import { Button } from '@/components/ui/button'
import { Bell, Mail, MailOpen, Sun, Moon } from 'lucide-react'
import { HeaderUserNav } from '@/components/chat-header'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Notification {
	id: string
	employee_id: string
	title: string
	description: string
	created_at: string
	status: string
}

interface HeaderProps {
	notifications?: Notification[]
	onNotificationClick?: (notificationId: string) => void
	onMarkAllAsRead?: () => void
	children: React.ReactNode
}

export function Header({
	notifications,
	onNotificationClick,
	onMarkAllAsRead,
	children,
}: HeaderProps) {
	const unreadCount =
		notifications?.filter(n => n.status === 'unread').length || 0
	const { setTheme, theme } = useTheme()

	const handleNotificationClick = (notification: Notification) => {
		if (notification.status === 'unread' && onNotificationClick) {
			onNotificationClick(notification.id)
		}
	}

	const formatNotificationTime = (dateString: string) => {
		const date = new Date(new Date(dateString).getTime())
		const now = new Date(new Date().getTime())
		const diffInHours =
			Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

		if (diffInHours < 24) {
			// If less than 24 hours, show time
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		} else {
			// If more than 24 hours, show date and time
			return date.toLocaleString([], {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
		}
	}

	return (
		<div className="flex flex-row justify-between items-center my-4 px-4 md:px-6 py-2 md:py-4 bg-card text-card-foreground rounded-lg border border-accent/20 shadow-sm bg-[#F9FAFC] dark:bg-[#0b1423]">
			<Link href="/">{children}</Link>
			<div className="flex items-center space-x-2 md:space-x-5">
				<Button
					variant="ghost"
					size="icon"
					className="text-black dark:text-white !bg-transparent !rounded-full h-8 w-8 md:h-10 md:w-10"
					onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
				>
					{theme === 'dark' ? (
						<Sun className="size-3.5 md:size-5" />
					) : (
						<Moon className="size-3.5 md:size-5" />
					)}
				</Button>

				{notifications && (
					<>
						{/* Mobile notification button (visible only on small screens) */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="relative flex md:hidden bg-white dark:bg-[#0b1423] text-black dark:text-white rounded-full border-gray-200 dark:border-gray-800 h-8 w-7"
								>
									<Bell className="size-3" />
									{unreadCount > 0 && (
										<span className="absolute -top-1 -right-1 bg-[hsl(var(--deep-blue-accent))] text-white rounded-full size-3.5 flex items-center justify-center text-[9px]">
											{unreadCount}
										</span>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-80 max-h-[400px] overflow-y-auto notification-dropdown-content"
							>
								{notifications.length === 0 ? (
									<div className="p-4 text-center text-sm text-muted-foreground">
										No notifications
									</div>
								) : (
									<div className="flex flex-col gap-1">
										{unreadCount > 0 && (
											<DropdownMenuItem
												className="flex items-center justify-center p-2 cursor-pointer border-b notification-item"
												onClick={() => onMarkAllAsRead?.()}
											>
												<span className="text-sm">Mark all as read</span>
											</DropdownMenuItem>
										)}
										{notifications.map(notification => (
											<DropdownMenuItem
												key={notification.id}
												className={`flex flex-col items-start p-4 cursor-pointer notification-item ${
													notification.status === 'unread' ? 'unread' : ''
												}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className="flex justify-between w-full items-start">
													<div className="flex items-center gap-2">
														{notification.status === 'unread' ? (
															<Mail className="size-4 text-[hsl(var(--deep-blue-accent))]" />
														) : (
															<MailOpen className="size-4" />
														)}
														<h4 className="font-medium">
															{notification.title}
														</h4>
													</div>
													<span className="text-xs">
														{formatNotificationTime(notification.created_at)}
													</span>
												</div>
												<p className="text-sm mt-1 line-clamp-2">
													{notification.description}
												</p>
											</DropdownMenuItem>
										))}
									</div>
								)}
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Desktop notification button (visible on md screens and up) */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="relative hidden md:flex bg-white dark:bg-[#0b1423] text-black dark:text-white border-gray-200 dark:border-gray-800"
								>
									<Bell className="size-4" />
									Notifications
									{unreadCount > 0 && (
										<span className="absolute -top-2 -right-2 bg-[hsl(var(--deep-blue-accent))] text-white rounded-full size-5 flex items-center justify-center text-xs">
											{unreadCount}
										</span>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-80 max-h-[400px] overflow-y-auto notification-dropdown-content"
							>
								{notifications.length === 0 ? (
									<div className="p-4 text-center text-sm text-muted-foreground">
										No notifications
									</div>
								) : (
									<div className="flex flex-col gap-1">
										{unreadCount > 0 && (
											<DropdownMenuItem
												className="flex items-center justify-center p-2 cursor-pointer border-b notification-item"
												onClick={() => onMarkAllAsRead?.()}
											>
												<span className="text-sm">Mark all as read</span>
											</DropdownMenuItem>
										)}
										{notifications.map(notification => (
											<DropdownMenuItem
												key={notification.id}
												className={`flex flex-col items-start p-4 cursor-pointer notification-item ${
													notification.status === 'unread' ? 'unread' : ''
												}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className="flex justify-between w-full items-start">
													<div className="flex items-center gap-2">
														{notification.status === 'unread' ? (
															<Mail className="size-4 text-[hsl(var(--deep-blue-accent))]" />
														) : (
															<MailOpen className="size-4" />
														)}
														<h4 className="font-medium">
															{notification.title}
														</h4>
													</div>
													<span className="text-xs">
														{formatNotificationTime(notification.created_at)}
													</span>
												</div>
												<p className="text-sm mt-1 line-clamp-2">
													{notification.description}
												</p>
											</DropdownMenuItem>
										))}
									</div>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				)}
				<HeaderUserNav />
			</div>
		</div>
	)
}
