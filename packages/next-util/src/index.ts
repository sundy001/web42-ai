import { createClientAuthFetch } from "./client/createClientAuthFetch";
import { createServerAuthFetch } from "./server/createServerAuthFetch";
import { AuthConfig } from "./types";

export const createAuthFetch = (config: AuthConfig) => {
  if (typeof window === "undefined") {
    return createServerAuthFetch(config);
  } else {
    return createClientAuthFetch(config);
  }
};

// Re-export types
export type { AuthConfig, DataWithTokensResult } from "./types";
