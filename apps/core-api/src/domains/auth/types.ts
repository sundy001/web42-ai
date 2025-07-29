import type { NextFunction, Request, Response } from "express";
import type { CombinedUser } from "../users";

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

/**
 * Auth user representation from the auth provider (e.g., Supabase)
 * This is the raw user data from the authentication service
 */
export interface AuthUser {
  id: string;
  email: string | null;
  name?: string;
  avatarUrl?: string;
  authProvider?: string;
  lastSignInAt?: string | null;
  emailConfirmedAt?: string | null;
  phoneConfirmedAt?: string | null;
  phone?: string | null;
  userMetadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
}

/**
 * Authentication session data
 */
export interface AuthSession {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

// =============================================================================
// DOMAIN VALUE OBJECTS
// =============================================================================

/**
 * Authentication error with optional error code
 */
export interface AuthError extends Error {
  code?: string;
}

// =============================================================================
// SERVICE LAYER CONTRACTS
// =============================================================================

/**
 * Request to login a user (service layer)
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response from login operation (service layer)
 */
export interface LoginResponse {
  user: CombinedUser;
  session: AuthSession;
}

/**
 * Request to sign out a user (service layer)
 */
export interface SignoutRequest {
  access_token: string;
}

/**
 * Response from signout operation (service layer)
 */
export interface SignoutResponse {
  message: string;
}

// =============================================================================
// PROVIDER LAYER CONTRACTS
// =============================================================================

/**
 * Provider layer types - internal to the auth domain
 * These types define the contract for authentication providers (Supabase, Auth0, etc.)
 */
export namespace Provider {
  /**
   * Input for creating a user in the auth provider
   */
  export interface CreateUserInput {
    email: string;
    password?: string;
    name?: string;
    role?: string;
    emailConfirm?: boolean;
  }

  /**
   * Input for updating a user in the auth provider
   */
  export interface UpdateUserInput {
    email?: string;
    password?: string;
    userMetadata?: Record<string, unknown>;
    appMetadata?: Record<string, unknown>;
  }

  /**
   * Response from auth provider sign-in operations
   */
  export interface SignInResponse {
    user: AuthUser;
    session: unknown; // Provider-specific session format
  }

  /**
   * Abstract interface that all auth providers must implement
   */
  export interface AuthProvider {
    // User management operations
    createUser(input: CreateUserInput): Promise<AuthUser>;
    getUserById(id: string): Promise<AuthUser | null>;
    updateUser(id: string, input: UpdateUserInput): Promise<AuthUser>;
    deleteUser(id: string): Promise<void>;

    // Authentication operations
    signInWithPassword(
      email: string,
      password: string,
    ): Promise<SignInResponse>;
    signOut(): Promise<void>;
  }
}

// =============================================================================
// MIDDLEWARE CONTRACTS
// =============================================================================

/**
 * Middleware layer types - for Express.js request handling
 */
export namespace Middleware {
  /**
   * Authenticated user data attached to request
   */
  export interface AuthenticatedUser {
    id: string;
    email?: string;
    role?: string;
  }

  /**
   * Express request with authenticated user data
   */
  export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
  }

  /**
   * Type for authentication middleware functions
   */
  export type AuthMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;

  /**
   * Type for authorization middleware functions
   */
  export type AuthorizationMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => void;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if an error is an authentication error
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof Error && "code" in error;
}

/**
 * Type guard to check if a request is authenticated
 */
export function isAuthenticatedRequest(
  req: Request,
): req is Middleware.AuthenticatedRequest {
  return "user" in req && req.user !== undefined;
}

/**
 * Type guard to check if user has admin role
 */
export function isAdminUser(user: Middleware.AuthenticatedUser): boolean {
  return user.role === "admin";
}

/**
 * Utility to extract user ID from authenticated request
 */
export function getUserId(req: Middleware.AuthenticatedRequest): string | null {
  return req.user?.id ?? null;
}

// =============================================================================
// TYPE ALIASES FOR BACKWARDS COMPATIBILITY
// =============================================================================

// Create type aliases for cleaner imports and backwards compatibility
export type CreateAuthUserInput = Provider.CreateUserInput;
export type UpdateAuthUserInput = Provider.UpdateUserInput;
export type AuthProvider = Provider.AuthProvider;
export type AuthenticatedRequest = Middleware.AuthenticatedRequest;
