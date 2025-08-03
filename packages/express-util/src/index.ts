import { createClientAuthFetch } from "./client/createClientAuthFetch";
import { createServerAuthFetch } from "./server/createServerAuthFetch";
import { AuthConfig, DataWithTokensResult } from "./types";

export const createAuthFetch = (config: AuthConfig) => {
  const clientAuthFetch = createClientAuthFetch(config);
  const serverAuthFetch = createServerAuthFetch(config);

  return async <T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<DataWithTokensResult<T>> => {
    // Construct full URL by combining base URL and endpoint
    const url = `${config.baseUrl}${endpoint}`;

    if (typeof window === "undefined") {
      return serverAuthFetch<T>(url, options);
    } else {
      return clientAuthFetch<T>(url, options);
    }
  };
};

// Re-export types
export type { AuthConfig, DataWithTokensResult } from "./types";
