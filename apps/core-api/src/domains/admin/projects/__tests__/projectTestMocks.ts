import { vi } from "vitest";

// Mock constants
export const VALIDATION_ERROR = "Validation failed";
export const BAD_REQUEST_ERROR = "Bad Request";
export const INTERNAL_SERVER_ERROR = "Internal Server Error";
export const INVALID_ID_FORMAT = "Invalid ID format";

// Setup project service mocks
export function setupProjectServiceMocks() {
  vi.doMock("../project.service", () => ({
    createProject: vi.fn(),
    getProjectById: vi.fn(),
    deleteProject: vi.fn(),
    listProjects: vi.fn(),
  }));
}
