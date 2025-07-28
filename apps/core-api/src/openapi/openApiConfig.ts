import { generateSchema } from "@anatine/zod-openapi";
import { z } from "zod";
import {
  CreateUserFromSupabaseSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  ObjectIdSchema,
  UpdateUserSchema,
  UserListResponseSchema,
  UserSchema,
  UserStatsSchema,
} from "../users/schemas.js";
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
    body: CreateUserFromSupabaseSchema,
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
  getUserStats: {
    responses: {
      200: UserStatsSchema,
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
      "/api/v1/users": {
        get: {
          summary: "List all users",
          description:
            "Retrieve a paginated list of users with optional filtering",
          tags: ["Users"],
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
          requestBody: {
            required: true,
            content: createResponseContent(CreateUserFromSupabaseSchema),
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
      "/api/v1/users/stats": {
        get: {
          summary: "Get user statistics",
          description:
            "Retrieve statistics about users including counts by status and auth provider",
          tags: ["Users"],
          responses: {
            "200": {
              description: "User statistics retrieved successfully",
              content: createResponseContent(UserStatsSchema),
            },
            "500": {
              description: INTERNAL_ERROR_DESC,
              content: createResponseContent(ErrorResponseSchema),
            },
          },
        },
      },
      "/api/v1/users/{id}": {
        get: {
          summary: "Get user by ID",
          description: "Retrieve a specific user by their MongoDB ObjectId",
          tags: ["Users"],
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
      "/api/v1/users/{id}/restore": {
        post: {
          summary: "Restore deleted user",
          description:
            "Restore a soft-deleted user by setting their status back to 'active'",
          tags: ["Users"],
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
    },
    components: {
      schemas: {
        User: generateSchema(UserSchema),
        CreateUserFromSupabaseRequest: generateSchema(
          CreateUserFromSupabaseSchema,
        ),
        UpdateUserRequest: generateSchema(UpdateUserSchema),
        UserListResponse: generateSchema(UserListResponseSchema),
        UserStats: generateSchema(UserStatsSchema),
        ErrorResponse: generateSchema(ErrorResponseSchema),
      },
    },
    tags: [
      {
        name: "Users",
        description: "User management operations",
      },
    ],
  };

  return baseDocument;
}

export const openApiDocument = generateOpenApiDocument();
