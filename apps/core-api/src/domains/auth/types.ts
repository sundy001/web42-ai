import type { User } from "@/domains/admin/users";
import type { NextFunction, Request, Response } from "express";

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
  status?: number;
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
  user: User;
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

/**
 * Input for creating a user in the auth provider
 */
export interface CreateAuthUserInput {
  email: string;
  password?: string;
  name: string;
  role: string;
  emailConfirm?: boolean;
}

/**
 * Input for updating a user in the auth provider
 */
export interface UpdateAuthUserInput {
  email?: string;
  password?: string;
  userMetadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
}

/**
 * Response from auth provider sign-in operations
 */
export interface AuthProviderSignInResponse {
  user: AuthUser;
  session: unknown; // Provider-specific session format
}

/**
 * Abstract interface that all auth providers must implement
 */
export interface AuthProvider {
  // User management operations
  createUser(input: CreateAuthUserInput): Promise<AuthUser>;
  getUserById(id: string): Promise<AuthUser>;
  updateUser(id: string, input: UpdateAuthUserInput): Promise<AuthUser>;
  deleteUser(id: string, softDelete?: boolean): Promise<AuthUser>;

  // Authentication operations
  signInWithPassword(
    email: string,
    password: string,
  ): Promise<AuthProviderSignInResponse>;
  signOut(): Promise<void>;
}

// =============================================================================
// MIDDLEWARE CONTRACTS
// =============================================================================

/**
 * Middleware layer types - for Express.js request handling
 */

/**
 * Authenticated user data attached to request
 */
export interface AuthenticatedUserData {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Express request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserData;
}

/**
 * Type for authentication middleware functions
 */
export type AuthMiddlewareFunction = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * Type for authorization middleware functions
 */
export type AuthorizationMiddlewareFunction = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => void;
