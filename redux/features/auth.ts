import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// AuthState interface
export interface AuthState {
	userRole: string | null;
	user: {employee_id: string} | null;
	isAuthenticated: boolean;
	error: string | null;
	accessToken: string | null;  
	refreshToken: string | null;
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
	error: null,
	accessToken: (typeof window !== 'undefined' && localStorage.getItem('accessToken'))
		? localStorage.getItem('accessToken')
		: null,
	refreshToken: (typeof window !== 'undefined' && localStorage.getItem('refreshToken'))
		? localStorage.getItem('refreshToken')
		: null
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
        user: { employee_id: string }; 
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.userRole = action.payload.role;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("userRole", action.payload.role);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
    loginFailure: (state, action: PayloadAction<{ error: string }>) => {
      state.error = action.payload.error;
      state.user = null;
      state.isAuthenticated = false;
      state.userRole = null;
      state.accessToken = null;
      state.refreshToken = null;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    },
    logout: (state) => {
      state.userRole = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.accessToken = null;
      state.refreshToken = null;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    },
    checkAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("userRole");
        const user = localStorage.getItem("user");
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        state.userRole = token;
        state.user = user ? JSON.parse(user) : null;
        state.isAuthenticated = !!token;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
      }
    },
  },
});

// Export actions
export const { loginSuccess, loginFailure, logout, checkAuth } = authSlice.actions;

// Export reducer
export default authSlice.reducer;
