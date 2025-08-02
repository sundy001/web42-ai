import type { PaginatedResponse } from "@/utils/types";
import type { ObjectId } from "mongodb";

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

/**
 * MongoDB User document - Core domain entity
 * Note: _id is required by default as most operations work with existing documents
 * For creation, use WithoutId<MongoUser>
 */
export interface MongoUser {
  _id: ObjectId;
  supabaseUserId: string;
  email: string; // Duplicated for performance
  name: string; // Duplicated for performance
  role: UserRole; // Duplicated for performance
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Combined user data (MongoDB + Auth Provider)
 * This represents the complete user view for external consumers
 */
export interface User extends MongoUser {
  // Auth provider fields
  avatarUrl?: string;
  authProvider?: string;
  lastSignInAt?: string;
  emailConfirmedAt?: string;
  phoneConfirmedAt?: string;
  phone?: string;
  userMetadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
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
export type UserListResponse = PaginatedResponse<User>;

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
export interface CreateUserData {
  supabaseUserId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Data structure for updating user in database
 */
export interface UpdateUserData {
  role?: UserRole;
  status?: UserStatus;
}

/**
 * Database-level filters for user queries
 */
export interface UserFiltersDb {
  supabaseUserId?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  includeDeleted?: boolean;
}

/**
 * Database-level pagination options
 */
export interface PaginationOptionsDb {
  page?: number;
  limit?: number;
}

/**
 * Database-level paginated response (returns raw User entities)
 */
export type UserListResponseDb = PaginatedResponse<MongoUser>;
