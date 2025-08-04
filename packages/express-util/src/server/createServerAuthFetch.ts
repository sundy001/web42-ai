const { cookies } = require("next/headers");
import { AuthenticationError, handleApiResponse } from "../shared/errors";
import {
  AuthConfig,
  DataWithTokensResult,
  RefreshTokenResponse,
} from "../types";

export const createServerAuthFetch = (config: AuthConfig) => {
  const fetchWithAccessToken = async (
    url: string,
    accessToken: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    return fetch(`${config.baseUrl}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const refreshTokens = async (refreshToken: string): Promise<Response> => {
    return fetch(`${config.baseUrl}${config.endpoints.refreshApi}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: "include",
    });
  };

  return async <T>(
    url: string,
    options: RequestInit = {},
  ): Promise<DataWithTokensResult<T>> => {
    if (options.headers && "Content-Type" in options.headers) {
      throw new Error("Content-Type must be application/json");
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("web42_access_token")?.value;
    const refreshToken = cookieStore.get("web42_refresh_token")?.value;
    if (!accessToken && !refreshToken) {
      throw new AuthenticationError("No access token and refresh token found");
    }

    let response: Response | undefined;
    if (accessToken) {
      response = await fetchWithAccessToken(url, accessToken, options);
    }

    if (
      (!response || response.status === 401 || response.status === 403) &&
      refreshToken
    ) {
      let tokens: RefreshTokenResponse | undefined;
      try {
        const refreshResponse = await refreshTokens(refreshToken);
        tokens = await handleApiResponse<RefreshTokenResponse>(refreshResponse);
      } catch (error) {
        throw new AuthenticationError("Token refresh failed", {
          cause: error,
        });
      }

      if (tokens) {
        response = await fetchWithAccessToken(url, tokens.accessToken, options);
        return {
          data: await handleApiResponse<T>(response),
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        };
      }
    }

    return {
      data: await handleApiResponse<T>(response!),
    };
  };
};
