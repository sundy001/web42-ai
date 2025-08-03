export const getApiBaseUrl = (): string => {
  // Check for Next.js environment variable first
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // Fallback to generic environment variable
  if (typeof process !== "undefined" && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  // Default fallback
  return "http://localhost:3002";
};

// Only auth endpoints needed for the express-util functionality
export const AUTH_ENDPOINTS = {
  refresh: "/api/v1/auth/refresh",
  refreshApi: "/api/v1/auth/refresh/api",
} as const;
