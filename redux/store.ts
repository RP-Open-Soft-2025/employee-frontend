import { configureStore, type Store } from '@reduxjs/toolkit'
import authReducer from './features/auth'
import chatReducer from './features/chat'
import type { AuthState } from './features/auth'
import { createSerializableStateInvariantMiddleware } from '@reduxjs/toolkit'

// Configure serializable check middleware
const serializableMiddleware = createSerializableStateInvariantMiddleware({
	// Ignore specific action types
	ignoredActions: ['chat/setMessages'],
	// Alternatively ignore specific paths in state
	// ignoredPaths: ['chat.messages'],
})

// Root state interface
export interface RootState {
	auth: AuthState
	chat: {
		activeChatId: string | null
		chatStatus: string | null
		messages: any[]
	}
}

// Function to load the state from localStorage
function loadState(): RootState {
	try {
		if (typeof window !== 'undefined') {
			const userData = localStorage.getItem('user')
			const chatData = localStorage.getItem('chat')

			return {
				auth: {
					user: userData ? JSON.parse(userData) : null,
					isAuthenticated: !!userData,
					error: null,
				},
				chat: chatData
					? JSON.parse(chatData)
					: {
							activeChatId: null,
							chatStatus: null,
							messages: [],
						},
			}
		}
	} catch (err) {
		console.error('Failed to load state:', err)
	}

	return {
		auth: {
			user: null,
			isAuthenticated: false,
			error: null,
		},
		chat: {
			activeChatId: null,
			chatStatus: null,
			messages: [],
		},
	} // Fallback state
}

// Function to save the state to localStorage
function saveState(state: RootState): void {
	try {
		if (typeof window !== 'undefined') {
			if (state.auth.user) {
				localStorage.setItem('user', JSON.stringify(state.auth.user))
			} else {
				localStorage.removeItem('user')
			}

			// Save chat state - but only clear localStorage if activeChatId is explicitly null AND messages is empty
			if (state.chat.activeChatId) {
				localStorage.setItem('chat', JSON.stringify(state.chat))
			} else if (
				state.chat.activeChatId === null &&
				state.chat.messages.length === 0
			) {
				localStorage.removeItem('chat')
			}
		}
	} catch (error) {
		console.error('Failed to save state:', error)
	}
}

// Configure the Redux store
const store: Store<RootState> = configureStore({
	reducer: {
		auth: authReducer, // Use the auth reducer
		chat: chatReducer, // Add the chat reducer
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				// Ignore these specific action types
				ignoredActions: ['chat/setMessages'],
				// Alternatively, ignore specific paths in the state
				// ignoredPaths: ['chat.messages'],
			},
		}),
	preloadedState: loadState(), // Load initial state from localStorage
})

// Subscribe to store updates and save the state to localStorage
store.subscribe(() => {
	saveState(store.getState())
})

// Function to create the store (for SSR or CSR if needed)
export const makeStore = (): Store<RootState> => store

export default store
