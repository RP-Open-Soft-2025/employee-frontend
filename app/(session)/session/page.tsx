'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import store from '@/redux/store'

// Define types for auth state and chain data
interface AuthState {
	user?: {
		accessToken: string
	}
}

interface StoreState {
	auth: AuthState
}

interface Chain {
	chain_id: string
	created_at: string
	// Add other chain properties as needed
}

export default function ChatPage() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const { auth } = store.getState() as StoreState

	useEffect(() => {
		// Function to fetch chains
		const fetchChains = async (): Promise<void> => {
			setIsLoading(true)
			try {
				const apiUrl = process.env.NEXT_PUBLIC_API_URL

				if (!apiUrl) {
					throw new Error('API URL not configured')
				}

				const response = await fetch(`${apiUrl}/employee/chains`, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${auth.user?.accessToken}`,
					},
					cache: 'no-store',
				})

				if (!response.ok) {
					throw new Error(`Failed to fetch chains: ${response.status}`)
				}

				const chainsData = (await response.json()) as Chain[]
				const hasChains =
					chainsData && Array.isArray(chainsData) && chainsData.length > 0

				// If chains exist, redirect to the latest one based on created_at
				if (hasChains) {
					// Sort chains by created_at (newest first)
					const sortedChains = [...chainsData].sort(
						(a: Chain, b: Chain) =>
							new Date(b.created_at).getTime() -
							new Date(a.created_at).getTime()
					)

					// Use the most recent chain
					const latestChain = sortedChains[0]
					console.log(
						`Redirecting to latest chain: ${latestChain.chain_id}, created at: ${latestChain.created_at}`
					)
					router.push(`/session/${latestChain.chain_id}`)
				} else {
					// No chains found
					setIsLoading(false)
				}
			} catch (err) {
				console.error('Error fetching chains:', err)
				setError(err instanceof Error ? err.message : 'Unknown error occurred')
				setIsLoading(false)
			}
		}

		fetchChains()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-4rem)]">
				<p>Loading sessions...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-4rem)]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-center">Error</CardTitle>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-red-500">Failed to load sessions: {error}</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	// If no chains exist, show a message
	return (
		<div className="flex items-center justify-center h-[calc(100vh-4rem)]">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center">No Sessions Available</CardTitle>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground">
						There are currently no active sessions available. Please check back
						later.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
