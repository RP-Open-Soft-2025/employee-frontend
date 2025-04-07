'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/toast'
import { LoadingScreen } from '@/components/loading-screen'

export default function ResetPasswordForm() {
	const router = useRouter()

	useEffect(() => {
		toast({
			type: 'error',
			description: 'Invalid empty reset password token',
		})
		router.push('/login')
	}, [router])

	return <LoadingScreen />
} 