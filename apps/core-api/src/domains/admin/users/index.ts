// Users Domain - Public API
// Only expose what external consumers need, hide internal implementation

// Main service functions for external consumption
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

// HTTP routes for application setup
export { userRoutes } from "./user.routes";

// Export commonly used types directly for convenience
export type {
  // Service layer types for API consumers
  CreateUserRequest,
  // Core domain types
  PaginationOptions,
  UpdateUserRequest,
  User,
  UserFilters,
  UserListResponse,
  UserRole,
  UserStatus,
} from "./types";

// Note: Repository namespace types are kept internal to the domain

// Schema exports for validation and OpenAPI
export {
  CreateUserSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UserListResponseSchema,
  UserSchema,
} from "./user.schemas";

// Note: Repository layer, internal types, and combineUserData are kept private
// External consumers should only interact through the service layer
