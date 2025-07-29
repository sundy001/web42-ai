// Auth Domain - Public API
// Only expose what external consumers need, hide internal implementation

// Main service functions for external consumption
export { loginUser, signoutUser } from "./auth.service";

// HTTP routes for application setup
export { default as authRoutes } from "./auth.routes";

// Export all types under a namespace for external consumers
export type * as AuthTypes from "./types";

// Export commonly used types directly for convenience
export type {
  AuthError,

  // Provider types (for extensions)
  AuthProvider,
  AuthSession,
  // Core domain types
  AuthUser,
  // Middleware types
  AuthenticatedRequest,
  CreateAuthUserInput,
  // Service layer types
  LoginRequest,
  LoginResponse,
  SignoutRequest,
  SignoutResponse,
  UpdateAuthUserInput,
  getUserId,
  isAdminUser,
  // Utility functions
  isAuthError,
  isAuthenticatedRequest,
} from "./types";

// Note: Provider and Middleware namespace types are kept internal to the domain

// Schema exports for validation and OpenAPI
export {
  LoginResponseSchema,
  LoginSchema,
  SignoutResponseSchema,
  SignoutSchema,
} from "./auth.schemas";

// Provider access for cross-domain usage (limited exposure)
export { getAuthProvider } from "./providers";

// Supabase client for middleware usage (minimal exposure)
export { supabaseClient } from "./providers/supabase";

// Authentication middleware for route protection
export {
  authenticateUser,
  optionalAuthentication,
  requireAdmin,
} from "./middleware/auth";

// Note: Provider implementations, internal auth logic, and provider-specific
// details are kept private. External consumers should use the service layer.
