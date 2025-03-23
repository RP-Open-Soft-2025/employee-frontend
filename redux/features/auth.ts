import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// AuthState interface
export interface AuthState {
	user: {
		userRole: string | null;
		employee_id: string | null;
		accessToken: string | null;
		refreshToken: string | null;
	} | null;
	isAuthenticated: boolean;
	error: string | null;
}

// Initial state for authentication
const initialState: AuthState = {
	user: (typeof window !== 'undefined' && localStorage.getItem('user'))
		? JSON.parse(localStorage.getItem('user') as string)
		: null,
	isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('user')),
	error: null
};

// Auth slice
const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		loginSuccess: (
			state,
			action: PayloadAction<{ 
				role: string; 
				employee_id: string; 
				accessToken: string;
				refreshToken: string;
			}>
		) => {
			state.user = {
				userRole: action.payload.role,
				employee_id: action.payload.employee_id,
				accessToken: action.payload.accessToken,
				refreshToken: action.payload.refreshToken
			};
			state.isAuthenticated = true;
			state.error = null;

			// Save to localStorage
			if (typeof window !== "undefined") {
				localStorage.setItem("user", JSON.stringify(state.user));
			}
		},
		loginFailure: (state, action: PayloadAction<{ error: string }>) => {
			state.error = action.payload.error;
			state.user = null;
			state.isAuthenticated = false;

			// Remove from localStorage
			if (typeof window !== "undefined") {
				localStorage.removeItem("user");
			}
		},
		logout: (state) => {
			state.user = null;
			state.isAuthenticated = false;
			state.error = null;

			// Remove from localStorage
			if (typeof window !== "undefined") {
				localStorage.removeItem("user");
			}
		},
		checkAuth: (state) => {
			if (typeof window !== "undefined") {
				const userData = localStorage.getItem("user");
				
				if (userData) {
					state.user = JSON.parse(userData);
					state.isAuthenticated = true;
				} else {
					state.user = null;
					state.isAuthenticated = false;
				}
			}
		},
	},
});

// Export actions
export const { loginSuccess, loginFailure, logout, checkAuth } = authSlice.actions;

// Export reducer
export default authSlice.reducer;
