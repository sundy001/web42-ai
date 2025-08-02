import { API_BASE_URL, API_ENDPOINTS } from "../config";
import {
  ApiRequestError,
  AuthenticationError,
  handleApiResponse,
} from "../errors";

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

  try {
    // Make initial request
    const response = await fetch(url, requestOptions);

    // Check for authentication errors
    if (response.status === 401 || response.status === 403) {
      // Attempt to refresh tokens
      try {
        const refreshResponse = await refreshTokens();
        handleApiResponse(refreshResponse);
      } catch (refreshError) {
        throw new AuthenticationError("Token refresh failed", {
          cause: refreshError,
        });
      }

      // Retry the original request once
      try {
        const retryResponse = await fetch(url, requestOptions);
        return handleApiResponse<T>(retryResponse);
      } catch (retryError) {
        throw new ApiRequestError(
          "Request failed after successful token refresh",
          500,
          undefined,
          {
            cause: retryError,
          },
        );
      }
    }

    return handleApiResponse<T>(response);
  } catch (error) {
    throw new ApiRequestError("Request failed", 500, undefined, {
      cause: error,
    });
  }
};
