import { AuthenticationError, handleApiResponse } from "../shared/errors";
import { AuthConfig, DataWithTokensResult } from "../types";

export const createClientAuthFetch = (config: AuthConfig) => {
  const refreshTokens = async (): Promise<Response> => {
    return fetch(`${config.baseUrl}${config.endpoints.refresh}`, {
      method: "POST",
      credentials: "include",
    });
  };

  return async <T>(
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
};
