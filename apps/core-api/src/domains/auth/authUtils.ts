import type { AuthError as SupabaseAuthErrorType } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// Create auth error with proper typing
export function createAuthError(error: SupabaseAuthErrorType): AuthError {
  return new AuthError(error.message, error.status, error.code);
}
