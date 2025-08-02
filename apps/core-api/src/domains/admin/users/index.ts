// Users Domain - Public API

// =============================================================================
// SERVICE LAYER - Core business logic
// =============================================================================

/**
 * Main service functions for external consumption
 * These provide the core user management business logic
 */
export {
  createUser,
  deleteUser,
  getUserById,
  getUserBySupabaseId,
  listUsers,
  restoreUser,
  updateUser,
  userExists,
  userExistsByEmail,
} from "./user.service";

// =============================================================================
// PRESENTATION LAYER - HTTP interface
// =============================================================================

/**
 * HTTP routes for application setup
 * Handles incoming user-related HTTP requests
 */
export { userRoutes } from "./user.routes";

// =============================================================================
// TYPE CONTRACTS - External interfaces
// =============================================================================

/**
 * Export commonly used types for external consumers
 * Note: Repository namespace types are kept internal to the domain
 */
export type {
  // Service layer types for API consumers
  CreateUserRequest,
  UpdateUserRequest,
  // Core domain types
  UserFilters,
  UserListResponse,
  UserRole,
  UserStatus,
} from "./types";

export type { User } from "./user.schemas";

/**
 * Schema exports for validation and OpenAPI documentation
 */
export {
  CreateUserSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UserListResponseSchema,
  UserSchema,
} from "./user.schemas";
