import { ObjectIdSchema } from "@/utils/schemas";
import { generateSchema } from "@anatine/zod-openapi";
import { z } from "zod";
import {
  CreateProjectSchema,
  ListProjectsQuerySchema,
  ProjectListResponseSchema,
  ProjectSchema,
} from "../domains/admin/projects/project.schemas";
import {
  CreateUserSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UserListResponseSchema,
  UserSchema,
} from "../domains/admin/users";
import {
  ApiRefreshTokenResponseSchema,
  LoginResponseSchema,
  LoginSchema,
  MeResponseSchema,
  RefreshTokenResponseSchema,
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
  login: {
    body: LoginSchema,
    responses: {
      200: LoginResponseSchema,
      400: ErrorResponseSchema,
      401: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  signout: {
    responses: {
      204: undefined,
      500: ErrorResponseSchema,
    },
  },
  refresh: {
    responses: {
      200: RefreshTokenResponseSchema,
      401: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  refreshApi: {
    responses: {
      200: ApiRefreshTokenResponseSchema,
      401: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
  me: {
    responses: {
      200: MeResponseSchema,
      401: ErrorResponseSchema,
      500: ErrorResponseSchema,
    },
  },
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
      200: UserSchema,
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
    openapi: "3.1.0",
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
            "Authenticate user with email and password. Sets secure HttpOnly cookies for authentication. Returns user data only.",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: createResponseContent(LoginSchema),
          },
          responses: {
            "200": {
              description: "Login successful - authentication cookies set",
              headers: {
                "Set-Cookie": {
                  description:
                    "HttpOnly authentication cookies (access_token, refresh_token)",
                  schema: {
                    type: "string",
                    example:
                      "web42_access_token=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/",
                  },
                },
              },
              content: createResponseContent(LoginResponseSchema),
            },
            "400": {
              description: VALIDATION_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
            "401": {
              description: "Invalid credentials",
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
          description: "Sign out user and clear authentication cookies",
          tags: ["Authentication"],
          security: [{ cookieAuth: [] }],
          responses: {
            "204": {
              description:
                "Signout successful - authentication cookies cleared",
              headers: {
                "Set-Cookie": {
                  description: "Clears authentication cookies",
                  schema: {
                    type: "string",
                    example:
                      "web42_access_token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
                  },
                },
              },
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/auth/refresh": {
        post: {
          summary: "Refresh access token (Web clients)",
          description:
            "Refresh access token using refresh token from cookies. Updates both access and refresh tokens via HttpOnly cookies. For web applications only.",
          tags: ["Authentication"],
          security: [{ cookieAuth: [] }],
          responses: {
            "200": {
              description:
                "Token refreshed successfully - new authentication cookies set",
              headers: {
                "Set-Cookie": {
                  description:
                    "Updated HttpOnly authentication cookies (access_token, refresh_token)",
                  schema: {
                    type: "string",
                    example:
                      "web42_access_token=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/",
                  },
                },
              },
              content: createResponseContent(RefreshTokenResponseSchema),
            },
            "401": {
              description: "Invalid credentials",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/auth/refresh/api": {
        post: {
          summary: "Refresh access token (API clients)",
          description:
            "Refresh access token for API clients (mobile apps, CLI tools, SDKs). Accepts refresh token via Authorization header and returns new tokens in response body.",
          tags: ["Authentication"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              description: "Bearer token with refresh token",
              schema: {
                type: "string",
                example:
                  "Bearer v1.MHg5ZjA4NzU2NzY4NDY3MDY4NjQ2NTc0NjM2NTczNzM...",
              },
            },
          ],
          responses: {
            "200": {
              description:
                "Tokens refreshed successfully - returns new tokens in response body",
              content: createResponseContent(ApiRefreshTokenResponseSchema),
            },
            "401": {
              description: "Invalid credentials",
              content: createResponseContent(ErrorResponseSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/auth/me": {
        get: {
          summary: "Get current authenticated user",
          description:
            "Returns the current authenticated user information from JWT claims. This endpoint is designed for BFF middleware usage with minimal data exposure.",
          tags: ["Authentication"],
          security: [{ cookieAuth: [] }],
          responses: {
            "200": {
              description: "Current user information retrieved successfully",
              content: createResponseContent(MeResponseSchema),
            },
            "401": {
              description: "Invalid credentials",
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
          security: [{ cookieAuth: [] }],
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
              name: "supabaseUserId",
              schema: { type: "string" },
              description: "Filter by Supabase user ID",
            },
            {
              in: "query",
              name: "email",
              schema: { type: "string" },
              description: "Filter by email (case-insensitive partial match)",
            },
            {
              in: "query",
              name: "role",
              schema: { type: "string", enum: ["admin", "user"] },
              description: "Filter by user role",
            },
            {
              in: "query",
              name: "status",
              schema: {
                type: "string",
                enum: ["active", "inactive", "deleted"],
              },
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
          security: [{ cookieAuth: [] }],
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
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              // required: true,
              description: "User MongoDB ObjectId",
              // TODO: with this, the swagger ui does not allow me to pass the id
              // schema: generateSchema(ObjectIdSchema),
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
          security: [{ cookieAuth: [] }],
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
          security: [{ cookieAuth: [] }],
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
              description: "User deleted successfully",
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
      },
      "/api/v1/admin/users/{id}/restore": {
        post: {
          summary: "Restore deleted user",
          description:
            "Restore a soft-deleted user by setting their status back to 'active'",
          tags: ["Users"],
          security: [{ cookieAuth: [] }],
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
          security: [{ cookieAuth: [] }],
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
              description:
                "Filter by project name (case-insensitive partial match)",
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
          security: [{ cookieAuth: [] }],
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
          security: [{ cookieAuth: [] }],
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
          security: [{ cookieAuth: [] }],
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
        RefreshTokenResponse: generateSchema(RefreshTokenResponseSchema),
        ApiRefreshTokenResponse: generateSchema(ApiRefreshTokenResponseSchema),
        ErrorResponse: generateSchema(ErrorResponseSchema),
      },
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "web42_access_token",
          description:
            "HttpOnly cookie-based authentication using access token",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Bearer token authentication for API clients",
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
