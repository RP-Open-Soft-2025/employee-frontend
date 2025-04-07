'use client'

import type { Message } from 'ai'
import cx from 'classnames'
import type React from 'react'
import {
	useRef,
	useEffect,
	useCallback,
	useState,
	type Dispatch,
	type SetStateAction,
	memo,
} from 'react'
import { toast } from 'sonner'
import { useLocalStorage, useWindowSize } from 'usehooks-ts'
import SpeechRecognition, {
	useSpeechRecognition,
} from 'react-speech-recognition'

import { ArrowUpIcon } from './icons'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import type { UseChatHelpers } from '@ai-sdk/react'
import { Mic, MicOff } from 'lucide-react'

// Silence detection timeout in milliseconds
const SILENCE_TIMEOUT = 5000

function PureMultimodalInput({
	chatId,
	input,
	setInput,
	status,
	messages,
	setMessages,
	append,
	handleSubmit,
	className,
}: {
	chatId: string
	input: UseChatHelpers['input']
	setInput: UseChatHelpers['setInput']
	status: UseChatHelpers['status']
	messages: Array<Message>
	setMessages: Dispatch<SetStateAction<Array<Message>>>
	append: UseChatHelpers['append']
	handleSubmit: UseChatHelpers['handleSubmit']
	className?: string
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const { width } = useWindowSize()
	const [isListening, setIsListening] = useState(false)
	const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
	const [lastTranscript, setLastTranscript] = useState('')

	const resetSilenceTimer = useCallback(() => {
		// Clear any existing timer
		if (silenceTimerRef.current) {
			clearTimeout(silenceTimerRef.current)
			silenceTimerRef.current = null
		}

		// Set new timer if currently listening
		if (isListening) {
			silenceTimerRef.current = setTimeout(() => {
				// console.log(
				// 	`No speech detected for ${SILENCE_TIMEOUT}ms, stopping listening`
				// )
				SpeechRecognition.stopListening()
				setIsListening(false)
				toast.info(
					'Voice input disabled due to inactivity. Your text is preserved.'
				)

				// Do not reset the transcript - keep it in the input field
				// This way the user can review what was transcribed before sending
			}, SILENCE_TIMEOUT)
		}
	}, [isListening])

	// Configure react-speech-recognition hook with debug for error tracking
	const {
		transcript,
		listening,
		resetTranscript,
		browserSupportsSpeechRecognition,
		isMicrophoneAvailable,
	} = useSpeechRecognition({
		commands: [],
		transcribing: true,
		clearTranscriptOnListen: false,
	})

	// Log speech recognition state for debugging
	// useEffect(() => {
	// 	console.log('Speech recognition state:', {
	// 		browserSupports: browserSupportsSpeechRecognition,
	// 		microphoneAvailable: isMicrophoneAvailable,
	// 		listening,
	// 		transcript,
	// 	})
	// }, [
	// 	browserSupportsSpeechRecognition,
	// 	isMicrophoneAvailable,
	// 	listening,
	// 	transcript,
	// ])

	// Update isListening state based on the library's listening state
	useEffect(() => {
		setIsListening(listening)
	}, [listening])

	// Update input field with transcript
	useEffect(() => {
		if (transcript && transcript !== lastTranscript) {
			// console.log('New transcript detected:', transcript)
			setInput(transcript)
			setLastTranscript(transcript)
			adjustHeight()
			// Reset silence timer when new transcript is received
			resetSilenceTimer()
		}
	}, [transcript, setInput, resetSilenceTimer, lastTranscript])

	// Clean up silence timer on unmount
	useEffect(() => {
		return () => {
			if (silenceTimerRef.current) {
				clearTimeout(silenceTimerRef.current)
				silenceTimerRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (textareaRef.current) {
			adjustHeight()
		}
	}, [])

	const adjustHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`
		}
	}

	const resetHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = '98px'
		}
	}

	const [localStorageInput, setLocalStorageInput] = useLocalStorage('input', '')

	useEffect(() => {
		if (textareaRef.current) {
			const domValue = textareaRef.current.value
			// Prefer DOM value over localStorage to handle hydration
			const finalValue = domValue || localStorageInput || ''
			setInput(finalValue)
			adjustHeight()
		}
		// Only run once after hydration
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		setLocalStorageInput(input)
	}, [input, setLocalStorageInput])

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(event.target.value)
		adjustHeight()
	}

	const submitForm = useCallback(() => {
		handleSubmit()
		setLocalStorageInput('')
		resetTranscript()
		setLastTranscript('')
		resetHeight()

		if (width && width > 768) {
			textareaRef.current?.focus()
		}
	}, [handleSubmit, setLocalStorageInput, resetTranscript, width])

	// Toggle listening state
	const toggleListening = useCallback(() => {
		if (!browserSupportsSpeechRecognition) {
			toast.error(
				'Speech recognition is not supported in your browser. Try Chrome or Edge browser.'
			)
			console.error('Speech recognition not supported in this browser')
			return
		}

		if (!isMicrophoneAvailable) {
			toast.error('Microphone access is required for speech recognition')
			console.error('Microphone not available')
			return
		}

		if (listening) {
			// Stop listening
			SpeechRecognition.stopListening()
			setIsListening(false)
			toast.info('Voice input disabled. Your text remains in the input field.')

			// Clear silence timer
			if (silenceTimerRef.current) {
				clearTimeout(silenceTimerRef.current)
				silenceTimerRef.current = null
			}

			// Keep the transcript in the input field, don't reset it
			// The user can review and edit before sending
		} else {
			// Start listening
			try {
				// Only reset transcript if the input field is empty
				// This preserves any existing text if the user is toggling speech
				if (!input || input.trim() === '') {
					resetTranscript()
					setLastTranscript('')
				}

				// Try to start continuous listening
				SpeechRecognition.startListening({
					continuous: true,
					language: 'en-US',
				}).catch(error => {
					console.error('Error starting speech recognition:', error)
					toast.error(
						'Failed to start speech recognition. Please check microphone permissions.'
					)
				})

				setIsListening(true)
				toast.success('Voice input enabled. Speak to type your message.')

				// Initialize silence timer
				resetSilenceTimer()
			} catch (error) {
				console.error('Exception starting speech recognition:', error)
				toast.error('Failed to start speech recognition')
			}
		}
	}, [
		listening,
		browserSupportsSpeechRecognition,
		isMicrophoneAvailable,
		resetSilenceTimer,
		resetTranscript,
		input,
	])

	// Keyboard shortcut (Alt+M) to toggle voice input
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.altKey && e.key === 'm') {
				e.preventDefault()
				toggleListening()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [toggleListening])

	return (
		<div className="relative w-full flex flex-col gap-4">
			<Textarea
				data-testid="multimodal-input"
				ref={textareaRef}
				placeholder={
					isListening
						? `Listening... Speak to type your message (press Enter to send when ready)`
						: 'Send a message or press Alt+M for voice input'
				}
				value={input}
				onChange={handleInput}
				className={cx(
					'min-h-[24px] max-h-[calc(20dvh)] overflow-y-scroll [scrollbar-width:_none] resize-none rounded-2xl !text-base bg-white text-gray-800 dark:text-white dark:bg-[hsl(var(--deep-blue-darker))] border-gray-200 dark:border-[hsl(var(--deep-blue-dark))] focus:ring-2 focus:ring-[#2563eb] dark:focus:ring-[#3b82f6] focus:ring-opacity-50 focus:border-[#2563eb] dark:focus:border-[#3b82f6] focus:outline-none',
					isListening && 'border-green-500 dark:border-green-500',
					className
				)}
				rows={2}
				autoFocus
				onKeyDown={event => {
					if (
						event.key === 'Enter' &&
						!event.shiftKey &&
						!event.nativeEvent.isComposing
					) {
						event.preventDefault()

						if (status !== 'ready') {
							toast.error('Please wait for the model to finish its response!')
						} else {
							submitForm()
						}
					}
				}}
			/>

			<div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end items-center gap-2">
				<Button
					className={`rounded-full p-1.5 h-fit border ${
						isListening
							? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 animate-pulse'
							: 'border-gray-200 dark:border-[hsl(var(--deep-blue-dark))] bg-white dark:bg-[hsl(var(--deep-blue-darker))] text-gray-700 dark:text-white'
					}`}
					onClick={toggleListening}
					title={
						isListening
							? 'Disable voice input (Alt+M)'
							: 'Enable voice input (Alt+M)'
					}
				>
					{isListening ? <Mic size={14} /> : <MicOff size={14} />}
				</Button>
				<SendButton input={input} submitForm={submitForm} />
			</div>
		</div>
	)
}

export const MultimodalInput = memo(
	PureMultimodalInput,
	(prevProps, nextProps) => {
		if (prevProps.input !== nextProps.input) return false
		if (prevProps.status !== nextProps.status) return false

		return true
	}
)

function PureSendButton({
	submitForm,
	input,
}: {
	submitForm: () => void
	input: string
}) {
	return (
		<Button
			data-testid="send-button"
			className="rounded-full p-1.5 h-fit border border-gray-200 dark:border-[hsl(var(--deep-blue-dark))] bg-white dark:bg-[hsl(var(--deep-blue-darker))] text-[#2563eb] dark:text-white"
			onClick={event => {
				event.preventDefault()
				submitForm()
			}}
			disabled={input.length === 0}
		>
			<ArrowUpIcon size={14} />
		</Button>
	)
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
	if (prevProps.input !== nextProps.input) return false
	return true
})
