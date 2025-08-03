import { clientAuthFetch } from "./client/clientAuthFetch";
import { serverAuthFetch } from "./server/serverAuthFetch";
import { DataWithTokensResult } from "./types";

export const authFetch = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<DataWithTokensResult<T>> => {
  if (typeof window === "undefined") {
    return serverAuthFetch<T>(url, options);
  } else {
    return clientAuthFetch<T>(url, options);
  }
};

// Re-export types
export type { DataWithTokensResult } from "./types";
