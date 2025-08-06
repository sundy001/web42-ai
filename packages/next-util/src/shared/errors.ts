export class AuthenticationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AuthenticationError";
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiRequestError";
  }
}

const throwApiError = async (response: Response): Promise<never> => {
  const errorData: { message?: string; details?: Record<string, unknown> } =
    await response.json().catch(() => ({
      message: "Failed to parse error response as JSON",
    }));

  // Throw AuthenticationError for auth-related status codes
  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError(
      errorData.message || `Authentication failed: ${response.status}`,
    );
  }

  throw new ApiRequestError(
    errorData.message || `HTTP error! status: ${response.status}`,
    response.status,
    errorData.details,
  );
};

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    await throwApiError(response);
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
