import { EmployeeDashboard } from '@/components/employee-dashboard'
import { Suspense } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Dashboard | DeloConnect',
	description:
		'Access your personalized employee dashboard with AI-powered support and guidance.',
}

export default function Page() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto p-4 md:p-6">Loading dashboard...</div>
			}
		>
			<EmployeeDashboard />
		</Suspense>
	)
}
