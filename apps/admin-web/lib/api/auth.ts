import type { LoginRequest, User } from "@web42-ai/types";
import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { handleApiResponse } from "./errors";

export const loginUser = async (form: LoginRequest): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  return handleApiResponse<User>(response);
};

export const signoutUser = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.signout}`, {
    method: "POST",
    credentials: "include",
  });

  return handleApiResponse<void>(response);
};
