import { authFetch } from "../auth-client";
import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { AuthenticationError, handleApiResponse } from "../errors";
import type { LoginForm, MeResponse, User } from "../types";

export const loginUser = async (form: LoginForm): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  return handleApiResponse<User>(response);
};

export const getCurrentUser = async (): Promise<MeResponse> => {
  try {
    return await authFetch<MeResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.me}`,
    );
  } catch (error) {
    throw new AuthenticationError("Failed to get current user", {
      cause: error,
    });
  }
};

export const getCurrentUserOnServer = async (
  accessToken: string,
  refreshToken?: string,
): Promise<{
  user: MeResponse;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}> => {
  // Make initial request
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.me}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Check for authentication errors
  if ((response.status === 401 || response.status === 403) && refreshToken) {
    try {
      // Attempt to refresh tokens using the refresh/api endpoint
      const refreshResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}/api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
          credentials: "include",
        },
      );

      const refreshData = await handleApiResponse<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
      }>(refreshResponse);

      // Retry the original request with new access token
      const retryResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.auth.me}`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${refreshData.access_token}`,
          },
        },
      );

      const user = await handleApiResponse<MeResponse>(retryResponse);

      // Return user with new tokens
      return {
        user,
        tokens: {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
        },
      };
    } catch (error) {
      throw new AuthenticationError("Token refresh failed", {
        cause: error,
      });
    }
  }

  const user = await handleApiResponse<MeResponse>(response);
  return { user };
};
