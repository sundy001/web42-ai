import {
  deleteRequest,
  expectError,
  expectSuccess,
  expectValidationError,
  getRequest,
  postRequest,
} from "@/testUtils/apiTestHelpers";
import type { Application } from "express";
import express from "express";
import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockCreateProjectRequest,
  createMockProject,
  createMockProjectListResponse,
} from "./projectTestFixtures";
import {
  BAD_REQUEST_ERROR,
  INVALID_ID_FORMAT,
  setupMiddlewareMocks,
  setupProjectServiceMocks,
} from "./projectTestMocks";

// Setup mocks
setupMiddlewareMocks();
setupProjectServiceMocks();

import projectRoutes from "../project.routes";
import * as projectService from "../project.service";

// Type the mocked modules
const mockProjectService = vi.mocked(projectService);

// Helper function to expect project structure
function expectProjectStructure(project: any) {
  expect(project).toHaveProperty("_id");
  expect(project).toHaveProperty("userId");
  expect(project).toHaveProperty("name");
  expect(project).toHaveProperty("activeDeploymentId");
  expect(project).toHaveProperty("versions");
  expect(project).toHaveProperty("status");
  expect(project).toHaveProperty("createdAt");
  expect(project).toHaveProperty("updatedAt");
  expect(Array.isArray(project.versions)).toBe(true);
  if (project.versions.length > 0) {
    const version = project.versions[0];
    expect(version).toHaveProperty("versionId");
    expect(version).toHaveProperty("planId");
    expect(version).toHaveProperty("r2Path_artifacts");
    expect(version).toHaveProperty("triggeringMessageId");
  }
}

// Helper function to expect paginated response structure
function expectPaginatedResponse(response: any, page = 1, limit = 10) {
  const body = expectSuccess(response);
  expect(body).toHaveProperty("projects");
  expect(body).toHaveProperty("total");
  expect(body).toHaveProperty("page", page);
  expect(body).toHaveProperty("limit", limit);
  expect(body).toHaveProperty("totalPages");
  expect(Array.isArray(body.projects)).toBe(true);
}

describe("Project Routes Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create fresh app instance
    app = express();
    app.use(express.json());
    app.use("/projects", projectRoutes);
  });

  describe("GET /projects", () => {
    it("should list projects with default pagination", async () => {
      const mockProjects = [
        createMockProject(),
        createMockProject({ name: "Another Project" }),
      ];
      const mockResponse = createMockProjectListResponse(mockProjects, {
        total: 2,
        totalPages: 1,
      });

      mockProjectService.listProjects.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/projects");

      expectPaginatedResponse(response, 1, 10);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith({}, {});

      const body = response.body;
      expect(body.projects).toHaveLength(2);
      body.projects.forEach(expectProjectStructure);
    });

    it("should list projects with custom pagination", async () => {
      const mockProjects = [createMockProject()];
      const mockResponse = createMockProjectListResponse(mockProjects, {
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      });

      mockProjectService.listProjects.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/projects?page=2&limit=5");

      expectPaginatedResponse(response, 2, 5);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        {},
        { page: 2, limit: 5 },
      );
    });

    it("should filter projects by userId", async () => {
      const userId = "688769de279a0fafe82bec23";
      const mockProjects = [createMockProject({ userId })];
      const mockResponse = createMockProjectListResponse(mockProjects);

      mockProjectService.listProjects.mockResolvedValue(mockResponse);

      const response = await getRequest(app, `/projects?userId=${userId}`);

      expectPaginatedResponse(response, 1, 10);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        { userId },
        {},
      );
    });

    it("should filter projects by name", async () => {
      const projectName = "Test Project";
      const mockProjects = [createMockProject({ name: projectName })];
      const mockResponse = createMockProjectListResponse(mockProjects);

      mockProjectService.listProjects.mockResolvedValue(mockResponse);

      const response = await getRequest(
        app,
        `/projects?name=${encodeURIComponent(projectName)}`,
      );

      expectPaginatedResponse(response, 1, 10);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        { name: projectName },
        {},
      );
    });

    it("should filter projects by status", async () => {
      const mockProjects = [createMockProject({ status: "active" })];
      const mockResponse = createMockProjectListResponse(mockProjects);

      mockProjectService.listProjects.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/projects?status=active");

      expectPaginatedResponse(response, 1, 10);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        { status: "active" },
        {},
      );
    });

    it("should include deleted projects when requested", async () => {
      const mockProjects = [createMockProject({ status: "deleted" })];
      const mockResponse = createMockProjectListResponse(mockProjects);

      mockProjectService.listProjects.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/projects?includeDeleted=true");

      expectPaginatedResponse(response, 1, 10);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        { includeDeleted: true },
        {},
      );
    });

    it("should handle multiple filters simultaneously", async () => {
      const userId = "688769de279a0fafe82bec23";
      const mockProjects = [
        createMockProject({ userId, status: "active", name: "Active Project" }),
      ];
      const mockResponse = createMockProjectListResponse(mockProjects);

      mockProjectService.listProjects.mockResolvedValue(mockResponse);

      const response = await getRequest(
        app,
        `/projects?userId=${userId}&status=active&page=1&limit=5`,
      );

      expectPaginatedResponse(response, 1, 5);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        { userId, status: "active" },
        { page: 1, limit: 5 },
      );
    });
  });

  describe("GET /projects/:id", () => {
    it("should get project by valid ID", async () => {
      const mockProject = createMockProject();
      const projectId = mockProject._id!.toString();

      mockProjectService.getProjectById.mockResolvedValue(mockProject);

      const response = await getRequest(app, `/projects/${projectId}`);

      const body = expectSuccess(response);
      expectProjectStructure(body);
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(projectId);
    });

    it("should return 404 for non-existent project", async () => {
      const projectId = new ObjectId().toString();
      mockProjectService.getProjectById.mockResolvedValue(null);

      const response = await getRequest(app, `/projects/${projectId}`);

      expectError(response, 404, "Not found", "Project not found");
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(projectId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await getRequest(app, "/projects/invalid-id");

      expectError(response, 400, BAD_REQUEST_ERROR, INVALID_ID_FORMAT);
    });
  });

  describe("POST /projects", () => {
    it("should create new project successfully", async () => {
      const createProjectData = createMockCreateProjectRequest();
      const mockCreatedProject = createMockProject({
        userId: createProjectData.userId,
        name: createProjectData.name,
        activeDeploymentId: createProjectData.activeDeploymentId,
        versions: createProjectData.versions,
        status: createProjectData.status,
      });

      mockProjectService.createProject.mockResolvedValue(mockCreatedProject);

      const response = await postRequest(app, "/projects", createProjectData);

      const body = expectSuccess(response, 201);
      expectProjectStructure(body);
      expect(body.userId).toBe(createProjectData.userId);
      expect(body.name).toBe(createProjectData.name);
      expect(body.activeDeploymentId).toBe(
        createProjectData.activeDeploymentId,
      );
      expect(body.status).toBe(createProjectData.status);

      expect(mockProjectService.createProject).toHaveBeenCalledWith(
        createProjectData,
      );
    });

    it("should create project with default status when not provided", async () => {
      const { status, ...createProjectDataWithoutStatus } =
        createMockCreateProjectRequest();
      const mockCreatedProject = createMockProject({
        ...createProjectDataWithoutStatus,
        status: "active", // Default status
      });

      mockProjectService.createProject.mockResolvedValue(mockCreatedProject);

      const response = await postRequest(
        app,
        "/projects",
        createProjectDataWithoutStatus,
      );

      const body = expectSuccess(response, 201);
      expect(body.status).toBe("active");
    });

    it("should return validation error for missing required fields", async () => {
      const invalidData = {
        // Missing userId, name, activeDeploymentId, versions
      };

      const response = await postRequest(app, "/projects", invalidData);

      expectValidationError(response, [
        "userId",
        "name",
        "activeDeploymentId",
        "versions",
      ]);
    });

    it("should return validation error for empty project name", async () => {
      const invalidData = createMockCreateProjectRequest({ name: "" });

      const response = await postRequest(app, "/projects", invalidData);

      expectValidationError(response, ["name"]);
    });

    it("should return validation error for invalid versions", async () => {
      const invalidData = {
        ...createMockCreateProjectRequest(),
        versions: "not-an-array",
      };

      const response = await postRequest(app, "/projects", invalidData);

      expectValidationError(response, ["versions"]);
    });

    it("should return validation error for invalid status", async () => {
      const invalidData = {
        ...createMockCreateProjectRequest(),
        status: "invalid-status",
      };

      const response = await postRequest(app, "/projects", invalidData);

      expectValidationError(response, ["status"]);
    });
  });

  describe("DELETE /projects/:id", () => {
    it("should soft delete project successfully", async () => {
      const projectId = new ObjectId().toString();

      mockProjectService.deleteProject.mockResolvedValue(true);

      const response = await deleteRequest(app, `/projects/${projectId}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith(projectId);
    });

    it("should return 404 for non-existent project", async () => {
      const projectId = new ObjectId().toString();

      mockProjectService.deleteProject.mockResolvedValue(false);

      const response = await deleteRequest(app, `/projects/${projectId}`);

      expectError(response, 404, "Not found", "Project not found");
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith(projectId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await deleteRequest(app, "/projects/invalid-id");

      expectError(response, 400, BAD_REQUEST_ERROR, INVALID_ID_FORMAT);
    });
  });

  describe("Error handling", () => {
    it("should handle service layer errors gracefully", async () => {
      mockProjectService.listProjects.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await getRequest(app, "/projects");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty(
        "message",
        "Database connection failed",
      );
    });

    it("should handle project creation errors", async () => {
      const createProjectData = createMockCreateProjectRequest();

      mockProjectService.createProject.mockRejectedValue(
        new Error("Failed to create project"),
      );

      const response = await postRequest(app, "/projects", createProjectData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty(
        "message",
        "Failed to create project",
      );
    });

    it("should handle project retrieval errors", async () => {
      const projectId = new ObjectId().toString();

      mockProjectService.getProjectById.mockRejectedValue(
        new Error("Database query failed"),
      );

      const response = await getRequest(app, `/projects/${projectId}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty("message", "Database query failed");
    });

    it("should handle project deletion errors", async () => {
      const projectId = new ObjectId().toString();

      mockProjectService.deleteProject.mockRejectedValue(
        new Error("Failed to delete project"),
      );

      const response = await deleteRequest(app, `/projects/${projectId}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty(
        "message",
        "Failed to delete project",
      );
    });
  });
});
