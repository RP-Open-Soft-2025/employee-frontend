import { loginSuccess, logout } from "@/redux/features/auth";
import { Store } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Refreshes the access token using the refresh token
 * @param refreshToken The current refresh token
 * @param user The current user object
 * @param dispatch Redux dispatch function
 * @param router Next.js router for redirecting if refresh fails
 * @returns A promise that resolves to true if refresh was successful, false otherwise
 */
export const refreshAccessToken = async (
  refreshToken: string | null | undefined,
  user: RootState['auth']['user'],
  dispatch: any,
  router: ReturnType<typeof useRouter>
): Promise<boolean> => {
  if (!refreshToken) {
    dispatch(logout());
    router.push("/login");
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${refreshToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Update Redux state with the new access token
      dispatch(loginSuccess({
        role: user?.userRole || "",
        employee_id: user?.employee_id || "",
        accessToken: data.access_token.access_token,
        refreshToken: user?.refreshToken || ""
      }));
      
      return true;
    } else {
      // If refresh token is invalid or expired, redirect to login
      dispatch(logout());
      router.push("/login");
      return false;
    }
  } catch (error) {
    dispatch(logout());
    console.error("Failed to refresh access token:", error);
    router.push("/login");
    return false;
  }
};

/**
 * A function that can be used in server components or API routes to refresh the token
 * @param store Redux store
 * @returns A promise that resolves to the new access token or null
 */
export const refreshAccessTokenServer = async (store: Store): Promise<string | null> => {
  const state = store.getState();
  const user = state.auth.user;
  const refreshToken = user?.refreshToken;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${refreshToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Update Redux store
      store.dispatch(loginSuccess({
        role: user?.userRole || "",
        employee_id: user?.employee_id || "",
        accessToken: data.accessToken.accessToken,
        refreshToken: user?.refreshToken || ""
      }));
      
      return data.accessToken.accessToken;
    }
  } catch (error) {
    console.error("Failed to refresh access token:", error);
  }
  
  return null;
}; 