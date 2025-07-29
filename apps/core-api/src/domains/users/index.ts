// Users Domain - Public API
// Only expose what external consumers need, hide internal implementation

// Main service functions for external consumption
export {
  createUser,
  getUserById,
  getUserByEmail,
  getUserBySupabaseId,
  updateUser,
  deleteUser,
  restoreUser,
  listUsers,
  syncUserWithAuthProvider,
  getUserStats,
  userExists,
} from "./user.service";

// HTTP routes for application setup
export { default as userRoutes } from "./user.routes";

// Public types that external consumers need
export type {
  // Core domain types
  User,
  CombinedUser,
  
  // Service layer types for API consumers
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  PaginationOptions,
  UserListResponse,
} from "./user.types";

// Schema exports for validation and OpenAPI
export {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
  UserListResponseSchema,
  UserStatsSchema,
  ObjectIdSchema,
  ErrorResponseSchema,
} from "./user.schemas";

// Note: Repository layer, internal types, and combineUserData are kept private
// External consumers should only interact through the service layer