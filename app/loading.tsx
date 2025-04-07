import { LoadingScreen } from '@/components/loading-screen'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Loading... | DeloConnect',
	description: 'Loading DeloConnect...',
}

export default function Loading() {
	return <LoadingScreen />
}
