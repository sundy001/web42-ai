import type { ObjectId } from "mongodb";

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

/**
 * Project version information
 */
export interface ProjectVersion {
  versionId: string;
  planId: string;
  r2Path_artifacts: string;
  triggeringMessageId: string;
}

/**
 * MongoDB Project document - Core domain entity
 */
export interface Project {
  _id?: ObjectId;
  userId: string;
  name: string;
  activeDeploymentId: string;
  versions: ProjectVersion[];
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// DOMAIN VALUE OBJECTS
// =============================================================================

export type ProjectStatus = "active" | "deleted";

// =============================================================================
// SERVICE LAYER CONTRACTS
// =============================================================================

/**
 * Request to create a new project (service layer)
 */
export interface CreateProjectRequest {
  userId: string;
  name: string;
  activeDeploymentId: string;
  versions: ProjectVersion[];
  status?: ProjectStatus;
}

/**
 * Filters for querying projects (service layer)
 */
export interface ProjectFilters {
  userId?: string;
  name?: string;
  status?: ProjectStatus;
  includeDeleted?: boolean;
}

/**
 * Paginated list response for projects (service layer)
 */
export type ProjectListResponse = PaginatedResponse<Project>;

// =============================================================================
// REPOSITORY LAYER CONTRACTS
// =============================================================================

/**
 * Repository layer types - internal to the domain
 * These types are specific to database operations and should not leak outside the domain
 */

/**
 * Data structure for creating project in database
 */
export interface ProjectRepositoryCreateData {
  userId: string;
  name: string;
  activeDeploymentId: string;
  versions: ProjectVersion[];
  status: ProjectStatus;
}

/**
 * Database-level filters for project queries
 */
export interface ProjectRepositoryFilters {
  userId?: string;
  name?: string;
  status?: ProjectStatus;
  includeDeleted?: boolean;
}

/**
 * Database-level pagination options
 */
export interface ProjectRepositoryPaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Database-level paginated response (returns raw Project entities)
 */
export type ProjectRepositoryListResponse = PaginatedResponse<Project>;

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
  projects: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if a project is active
 */
export function isActiveProject(project: Pick<Project, "status">): boolean {
  return project.status === "active";
}

/**
 * Type guard to check if a project is deleted
 */
export function isDeletedProject(project: Pick<Project, "status">): boolean {
  return project.status === "deleted";
}
