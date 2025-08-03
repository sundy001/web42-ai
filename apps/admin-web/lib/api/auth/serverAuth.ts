import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { AuthenticationError, handleApiResponse } from "../errors";
import type { MeResponse } from "../types";

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserWithTokensResult {
  user: MeResponse;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

const fetchCurrentUser = async (accessToken: string): Promise<Response> => {
  return fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.me}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const refreshTokens = async (
  refreshToken: string,
): Promise<RefreshTokenResponse> => {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.auth.refreshApi}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: "include",
    },
  );

  return handleApiResponse<RefreshTokenResponse>(response);
};

const handleTokenRefreshAndRetry = async (
  theRefreshToken: string,
): Promise<UserWithTokensResult> => {
  try {
    const { accessToken, refreshToken } = await refreshTokens(theRefreshToken);

    const response = await fetchCurrentUser(accessToken);
    const user = await handleApiResponse<MeResponse>(response);

    return {
      user,
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    };
  } catch (error) {
    throw new AuthenticationError("Token refresh failed", {
      cause: error,
    });
  }
};

export const getCurrentUserWithTokenRefresh = async (
  accessToken: string,
  refreshToken?: string,
): Promise<UserWithTokensResult> => {
  const response = await fetchCurrentUser(accessToken);

  if ((response.status === 401 || response.status === 403) && refreshToken) {
    return handleTokenRefreshAndRetry(refreshToken);
  }

  const user = await handleApiResponse<MeResponse>(response);
  return { user };
};
