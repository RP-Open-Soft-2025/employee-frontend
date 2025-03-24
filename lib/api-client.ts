import { refreshAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
};

/**
 * Makes an authenticated API request with automatic token refresh handling
 * 
 * @param endpoint The API endpoint (without the base URL)
 * @param accessToken The current access token
 * @param refreshToken The refresh token for auto-refresh if needed
 * @param user The current user object from Redux store
 * @param dispatch Redux dispatch function
 * @param router Next.js router
 * @param options Additional fetch options (method, body, etc)
 * @returns Promise with the API response data
 */
export async function makeProtectedRequest<T = any>(
  endpoint: string,
  accessToken: string | undefined,
  refreshToken: string | undefined,
  user: any,
  dispatch: ReturnType<typeof useDispatch>,
  router: ReturnType<typeof useRouter>,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    // Create request with authorization header
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...headers
      }
    };

    // Add body if provided
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Make the API request
    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);

    // Handle successful response
    if (response.ok) {
      return await response.json();
    } 
    
    // Handle unauthorized error (token expired)
    if (response.status === 401) {
      // Try to refresh the token
      const success = await refreshAccessToken(refreshToken, user, dispatch, router);
      if (!success) {
        // Redirect to login page if token refresh failed
        router.push('/login');
        throw new Error('Session expired. Please login again.');
      } else {
        // Reload the page to use the new token
        window.location.reload();
      }
    }
    
    // Handle other errors
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
} 