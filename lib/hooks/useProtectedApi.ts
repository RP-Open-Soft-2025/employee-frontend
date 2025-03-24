import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { makeProtectedRequest } from "@/lib/api-client";

/**
 * Custom hook that provides a function for making protected API requests
 * with automatic handling of authentication and token refresh
 */
export function useProtectedApi() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = user?.accessToken ?? undefined;
  const refreshToken = user?.refreshToken ?? undefined;

  /**
   * Make an authenticated API request with automatic token refresh handling
   */
  const fetchProtected = async <T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> => {
    return makeProtectedRequest<T>(
      endpoint,
      accessToken,
      refreshToken,
      user,
      dispatch,
      router,
      options
    );
  };

  return { fetchProtected };
} 