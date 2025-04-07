import { Metadata } from 'next'
import ForgotPasswordForm from './forgot-password-form'

export const metadata: Metadata = {
	title: 'Reset Password',
	description: 'Reset your DeloConnect account password to regain access to employee support services.',
}

export default function ForgotPasswordPage() {
	return <ForgotPasswordForm />
}
