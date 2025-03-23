import { configureStore, type Store } from "@reduxjs/toolkit";
import authReducer from "./features/auth";
import type { AuthState } from "./features/auth";

// Root state interface
export interface RootState {
  auth: AuthState;
}

// Function to load the state from localStorage
function loadState(): RootState {
  try {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const user = localStorage.getItem("user");
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      return {
        auth: {
          userRole: role ? role : null,
          user: user ? JSON.parse(user) : null, 
          isAuthenticated: !!role,
          error: null,
          accessToken: accessToken ? accessToken : null,
          refreshToken: refreshToken ? refreshToken : null,
        },
      };
    }
  } catch (err) {
    console.error("Failed to load state:", err);
  }

  return { 
    auth: { 
      userRole: null, 
      user: null, 
      isAuthenticated: false, 
      error: null,
      accessToken: null,
      refreshToken: null,
    } 
  }; // Fallback state
}

// Function to save the state to localStorage
function saveState(state: RootState): void {
  try {
    if (typeof window !== "undefined") {
      if (state.auth.userRole) {
        localStorage.setItem("userRole", state.auth.userRole);
      } else {
        localStorage.removeItem("userRole");
      }

      if (state.auth.user) {
        localStorage.setItem("user", JSON.stringify(state.auth.user)); 
      } else {
        localStorage.removeItem("user"); 
      }

      if (state.auth.accessToken) {
        localStorage.setItem("accessToken", state.auth.accessToken);
      } else {
        localStorage.removeItem("accessToken");
      }

      if (state.auth.refreshToken) {
        localStorage.setItem("refreshToken", state.auth.refreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }
    }
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

// Configure the Redux store
const store: Store<RootState> = configureStore({
  reducer: {
    auth: authReducer, // Use the auth reducer
  },
  preloadedState: loadState(), // Load initial state from localStorage
});

// Subscribe to store updates and save the state to localStorage
store.subscribe(() => {
  saveState(store.getState());
});

// Function to create the store (for SSR or CSR if needed)
export const makeStore = (): Store<RootState> => store;

export default store;
