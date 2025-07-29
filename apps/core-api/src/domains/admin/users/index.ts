// Users Domain - Public API
// Only expose what external consumers need, hide internal implementation

// Main service functions for external consumption
export {
  createUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  getUserBySupabaseId,
  getUserStats,
  listUsers,
  restoreUser,
  updateUser,
  userExists,
} from "./user.service";

// HTTP routes for application setup
export { default } from "./user.routes";

// Export all types under a namespace for external consumers
export type * as UserTypes from "./types";

// Export commonly used types directly for convenience
export type {
  CombinedUser,
  // Service layer types for API consumers
  CreateUserRequest,
  PaginationOptions,
  UpdateUserRequest,
  // Core domain types
  User,
  UserFilters,
  UserListResponse,
  UserRole,
  UserStatus,
  isActiveUser,
  // Utility functions
  isAdmin,
  isDeletedUser,
} from "./types";

// Note: Repository namespace types are kept internal to the domain

// Schema exports for validation and OpenAPI
export {
  CreateUserSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  ObjectIdSchema,
  UpdateUserSchema,
  UserListResponseSchema,
  UserSchema,
  UserStatsSchema,
} from "./user.schemas";

// Note: Repository layer, internal types, and combineUserData are kept private
// External consumers should only interact through the service layer
