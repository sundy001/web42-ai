// Auth Domain - Public API

// =============================================================================
// SERVICE LAYER - Core business logic
// =============================================================================

/**
 * Main service functions for external consumption
 * These provide the core auth business logic
 */
export { loginUser, refreshUserToken, signoutUser } from "./auth.service";

// =============================================================================
// PRESENTATION LAYER - HTTP interface
// =============================================================================

/**
 * HTTP routes for application setup
 * Handles incoming auth-related HTTP requests
 */
export { authRoutes } from "./auth.routes";

// =============================================================================
// TYPE CONTRACTS - External interfaces
// =============================================================================

/**
 * Export all types for external consumers
 */
export type { AuthRequest, AuthUser } from "./types";

/**
 * Schema exports for validation and OpenAPI documentation
 */
export {
  ApiRefreshTokenResponseSchema,
  LoginResponseSchema,
  LoginSchema,
  MeResponseSchema,
} from "./auth.schemas";

// =============================================================================
// PROVIDER LAYER - Limited external access
// =============================================================================

/**
 * Provider access for cross-domain usage (limited exposure)
 * Allows other domains to access auth provider when needed
 */
export { getAuthProvider } from "./providers";

// =============================================================================
// MIDDLEWARE - Route protection
// =============================================================================

/**
 * Authentication middleware for route protection
 * Provides reusable auth guards for Express routes
 */
export {
  authenticateUser,
  optionalAuthentication,
  requireAdmin,
} from "./middleware/auth";
