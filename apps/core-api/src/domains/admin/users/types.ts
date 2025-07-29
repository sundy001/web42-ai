import type { ObjectId } from "mongodb";

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

/**
 * MongoDB User document - Core domain entity
 */
export interface User {
  _id?: ObjectId;
  supabaseUserId: string;
  email: string; // Duplicated for performance
  role: UserRole; // Duplicated for performance
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Combined user data (MongoDB + Auth Provider)
 * This represents the complete user view for external consumers
 */
export interface CombinedUser extends User {
  // Auth provider fields
  name?: string;
  avatarUrl?: string;
  authProvider?: string;
  lastSignInAt?: string;
  emailConfirmedAt?: string;
  phoneConfirmedAt?: string;
  phone?: string;
}

// =============================================================================
// DOMAIN VALUE OBJECTS
// =============================================================================

export type UserRole = "admin" | "user";
export type UserStatus = "active" | "inactive" | "deleted";

// =============================================================================
// SERVICE LAYER CONTRACTS
// =============================================================================

/**
 * Request to create a new user (service layer)
 */
export interface CreateUserRequest {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
}

/**
 * Request to update user data (service layer)
 */
export interface UpdateUserRequest {
  role?: UserRole;
  status?: Exclude<UserStatus, "deleted">; // Can't directly set to deleted - use deleteUser instead
}

/**
 * Filters for querying users (service layer)
 */
export interface UserFilters {
  supabaseUserId?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  includeDeleted?: boolean;
}

/**
 * Paginated list response for users (service layer)
 */
export type UserListResponse = PaginatedResponse<CombinedUser>;

// =============================================================================
// REPOSITORY LAYER CONTRACTS
// =============================================================================

/**
 * Repository layer types - internal to the domain
 * These types are specific to database operations and should not leak outside the domain
 */

/**
 * Data structure for creating user in database
 */
export interface UserRepositoryCreateData {
  supabaseUserId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Data structure for updating user in database
 */
export interface UserRepositoryUpdateData {
  role?: UserRole;
  status?: UserStatus;
}

/**
 * Database-level filters for user queries
 */
export interface UserRepositoryFilters {
  supabaseUserId?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  includeDeleted?: boolean;
}

/**
 * Database-level pagination options
 */
export interface UserRepositoryPaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Database-level paginated response (returns raw User entities)
 */
export type UserRepositoryListResponse = PaginatedResponse<User>;

// =============================================================================
// SHARED UTILITIES
// =============================================================================

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Generic paginated response structure
 */
export interface PaginatedResponse<T> {
  users: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if a user has admin privileges
 */
export function isAdmin(user: Pick<User, "role">): boolean {
  return user.role === "admin";
}

/**
 * Type guard to check if a user is active
 */
export function isActiveUser(user: Pick<User, "status">): boolean {
  return user.status === "active";
}

/**
 * Type guard to check if a user is deleted
 */
export function isDeletedUser(user: Pick<User, "status">): boolean {
  return user.status === "deleted";
}
