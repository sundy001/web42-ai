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

  // Handle empty response bodies (e.g., for DELETE requests or 204 No Content)
  const contentType = response.headers.get("content-type");
  const contentLength = response.headers.get("content-length");

  // Check if response is empty
  if (
    response.status === 204 || // No Content
    contentLength === "0" ||
    !contentType
  ) {
    return undefined as T;
  }

  // Try to parse JSON, handle empty body gracefully
  return response.json();
};
