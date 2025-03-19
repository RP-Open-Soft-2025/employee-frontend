import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// AuthState interface
export interface AuthState {
	userToken: string | null;
	user: {empID: string} | null;
	isAuthenticated: boolean;
	error: string | null;
}

// Initial state for authentication
const initialState: AuthState = {
	userToken: (typeof window !== 'undefined' && localStorage.getItem('userToken'))
		? localStorage.getItem('userToken')
		: null,
	user: (typeof window !== 'undefined' && localStorage.getItem('user'))
		? JSON.parse(localStorage.getItem('user') as string)
		: null,
	isAuthenticated: (typeof window !== 'undefined' && localStorage.getItem('userToken'))
		? true
		: false,
	error: null
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; user: { empID: string } }>
    ) => {
      state.userToken = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("userToken", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    loginFailure: (state, action: PayloadAction<{ error: string }>) => {
      state.error = action.payload.error;
      state.user = null;
      state.isAuthenticated = false;
      state.userToken = null;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
      }
    },
    logout: (state) => {
      state.userToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
      }
    },
    checkAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("userToken");
        const user = localStorage.getItem("user");

        state.userToken = token;
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
