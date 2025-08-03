import { authFetch } from "../auth-client";
import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { AuthenticationError, handleApiResponse } from "../errors";
import type { LoginForm, LoginResponse, MeResponse } from "../types";

export const loginUser = async (form: LoginForm): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  return handleApiResponse<LoginResponse>(response);
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
): Promise<MeResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.me}`, {
    credentials: "include",
  });

  return handleApiResponse<MeResponse>(response);
};
