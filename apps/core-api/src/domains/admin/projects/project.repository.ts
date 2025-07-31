import { dbLogger } from "@/config/logger";
import { databaseStore } from "@/stores/database";
import { ObjectId } from "mongodb";
import type {
  Project,
  ProjectRepositoryCreateData,
  ProjectRepositoryFilters,
  ProjectRepositoryListResponse,
  ProjectRepositoryPaginationOptions,
} from "./types";

// Type aliases for cleaner code
type CreateProjectData = ProjectRepositoryCreateData;
type ProjectFiltersDb = ProjectRepositoryFilters;
type PaginationOptionsDb = ProjectRepositoryPaginationOptions;
type ProjectListResponseDb = ProjectRepositoryListResponse;

const COLLECTION_NAME = "projects";

function getCollection() {
  const db = databaseStore.getDatabase();
  return db.collection<Project>(COLLECTION_NAME);
}

// Database-only operations

export async function createProject(
  projectData: CreateProjectData,
): Promise<Project> {
  const collection = getCollection();
  const now = new Date().toISOString();

  const mongoProject: Omit<Project, "_id"> = {
    userId: projectData.userId,
    name: projectData.name,
    activeDeploymentId: projectData.activeDeploymentId,
    versions: projectData.versions,
    status: projectData.status,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await collection.insertOne(mongoProject);

    return {
      _id: result.insertedId,
      ...mongoProject,
    };
  } catch (error) {
    dbLogger.error({ err: error, projectData }, "Failed to create project");
    throw error;
  }
}

export async function getProjectById(
  id: string,
  includeDeleted = false,
): Promise<Project | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const filter: Record<string, unknown> = { _id: new ObjectId(id) };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return collection.findOne(filter);
}

export async function deleteProject(id: string): Promise<boolean> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await collection.updateOne(
    {
      _id: new ObjectId(id),
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "deleted" as const,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return result.modifiedCount > 0;
}

export async function listProjects(
  filters: ProjectFiltersDb = {},
  pagination: PaginationOptionsDb = {},
): Promise<ProjectListResponseDb> {
  const collection = getCollection();
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  // Build filter query
  const query: Record<string, unknown> = {};

  if (filters.userId) {
    query.userId = filters.userId;
  }
  if (filters.name) {
    query.name = { $regex: filters.name, $options: "i" };
  }
  if (filters.status) {
    query.status = filters.status;
  }

  // Include deleted projects only if explicitly requested
  if (!filters.includeDeleted) {
    query.status = query.status
      ? { $in: [query.status, "active"] }
      : { $ne: "deleted" };
  }

  // Get total count and projects in parallel
  const [total, projects] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  return {
    items: projects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Re-export repository types for external use (if needed)
export type {
  CreateProjectData,
  PaginationOptionsDb,
  ProjectFiltersDb,
  ProjectListResponseDb,
};
