import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// AuthState interface
export interface AuthState {
	userRole: string | null;
	user: {employee_id: string} | null;
	isAuthenticated: boolean;
	error: string | null;
}

// Initial state for authentication
const initialState: AuthState = {
	userRole: (typeof window !== 'undefined' && localStorage.getItem('userRole'))
		? localStorage.getItem('userRole')
		: null,
	user: (typeof window !== 'undefined' && localStorage.getItem('user'))
		? JSON.parse(localStorage.getItem('user') as string)
		: null,
	isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('userRole')), // Updated to check userRole
	error: null
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ role: string; user: { employee_id: string } }>
    ) => {
      state.userRole = action.payload.role;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("userRole", action.payload.role);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    loginFailure: (state, action: PayloadAction<{ error: string }>) => {
      state.error = action.payload.error;
      state.user = null;
      state.isAuthenticated = false;
      state.userRole = null;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
      }
    },
    logout: (state) => {
      state.userRole = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
      }
    },
    checkAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("userRole");
        const user = localStorage.getItem("user");

        state.userRole = token; // This line should be updated to reflect the correct logic
        state.user = user ? JSON.parse(user) : null;
        state.isAuthenticated = !!token;
      }
    },
  },
});

// Export actions
export const { loginSuccess, loginFailure, logout, checkAuth } = authSlice.actions;

// Export reducer
export default authSlice.reducer;
