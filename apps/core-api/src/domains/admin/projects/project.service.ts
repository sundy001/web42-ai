import * as projectStore from "./project.repository";
import type {
  CreateProjectRequest,
  PaginationOptions,
  Project,
  ProjectFilters,
  ProjectListResponse,
} from "./types";

// High-level project service that coordinates repository operations

export async function createProject(
  projectData: CreateProjectRequest,
): Promise<Project> {
  try {
    const mongoProject = await projectStore.createProject({
      userId: projectData.userId,
      name: projectData.name,
      activeDeploymentId: projectData.activeDeploymentId,
      versions: projectData.versions,
      status: projectData.status || "active",
    });

    return mongoProject;
  } catch (error) {
    console.error("Error creating project:", error);
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
    console.error("Error deleting project:", error);
    throw error;
  }
}

export async function listProjects(
  filters: ProjectFilters = {},
  pagination: PaginationOptions = {},
): Promise<ProjectListResponse> {
  return projectStore.listProjects(filters, pagination);
}
