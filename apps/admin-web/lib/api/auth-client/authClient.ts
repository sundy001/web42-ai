import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { AuthenticationError, handleApiResponse } from "../errors";

const refreshTokens = async (): Promise<Response> => {
  return fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`, {
    method: "POST",
    credentials: "include",
  });
};

export const authFetch = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  // Ensure credentials are included for cookie-based auth
  const requestOptions: RequestInit = {
    ...options,
    credentials: "include",
  };
  // Make initial request
  const response = await fetch(url, requestOptions);

  // Check for authentication errors
  if (response.status === 401 || response.status === 403) {
    try {
      // Attempt to refresh tokens
      const refreshResponse = await refreshTokens();
      await handleApiResponse(refreshResponse);
    } catch (error) {
      throw new AuthenticationError("Token refresh failed", {
        cause: error,
      });
    }

    const retryResponse = await fetch(url, requestOptions);
    return handleApiResponse<T>(retryResponse);
  }

  return handleApiResponse<T>(response);
};
