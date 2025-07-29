import type { AuthError as AuthErrorType } from "./types";

// Create proper AuthError class for distinct error type checking
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// Create auth error with proper typing
export function createAuthError(message: string, code?: string): AuthErrorType {
  return new AuthError(message, code);
}

// Higher-order function to handle common error wrapping pattern
export function withErrorHandling<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // If it's already an AuthError, just re-throw it to avoid double prefixing
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof Error) {
        throw createAuthError(`${operation}: ${error.message}`);
      }
      throw createAuthError(`${operation}: Unknown error`);
    }
  };
}
