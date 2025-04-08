import { Metadata } from 'next'
import ResetPasswordForm from './reset-password-form'

export const metadata: Metadata = {
	title: 'Reset Password',
	description:
		'Create a new password for your DeloConnect account to continue accessing employee support services.',
}

export default function ResetPasswordPage() {
	return <ResetPasswordForm />
}
