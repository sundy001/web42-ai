import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Project version schema
export const ProjectVersionSchema = z.object({
  versionId: z.string().openapi({
    example: "version1",
    description: "Unique version identifier",
  }),
  planId: z.string().openapi({
    example: "plan_abc",
    description: "Associated plan identifier",
  }),
  r2Path_artifacts: z.string().openapi({
    example: "/builds/version1/",
    description: "R2 storage path for build artifacts",
  }),
  triggeringMessageId: z.string().openapi({
    example: "msg_01",
    description: "Message ID that triggered this version",
  }),
});

// Project schema for database documents
export const ProjectSchema = z.object({
  _id: z.string().optional().openapi({
    example: "6887e12b78d088d6d3d68d10",
    description: "MongoDB ObjectId",
  }),
  userId: z.string().openapi({
    example: "688769de279a0fafe82bec23",
    description: "User ID who owns the project",
  }),
  name: z.string().min(1, "Project name is required").openapi({
    example: "My Math Test App",
    description: "Project name",
  }),
  activeDeploymentId: z.string().openapi({
    example: "version1",
    description: "Currently active deployment version ID",
  }),
  versions: z.array(ProjectVersionSchema).openapi({
    description: "Array of project versions",
  }),
  status: z
    .enum(["active", "deleted"])
    .openapi({ example: "active", description: "Project status" }),
  createdAt: z.string().datetime().optional().openapi({
    example: "2024-01-26T12:00:00.000Z",
    description: "Project creation timestamp",
  }),
  updatedAt: z.string().datetime().optional().openapi({
    example: "2024-01-26T12:00:00.000Z",
    description: "Project last update timestamp",
  }),
});

// Create project request schema
export const CreateProjectSchema = z.object({
  userId: z.string().openapi({
    example: "688769de279a0fafe82bec23",
    description: "User ID who will own the project",
  }),
  name: z.string().min(1, "Project name is required").openapi({
    example: "My New Project",
    description: "Project name",
  }),
  activeDeploymentId: z.string().openapi({
    example: "version1",
    description: "Initial active deployment version ID",
  }),
  versions: z.array(ProjectVersionSchema).openapi({
    description: "Initial project versions",
  }),
  status: z
    .enum(["active"])
    .optional()
    .default("active")
    .openapi({ example: "active", description: "Project status" }),
});

// Query filters schema
export const ProjectFiltersSchema = z.object({
  userId: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(["active", "deleted"]).optional(),
  includeDeleted: z.boolean().optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .optional()
    .openapi({ example: 1, description: "Page number for pagination" }),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional()
    .openapi({ example: 10, description: "Number of items per page" }),
});

// MongoDB ObjectId validation
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format")
  .openapi({
    example: "6887e12b78d088d6d3d68d10",
    description: "MongoDB ObjectId",
  });

// Query parameters schema for list endpoint
export const ListProjectsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1, "Page must be at least 1")
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1 && n <= 100, "Limit must be between 1 and 100")
    .optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(["active", "deleted"]).optional(),
  includeDeleted: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// Response schemas
export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSchema),
  total: z.number().openapi({
    example: 50,
    description: "Total number of projects matching the query",
  }),
  page: z.number().openapi({ example: 1, description: "Current page number" }),
  limit: z
    .number()
    .openapi({ example: 10, description: "Number of projects per page" }),
  totalPages: z
    .number()
    .openapi({ example: 5, description: "Total number of pages" }),
});

export const ErrorResponseSchema = z.object({
  error: z
    .string()
    .openapi({ example: "Validation failed", description: "Error type" }),
  message: z.string().optional().openapi({
    example: "Project name is required",
    description: "Error message",
  }),
  details: z
    .array(
      z.object({
        field: z.string().openapi({ example: "name" }),
        message: z.string().openapi({ example: "Project name is required" }),
      }),
    )
    .optional()
    .openapi({ description: "Detailed validation errors" }),
});

// Export types inferred from schemas
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type ProjectFiltersInput = z.infer<typeof ProjectFiltersSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type ListProjectsQueryInput = z.infer<typeof ListProjectsQuerySchema>;
