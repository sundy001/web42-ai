import type { ObjectId } from "mongodb";

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

/**
 * Project version information
 */
export interface ProjectVersion {
  versionId: string;
  planId: ObjectId;
  r2Path_artifacts: string;
  triggeringMessageId: ObjectId;
}

/**
 * Project entity as stored in MongoDB
 */
export interface MongoProject {
  _id: ObjectId;
  userId: string;
  name: string;
  activeDeploymentId: string | null;
  versions: ProjectVersion[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project status enum
 */
export type ProjectStatus = "active" | "deleted";

// =============================================================================
// REPOSITORY LAYER TYPES
// =============================================================================

/**
 * Data required to create a new project
 */
export interface CreateProjectData {
  userId: string;
  name: string;
}
