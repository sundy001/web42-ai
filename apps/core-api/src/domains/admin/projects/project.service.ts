import { projectLogger } from "@/config/logger";
import { userExists } from "@/domains/admin/users";
import type { PaginationOptions } from "@/utils/types";
import * as projectStore from "./project.repository";
import type {
  CreateProjectRequest,
  Project,
  ProjectFilters,
  ProjectListResponse,
} from "./types";

// High-level project service that coordinates repository operations

export async function createProject(
  projectData: CreateProjectRequest,
): Promise<Project> {
  try {
    // Check if user exists before creating project
    const userExistsResult = await userExists(projectData.userId);
    if (!userExistsResult) {
      throw new Error("User not found");
    }

    const mongoProject = await projectStore.createProject({
      userId: projectData.userId,
      name: projectData.name,
      activeDeploymentId: projectData.activeDeploymentId,
      versions: projectData.versions,
      status: projectData.status || "active",
    });

    return mongoProject;
  } catch (error) {
    projectLogger.error(
      { err: error, userId: projectData.userId, projectName: projectData.name },
      "Failed to create project",
    );
    throw error;
  }
}

export async function getProjectById(
  id: string,
  includeDeleted = false,
): Promise<Project | null> {
  return projectStore.getProjectById(id, includeDeleted);
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    return projectStore.deleteProject(id);
  } catch (error) {
    projectLogger.error(
      { err: error, projectId: id },
      "Failed to delete project",
    );
    throw error;
  }
}

export async function listProjects(
  filters: ProjectFilters = {},
  pagination: PaginationOptions = {},
): Promise<ProjectListResponse> {
  projectLogger.debug({ filters, pagination }, "Listing projects");
  return projectStore.listProjects(filters, pagination);
}
