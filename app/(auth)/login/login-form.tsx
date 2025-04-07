'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from '@/components/toast'
import { useDispatch, useSelector } from 'react-redux'
import { loginSuccess, loginFailure, checkAuth } from '@/redux/features/auth'
import type { RootState } from '@/redux/store'
import { AuthForm } from '@/components/auth-form'
import { SubmitButton } from '@/components/submit-button'
import DeloitteLogo from './deloitte-logo.svg'

// Use environment variable for API URL with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function LoginForm() {
	const router = useRouter()
	const dispatch = useDispatch()
	const isAuthenticated = useSelector(
		(state: RootState) => state.auth.isAuthenticated
	)
	const error = useSelector((state: RootState) => state.auth.error)

	// Check authentication status on component mount
	useEffect(() => {
		dispatch(checkAuth())
	}, [dispatch])

	// If already authenticated, redirect to home
	useEffect(() => {
		if (isAuthenticated) {
			router.push('/')
		}
	}, [isAuthenticated, router])

	const [employeeId, setEmployeeId] = useState('')
	const [isSuccessful, setIsSuccessful] = useState(false)

	const handleSubmit = async (formData: FormData) => {
		setEmployeeId(formData.get('employee_id') as string)

		const data = {
			employee_id: formData.get('employee_id') as string,
			password: formData.get('password') as string,
		}

		console.log(data)

		try {
			console.log(API_URL)

			const response = await fetch(`${API_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})

			const result = await response.json()

			console.log(result)

			if (response.ok) {
				if (result.access_token) {
					const accessToken = result.access_token.access_token
					const refreshToken = result.refresh_token
					const role = result.role
					dispatch(
						loginSuccess({
							role,
							employee_id: data.employee_id,
							accessToken,
							refreshToken,
						})
					)
					console.log('Logged in successfully')
					setIsSuccessful(true)
					// The isAuthenticated effect will handle redirecting
				} else {
					console.error('Login failed: No access token received')
					toast({
						type: 'error',
						description: result.detail,
					})
					dispatch(loginFailure({ error: 'Invalid login' }))
				}
			} else if (response.status === 403) {
				console.error('Login failed: ', result.detail)
				dispatch(loginFailure({ error: 'Invalid login' }))
				toast({
					type: 'error',
					description: result.detail,
				})
			} else if (response.status === 307) {
				console.log('First time login - redirecting to password reset')
				toast({
					type: 'success',
					description: 'First time login - Please reset your password',
				})
				const redirectUrl = result.redirect_url
				router.push(redirectUrl)
				return
			} else {
				console.error('Login failed: Server error')
				toast({
					type: 'error',
					description: 'Failed validating your submission!',
				})
				dispatch(loginFailure({ error: 'Server error' }))
			}
		} catch (error) {
			console.error('Login error:', error)

			const errorMessage =
				error instanceof Error ? error.message : 'Network error'

			// Differentiate between credential errors and server errors
			if (
				errorMessage.toLowerCase().includes('invalid credentials') ||
				errorMessage.toLowerCase().includes('unauthorized')
			) {
				toast({
					type: 'error',
					description: 'Invalid credentials!',
				})
			} else {
				toast({
					type: 'error',
					description:
						(error instanceof Error ? error.message : String(error)) ||
						'An error occurred during login',
				})
			}

			dispatch(loginFailure({ error: errorMessage }))
		}
	}

	return (
		<div className="w-full h-screen md:min-h-screen flex flex-col md:flex-row">
			{/* Left Section (Theme Blue) */}
			<div className="h-[50vh] md:h-auto w-full md:w-1/2 flex items-center justify-center bg-[hsl(var(--primary))] dark:bg-[hsl(var(--secondary))] relative">
				<div className="rounded-none md:rounded-l-2xl rounded-tl-0xl size-full md:size-[400px] bg-[hsl(var(--secondary))] dark:bg-[hsl(var(--deep-blue-darker))] shadow-lg flex flex-col items-center justify-center text-center p-6 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 py-15">
					<h1 className="text-3xl font-bold text-white mb-2">Deloitte.</h1>
					<Image
						src={DeloitteLogo}
						alt="Deloitte Logo"
						width={150}
						height={150}
						className="rounded-lg shadow-[0_0_70px_25px_rgba(255,255,255,0.2)] dark:shadow-[0_0_70px_25px_rgba(255,255,255,0.15)]"
					/>
				</div>
			</div>

			{/* Right Section (Black in dark mode) */}
			<div className="h-[50vh] md:h-auto w-full md:w-1/2 flex items-center justify-center bg-gray-200 dark:bg-black relative">
				<div className="rounded-none md:rounded-r-2xl size-full md:size-[400px] bg-[#D9D9D9] dark:bg-zinc-900 shadow-lg p-6 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2">
					<div className="flex flex-col items-center justify-center h-full md:mt-0 px-10">
						<div className="font-semibold text-2xl mb-3 text-black dark:text-white">
							Login
						</div>
						<div className="auth-container w-full [&_input]:text-black dark:[&_input]:text-white">
							<AuthForm action={handleSubmit} defaultEmployeeId={employeeId}>
								<SubmitButton isSuccessful={isSuccessful}>Submit</SubmitButton>
								<div className="flex flex-col items-center">
									<Link
										href="/forgot-password"
										className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer text-sm"
									>
										Forgot password?
									</Link>
								</div>
							</AuthForm>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
} 