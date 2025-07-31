import type { AuthError as SupabaseAuthErrorType } from "@supabase/supabase-js";
import type { AuthError as AuthErrorType } from "./types";

// Create proper AuthError class for distinct error type checking
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
export function createAuthError(error: SupabaseAuthErrorType): AuthErrorType {
  return new AuthError(error.message, error.status, error.code);
}
