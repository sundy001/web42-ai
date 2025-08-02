import type { User } from "@/domains/admin/users";
import type { Request } from "express";

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
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
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
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Response from login operation (service layer)
 */
export interface LoginResponse {
  user: User;
}

/**
 * Response from signout operation (service layer)
 */
export interface SignoutResponse {
  message: string;
}

/**
 * Response from /me endpoint - current user info from JWT
 */
export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  is_anonymous: boolean;
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
  refreshSession(refreshToken: string): Promise<{
    data: { session: unknown } | null;
    error: Error | null;
  }>;
}

// =============================================================================
// EXPRESS REQUEST EXTENSIONS
// =============================================================================

/**
 * Express request with authenticated user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    is_anonymous: boolean;
  };
}
