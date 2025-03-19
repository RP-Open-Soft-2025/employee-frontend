import { configureStore, Store } from "@reduxjs/toolkit";
import authReducer from "./features/auth";
import { AuthState } from "./features/auth";

// Root state interface
export interface RootState {
  auth: AuthState;
}

// Function to load the state from localStorage
function loadState(): RootState {
  try {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("userToken");
      const user = localStorage.getItem("user");

      return {
        auth: {
          userToken: token ? token : null,
          user: user ? JSON.parse(user) : null, 
          isAuthenticated: !!token, 
          error: null,
        },
      };
    }
  } catch (err) {
    console.error("Failed to load state:", err);
  }

  return { auth: { userToken: null, user: null, isAuthenticated: false, error: null } }; // Fallback state
}

// Function to save the state to localStorage
function saveState(state: RootState): void {
  try {
    if (typeof window !== "undefined") {
      if (state.auth.userToken) {
        localStorage.setItem("userToken", state.auth.userToken);
      } else {
        localStorage.removeItem("userToken");
      }

      if (state.auth.user) {
        localStorage.setItem("user", JSON.stringify(state.auth.user)); 
      } else {
        localStorage.removeItem("user"); 
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
