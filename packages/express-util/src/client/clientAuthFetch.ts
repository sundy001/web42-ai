import { AUTH_ENDPOINTS, getApiBaseUrl } from "../shared/config";
import { AuthenticationError, handleApiResponse } from "../shared/errors";
import { DataWithTokensResult } from "../types";

export const clientAuthFetch = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<DataWithTokensResult<T>> => {
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
    return {
      data: await handleApiResponse<T>(retryResponse),
    };
  }

  return {
    data: await handleApiResponse<T>(response),
  };
};

const refreshTokens = async (): Promise<Response> => {
  const apiBaseUrl = getApiBaseUrl();
  return fetch(`${apiBaseUrl}${AUTH_ENDPOINTS.refresh}`, {
    method: "POST",
    credentials: "include",
  });
};
