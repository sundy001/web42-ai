import type { LoginRequest } from "@web42-ai/types/auth";
import type { User } from "@web42-ai/types/users";
import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { handleApiResponse } from "../errors";

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
