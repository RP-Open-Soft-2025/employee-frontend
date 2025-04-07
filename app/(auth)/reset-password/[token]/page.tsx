import { Metadata } from 'next'
import ResetPasswordTokenForm from './reset-password-token-form'

export const metadata: Metadata = {
	title: 'Set New Password',
	description: 'Create a new secure password for your DeloConnect account to continue accessing employee support services.',
}

export default function ResetPasswordTokenPage() {
	return <ResetPasswordTokenForm />
}
