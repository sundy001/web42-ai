import { ObjectId } from "mongodb";
import type {
  CreateProjectRequest,
  PaginationOptions,
  Project,
  ProjectFilters,
  ProjectListResponse,
  ProjectVersion,
} from "../types";

// Test constants
export const MOCK_USER_ID = "688769de279a0fafe82bec23";
export const MOCK_TIMESTAMP = "2024-01-26T12:00:00.000Z";
export const MOCK_PROJECT_NAME = "My Math Test App";
export const MOCK_VERSION_ID = "version1";
export const MOCK_PLAN_ID = "plan_abc";

// Mock data factory functions
export const createMockProjectVersion = (
  overrides: Partial<ProjectVersion> = {},
): ProjectVersion => ({
  versionId: MOCK_VERSION_ID,
  planId: MOCK_PLAN_ID,
  r2Path_artifacts: "/builds/version1/",
  triggeringMessageId: "msg_01",
  ...overrides,
});

export const createMockProject = (
  overrides: Partial<Project> = {},
): Project => ({
  _id: new ObjectId(),
  userId: MOCK_USER_ID,
  name: MOCK_PROJECT_NAME,
  activeDeploymentId: MOCK_VERSION_ID,
  versions: [createMockProjectVersion()],
  status: "active",
  createdAt: MOCK_TIMESTAMP,
  updatedAt: MOCK_TIMESTAMP,
  ...overrides,
});

// Mock request data factories
export const createMockCreateProjectRequest = (
  overrides: Partial<CreateProjectRequest> = {},
): CreateProjectRequest => ({
  userId: MOCK_USER_ID,
  name: "New Test Project",
  activeDeploymentId: MOCK_VERSION_ID,
  versions: [createMockProjectVersion()],
  status: "active",
  ...overrides,
});

// Mock response data factories
export const createMockProjectListResponse = (
  projects: Project[],
  overrides: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  } = {},
): ProjectListResponse => ({
  projects,
  total: overrides.total ?? projects.length,
  page: overrides.page ?? 1,
  limit: overrides.limit ?? 10,
  totalPages: overrides.totalPages ?? Math.ceil(projects.length / 10),
});

// Filter and pagination test helpers
export const createMockProjectFilters = (
  overrides: Partial<ProjectFilters> = {},
): ProjectFilters => ({
  userId: undefined,
  name: undefined,
  status: undefined,
  includeDeleted: undefined,
  ...overrides,
});

export const createMockPaginationOptions = (
  overrides: Partial<PaginationOptions> = {},
): PaginationOptions => ({
  page: undefined,
  limit: undefined,
  ...overrides,
});
