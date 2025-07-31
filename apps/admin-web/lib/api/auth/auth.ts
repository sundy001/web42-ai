import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { handleApiResponse } from "../errors";
import type { LoginForm, LoginResponse } from "../types";

export const loginUser = async (form: LoginForm): Promise<LoginResponse> => {
  console.log("API_BASE_URL", API_BASE_URL);
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  return handleApiResponse<LoginResponse>(response);
};
