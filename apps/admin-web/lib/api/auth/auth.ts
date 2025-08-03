import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { handleApiResponse } from "../errors";
import type { LoginForm, User } from "../types";

export const loginUser = async (form: LoginForm): Promise<User> => {
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
