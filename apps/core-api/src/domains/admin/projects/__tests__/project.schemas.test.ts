import { describe, expect, it } from "vitest";
import {
  CreateProjectSchema,
  ErrorResponseSchema,
  ListProjectsQuerySchema,
  ObjectIdSchema,
  PaginationSchema,
  ProjectFiltersSchema,
  ProjectListResponseSchema,
  ProjectSchema,
  ProjectVersionSchema,
} from "../project.schemas";

describe("project.schemas", () => {
  const VERSION_ID = "version1";

  describe("ProjectVersionSchema", () => {
    it("should validate valid project version data", () => {
      const validVersion = {
        versionId: VERSION_ID,
        planId: "plan_abc",
        r2Path_artifacts: `/builds/${VERSION_ID}/`,
        triggeringMessageId: "msg_01",
      };

      expect(() => ProjectVersionSchema.parse(validVersion)).not.toThrow();
    });

    it("should reject invalid project version data", () => {
      const invalidVersion = {
        versionId: "", // Empty string
        planId: "plan_abc",
        r2Path_artifacts: "/builds/version1/",
      }; // Missing triggeringMessageId

      expect(() => ProjectVersionSchema.parse(invalidVersion)).toThrow();
    });
  });

  describe("ProjectSchema", () => {
    const validProject = {
      _id: "6887e12b78d088d6d3d68d10",
      userId: "688769de279a0fafe82bec23",
      name: "My Math Test App",
      activeDeploymentId: VERSION_ID,
      versions: [
        {
          versionId: VERSION_ID,
          planId: "plan_abc",
          r2Path_artifacts: "/builds/version1/",
          triggeringMessageId: "msg_01",
        },
      ],
      status: "active" as const,
      createdAt: "2024-01-26T12:00:00.000Z",
      updatedAt: "2024-01-26T12:00:00.000Z",
    };

    it("should validate valid project data", () => {
      expect(() => ProjectSchema.parse(validProject)).not.toThrow();
    });

    it("should validate project without optional fields", () => {
      const {
        _id: _objectId,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...projectWithoutOptional
      } = validProject;
      expect(() => ProjectSchema.parse(projectWithoutOptional)).not.toThrow();
    });

    it("should reject project with empty name", () => {
      const invalidProject = { ...validProject, name: "" };
      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it("should reject project with invalid status", () => {
      const invalidProject = { ...validProject, status: "invalid" };
      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it("should reject project with invalid datetime", () => {
      const invalidProject = { ...validProject, createdAt: "invalid-date" };
      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe("CreateProjectSchema", () => {
    const validCreateProject = {
      userId: "688769de279a0fafe82bec23",
      name: "My New Project",
      activeDeploymentId: VERSION_ID,
      versions: [
        {
          versionId: VERSION_ID,
          planId: "plan_abc",
          r2Path_artifacts: "/builds/version1/",
          triggeringMessageId: "msg_01",
        },
      ],
      status: "active" as const,
    };

    it("should validate valid create project data", () => {
      expect(() => CreateProjectSchema.parse(validCreateProject)).not.toThrow();
    });

    it("should validate create project without optional status", () => {
      const { status: _status, ...projectWithoutStatus } = validCreateProject;
      const result = CreateProjectSchema.parse(projectWithoutStatus);
      expect(result.status).toBe("active"); // Default value
    });

    it("should reject create project with empty name", () => {
      const invalidProject = { ...validCreateProject, name: "" };
      expect(() => CreateProjectSchema.parse(invalidProject)).toThrow();
    });

    it("should reject create project with deleted status", () => {
      const invalidProject = { ...validCreateProject, status: "deleted" };
      expect(() => CreateProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe("ProjectFiltersSchema", () => {
    it("should validate valid filters", () => {
      const validFilters = {
        userId: "688769de279a0fafe82bec23",
        name: "Test Project",
        status: "active" as const,
        includeDeleted: true,
      };

      expect(() => ProjectFiltersSchema.parse(validFilters)).not.toThrow();
    });

    it("should validate empty filters", () => {
      expect(() => ProjectFiltersSchema.parse({})).not.toThrow();
    });

    it("should reject invalid status", () => {
      const invalidFilters = { status: "invalid" };
      expect(() => ProjectFiltersSchema.parse(invalidFilters)).toThrow();
    });
  });

  describe("PaginationSchema", () => {
    it("should validate valid pagination", () => {
      const validPagination = { page: 1, limit: 10 };
      expect(() => PaginationSchema.parse(validPagination)).not.toThrow();
    });

    it("should validate empty pagination", () => {
      expect(() => PaginationSchema.parse({})).not.toThrow();
    });

    it("should reject page less than 1", () => {
      const invalidPagination = { page: 0 };
      expect(() => PaginationSchema.parse(invalidPagination)).toThrow();
    });

    it("should reject limit less than 1", () => {
      const invalidPagination = { limit: 0 };
      expect(() => PaginationSchema.parse(invalidPagination)).toThrow();
    });

    it("should reject limit greater than 100", () => {
      const invalidPagination = { limit: 101 };
      expect(() => PaginationSchema.parse(invalidPagination)).toThrow();
    });
  });

  describe("ObjectIdSchema", () => {
    it("should validate valid ObjectId", () => {
      const validObjectId = "6887e12b78d088d6d3d68d10";
      expect(() => ObjectIdSchema.parse(validObjectId)).not.toThrow();
    });

    it("should reject invalid ObjectId format", () => {
      const invalidObjectIds = [
        "123", // Too short
        "6887e12b78d088d6d3d68d1g", // Invalid character
        "6887e12b78d088d6d3d68d100", // Too long
        "", // Empty string
      ];

      invalidObjectIds.forEach((id) => {
        expect(() => ObjectIdSchema.parse(id)).toThrow();
      });
    });
  });

  describe("ListProjectsQuerySchema", () => {
    it("should validate valid query parameters", () => {
      const validQuery = {
        page: "1",
        limit: "10",
        userId: "688769de279a0fafe82bec23",
        name: "Test Project",
        status: "active" as const,
        includeDeleted: "true",
      };

      const result = ListProjectsQuerySchema.parse(validQuery);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.includeDeleted).toBe(true);
    });

    it("should validate empty query", () => {
      expect(() => ListProjectsQuerySchema.parse({})).not.toThrow();
    });

    it("should transform string page to number", () => {
      const query = { page: "5" };
      const result = ListProjectsQuerySchema.parse(query);
      expect(result.page).toBe(5);
    });

    it("should transform string limit to number", () => {
      const query = { limit: "25" };
      const result = ListProjectsQuerySchema.parse(query);
      expect(result.limit).toBe(25);
    });

    it("should transform includeDeleted string to boolean", () => {
      const trueQuery = { includeDeleted: "true" };
      const falseQuery = { includeDeleted: "false" };

      expect(ListProjectsQuerySchema.parse(trueQuery).includeDeleted).toBe(
        true,
      );
      expect(ListProjectsQuerySchema.parse(falseQuery).includeDeleted).toBe(
        false,
      );
    });

    it("should reject invalid page format", () => {
      const invalidQuery = { page: "abc" };
      expect(() => ListProjectsQuerySchema.parse(invalidQuery)).toThrow();
    });

    it("should reject page less than 1", () => {
      const invalidQuery = { page: "0" };
      expect(() => ListProjectsQuerySchema.parse(invalidQuery)).toThrow();
    });

    it("should reject invalid limit format", () => {
      const invalidQuery = { limit: "abc" };
      expect(() => ListProjectsQuerySchema.parse(invalidQuery)).toThrow();
    });

    it("should reject limit out of range", () => {
      const tooLowQuery = { limit: "0" };
      const tooHighQuery = { limit: "101" };

      expect(() => ListProjectsQuerySchema.parse(tooLowQuery)).toThrow();
      expect(() => ListProjectsQuerySchema.parse(tooHighQuery)).toThrow();
    });
  });

  describe("ProjectListResponseSchema", () => {
    it("should validate valid project list response", () => {
      const validResponse = {
        projects: [
          {
            _id: "6887e12b78d088d6d3d68d10",
            userId: "688769de279a0fafe82bec23",
            name: "My Math Test App",
            activeDeploymentId: VERSION_ID,
            versions: [
              {
                versionId: VERSION_ID,
                planId: "plan_abc",
                r2Path_artifacts: "/builds/version1/",
                triggeringMessageId: "msg_01",
              },
            ],
            status: "active" as const,
            createdAt: "2024-01-26T12:00:00.000Z",
            updatedAt: "2024-01-26T12:00:00.000Z",
          },
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
      };

      expect(() =>
        ProjectListResponseSchema.parse(validResponse),
      ).not.toThrow();
    });

    it("should validate empty projects array", () => {
      const emptyResponse = {
        projects: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      expect(() =>
        ProjectListResponseSchema.parse(emptyResponse),
      ).not.toThrow();
    });
  });

  describe("ErrorResponseSchema", () => {
    it("should validate error response with all fields", () => {
      const validError = {
        error: "Validation failed",
        message: "Project name is required",
        details: [
          {
            field: "name",
            message: "Project name is required",
          },
        ],
      };

      expect(() => ErrorResponseSchema.parse(validError)).not.toThrow();
    });

    it("should validate error response with minimal fields", () => {
      const minimalError = {
        error: "Not found",
      };

      expect(() => ErrorResponseSchema.parse(minimalError)).not.toThrow();
    });

    it("should validate error response without details", () => {
      const errorWithoutDetails = {
        error: "Validation failed",
        message: "Project name is required",
      };

      expect(() =>
        ErrorResponseSchema.parse(errorWithoutDetails),
      ).not.toThrow();
    });
  });
});
