import { generateSchema } from "@anatine/zod-openapi";
import { z } from "zod";
import {
  CreateUserSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  ObjectIdSchema,
  UpdateUserSchema,
  UserListResponseSchema,
  UserSchema,
} from "../domains/admin/users";
import {
  CreateProjectSchema,
  ListProjectsQuerySchema,
  ProjectListResponseSchema,
  ProjectSchema,
} from "../domains/admin/projects/project.schemas";
import {
  LoginResponseSchema,
  LoginSchema,
  SignoutResponseSchema,
  SignoutSchema,
} from "../domains/auth";
import { generateExample } from "./generateExample.js";

// Constants for response descriptions
const VALIDATION_ERROR_DESC = "Validation error";
const INTERNAL_ERROR_DESC = "Internal server error";

// Helper function to create response content with examples
function createResponseContent(schema: z.ZodTypeAny) {
  const generatedSchema = generateSchema(schema);
  const example = generateExample(schema);

  return {
    "application/json": {
      schema: generatedSchema,
      example: example,
    },
  };
}

// Define route schemas for OpenAPI generation
export const routeSchemas = {
  listUsers: {
    query: ListUsersQuerySchema,
    responses: {
      200: UserListResponseSchema,
      400: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  getUser: {
    params: {
      id: ObjectIdSchema,
    },
    responses: {
      200: UserSchema,
      400: ErrorResponseSchema,
      404: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  createUser: {
    body: CreateUserSchema,
    responses: {
      201: UserSchema,
      400: ErrorResponseSchema,
      409: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  updateUser: {
    params: {
      id: ObjectIdSchema,
    },
    body: UpdateUserSchema,
    responses: {
      200: UserSchema,
      400: ErrorResponseSchema,
      404: ErrorResponseSchema,
      409: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  deleteUser: {
    params: {
      id: ObjectIdSchema,
    },
    responses: {
      204: undefined,
      400: ErrorResponseSchema,
      404: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  restoreUser: {
    params: {
      id: ObjectIdSchema,
    },
    responses: {
      200: UserSchema,
      400: ErrorResponseSchema,
      404: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  listProjects: {
    query: ListProjectsQuerySchema,
    responses: {
      200: ProjectListResponseSchema,
      400: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  getProject: {
    params: {
      id: ObjectIdSchema,
    },
    responses: {
      200: ProjectSchema,
      400: ErrorResponseSchema,
      404: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  createProject: {
    body: CreateProjectSchema,
    responses: {
      201: ProjectSchema,
      400: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  deleteProject: {
    params: {
      id: ObjectIdSchema,
    },
    responses: {
      204: undefined,
      400: ErrorResponseSchema,
      404: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
};

// Generate OpenAPI document
export function generateOpenApiDocument() {
  const baseDocument = {
    openapi: "3.0.0",
    info: {
      title: "Core API",
      version: "1.0.0",
      description: "REST API for web42-ai Core API service",
      contact: {
        name: "Core API Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3002",
        description: "Development server",
      },
    ],
    paths: {
      "/api/v1/auth/login": {
        post: {
          summary: "User login",
          description:
            "Authenticate user with email and password, returns user data and session tokens",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: createResponseContent(LoginSchema),
          },
          responses: {
            "200": {
              description: "Login successful",
              content: createResponseContent(LoginResponseSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "401": {
              description: "Authentication failed",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/auth/signout": {
        post: {
          summary: "User signout",
          description: "Sign out user by invalidating their access token",
          tags: ["Authentication"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: createResponseContent(SignoutSchema),
          },
          responses: {
            "200": {
              description: "Signout successful",
              content: createResponseContent(SignoutResponseSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/admin/users": {
        get: {
          summary: "List all users",
          description:
            "Retrieve a paginated list of users with optional filtering",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "page",
              schema: { type: "integer", minimum: 1, default: 1 },
              description: "Page number for pagination",
            },
            {
              in: "query",
              name: "limit",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
              description: "Number of users per page",
            },
            {
              in: "query",
              name: "email",
              schema: { type: "string" },
              description: "Filter by email (case-insensitive partial match)",
            },
            {
              in: "query",
              name: "name",
              schema: { type: "string" },
              description: "Filter by name (case-insensitive partial match)",
            },
            {
              in: "query",
              name: "authProvider",
              schema: { type: "string", enum: ["google", "github", "email"] },
              description: "Filter by authentication provider",
            },
            {
              in: "query",
              name: "status",
              schema: { type: "string", enum: ["active", "inactive"] },
              description: "Filter by status",
            },
            {
              in: "query",
              name: "includeDeleted",
              schema: { type: "boolean", default: false },
              description: "Include deleted users in results",
            },
          ],
          responses: {
            "200": {
              description: "List of users retrieved successfully",
              content: createResponseContent(UserListResponseSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
        post: {
          summary: "Create a new user",
          description: "Create a new user with the provided information",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: createResponseContent(CreateUserSchema),
          },
          responses: {
            "201": {
              description: "User created successfully",
              content: createResponseContent(UserSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "409": {
              description: "User with email already exists",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/admin/users/{id}": {
        get: {
          summary: "Get user by ID",
          description: "Retrieve a specific user by their MongoDB ObjectId",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              description: "User MongoDB ObjectId",
              schema: generateSchema(ObjectIdSchema),
            },
          ],
          responses: {
            "200": {
              description: "User retrieved successfully",
              content: createResponseContent(UserSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "404": {
              description: "User not found",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
        put: {
          summary: "Update user",
          description: "Update an existing user's information",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              description: "User MongoDB ObjectId",
              schema: generateSchema(ObjectIdSchema),
            },
          ],
          requestBody: {
            required: true,
            content: createResponseContent(UpdateUserSchema),
          },
          responses: {
            "200": {
              description: "User updated successfully",
              content: createResponseContent(UserSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "404": {
              description: "User not found",
              content: createResponseContent(ErrorResponseSchema),
            },
            "409": {
              description: "Another user with this email already exists",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
        delete: {
          summary: "Soft delete user",
          description:
            "Soft delete a user by setting their status to 'deleted'",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              description: "User MongoDB ObjectId",
              schema: generateSchema(ObjectIdSchema),
            },
          ],
          responses: {
            "204": {
              description: "User deleted successfully",
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "404": {
              description: "User not found",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/admin/users/{id}/restore": {
        post: {
          summary: "Restore deleted user",
          description:
            "Restore a soft-deleted user by setting their status back to 'active'",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              description: "User MongoDB ObjectId",
              schema: generateSchema(ObjectIdSchema),
            },
          ],
          responses: {
            "200": {
              description: "User restored successfully",
              content: createResponseContent(UserSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "404": {
              description: "Deleted user not found",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/admin/projects": {
        get: {
          summary: "List all projects",
          description:
            "Retrieve a paginated list of projects with optional filtering",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "page",
              schema: { type: "string" },
              description: "Page number for pagination",
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "string" },
              description: "Number of projects per page (1-100)",
            },
            {
              in: "query",
              name: "userId",
              schema: { type: "string" },
              description: "Filter by user ID",
            },
            {
              in: "query",
              name: "name",
              schema: { type: "string" },
              description: "Filter by project name (case-insensitive partial match)",
            },
            {
              in: "query",
              name: "status",
              schema: { type: "string", enum: ["active", "deleted"] },
              description: "Filter by project status",
            },
            {
              in: "query",
              name: "includeDeleted",
              schema: { type: "string" },
              description: "Include deleted projects (pass 'true' to include)",
            },
          ],
          responses: {
            "200": {
              description: "List of projects retrieved successfully",
              content: createResponseContent(ProjectListResponseSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
        post: {
          summary: "Create a new project",
          description: "Create a new project with the provided information",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: createResponseContent(CreateProjectSchema),
          },
          responses: {
            "201": {
              description: "Project created successfully",
              content: createResponseContent(ProjectSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/admin/projects/{id}": {
        get: {
          summary: "Get project by ID",
          description: "Retrieve a specific project by its MongoDB ObjectId",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              description: "Project MongoDB ObjectId",
              schema: generateSchema(ObjectIdSchema),
            },
          ],
          responses: {
            "200": {
              description: "Project retrieved successfully",
              content: createResponseContent(ProjectSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "404": {
              description: "Project not found",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
        delete: {
          summary: "Soft delete project",
          description:
            "Soft delete a project by setting its status to 'deleted'",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              description: "Project MongoDB ObjectId",
              schema: generateSchema(ObjectIdSchema),
            },
          ],
          responses: {
            "204": {
              description: "Project deleted successfully",
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "404": {
              description: "Project not found",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
    },
    components: {
      schemas: {
        User: generateSchema(UserSchema),
        CreateUserRequest: generateSchema(CreateUserSchema),
        UpdateUserRequest: generateSchema(UpdateUserSchema),
        UserListResponse: generateSchema(UserListResponseSchema),
        Project: generateSchema(ProjectSchema),
        CreateProjectRequest: generateSchema(CreateProjectSchema),
        ProjectListResponse: generateSchema(ProjectListResponseSchema),
        LoginRequest: generateSchema(LoginSchema),
        LoginResponse: generateSchema(LoginResponseSchema),
        SignoutRequest: generateSchema(SignoutSchema),
        SignoutResponse: generateSchema(SignoutResponseSchema),
        ErrorResponse: generateSchema(ErrorResponseSchema),
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from Supabase authentication",
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication operations",
      },
      {
        name: "Users",
        description: "User management operations",
      },
      {
        name: "Projects",
        description: "Project management operations",
      },
    ],
  };

  return baseDocument;
}

export const openApiDocument = generateOpenApiDocument();
