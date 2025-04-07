import { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = {
	title: 'Login',
	description: 'Sign in to your DeloConnect account to access employee support and guidance.',
}

export default function LoginPage() {
	return <LoginForm />
}
