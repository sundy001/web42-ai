import type { ApiError } from "./types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: ApiError["details"],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      message: "An error occurred",
    }));

    throw new ApiRequestError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData.details,
    );
  }

  return response.json();
};
