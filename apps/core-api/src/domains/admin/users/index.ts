// Users Domain - Public API

// Main service functions for external consumption
// External consumers should only interact through the service layer
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
// Note: Repository namespace types are kept internal to the domain
export type {
  // Service layer types for API consumers
  CreateUserRequest,
  UpdateUserRequest,
  // Core domain types
  User,
  UserFilters,
  UserListResponse,
  UserRole,
  UserStatus,
} from "./types";

// Schema exports for validation and OpenAPI
export {
  CreateUserSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UserListResponseSchema,
  UserSchema,
} from "./user.schemas";
