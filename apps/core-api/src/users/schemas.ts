import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// User schema for database documents
export const UserSchema = z.object({
  _id: z.string().optional().openapi({
    example: "68842630e5d48662e0313589",
    description: "MongoDB ObjectId",
  }),
  supabaseUserId: z.string().uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Supabase Auth User ID",
  }),
  email: z.string().email("Invalid email format").openapi({
    example: "user@example.com",
    description: "User email address (duplicated for performance)",
  }),
  role: z.enum(["admin", "user"]).default("user").openapi({
    example: "user",
    description: "User role (duplicated for performance)",
  }),
  status: z
    .enum(["active", "inactive", "deleted"])
    .openapi({ example: "active", description: "User status" }),
  createdAt: z.string().datetime().optional().openapi({
    example: "2024-01-26T12:00:00.000Z",
    description: "User creation timestamp",
  }),
  updatedAt: z.string().datetime().optional().openapi({
    example: "2024-01-26T12:00:00.000Z",
    description: "User last update timestamp",
  }),
});

// Create user request schema (creates both Supabase user and MongoDB document)
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format").openapi({
    example: "user@example.com",
    description: "User email address",
  }),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .openapi({
      example: "password123",
      description:
        "User password (required for email auth, optional for OAuth)",
    }),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional()
    .openapi({ example: "Jane Doe", description: "User full name" }),
  role: z
    .enum(["admin", "user"])
    .default("user")
    .openapi({ example: "user", description: "User role" }),
});

// Update user request schema
export const UpdateUserSchema = z
  .object({
    role: z
      .enum(["admin", "user"])
      .optional()
      .openapi({ example: "user", description: "User role" }),
    status: z.enum(["active", "inactive"]).optional().openapi({
      example: "active",
      description: "User status (cannot set to deleted via update)",
    }),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Query filters schema
export const UserFiltersSchema = z.object({
  supabaseUserId: z.string().uuid().optional(),
  email: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
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
    example: "68842630e5d48662e0313589",
    description: "MongoDB ObjectId",
  });

// Query parameters schema for list endpoint
export const ListUsersQuerySchema = z.object({
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
  supabaseUserId: z.string().uuid().optional(),
  email: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  includeDeleted: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// Response schemas
export const UserListResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().openapi({
    example: 100,
    description: "Total number of users matching the query",
  }),
  page: z.number().openapi({ example: 1, description: "Current page number" }),
  limit: z
    .number()
    .openapi({ example: 10, description: "Number of users per page" }),
  totalPages: z
    .number()
    .openapi({ example: 10, description: "Total number of pages" }),
});

export const UserStatsSchema = z.object({
  total: z
    .number()
    .openapi({ example: 100, description: "Total number of users" }),
  active: z
    .number()
    .openapi({ example: 80, description: "Number of active users" }),
  inactive: z
    .number()
    .openapi({ example: 15, description: "Number of inactive users" }),
  deleted: z
    .number()
    .openapi({ example: 5, description: "Number of deleted users" }),
  byAuthProvider: z.record(z.string(), z.number()).openapi({
    example: { google: 50, github: 30, email: 20 },
    description: "User count by authentication provider",
  }),
});

export const ErrorResponseSchema = z.object({
  error: z
    .string()
    .openapi({ example: "Validation failed", description: "Error type" }),
  message: z
    .string()
    .optional()
    .openapi({ example: "Email is required", description: "Error message" }),
  details: z
    .array(
      z.object({
        field: z.string().openapi({ example: "email" }),
        message: z.string().openapi({ example: "Invalid email format" }),
      }),
    )
    .optional()
    .openapi({ description: "Detailed validation errors" }),
});

// Export types inferred from schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type ListUsersQueryInput = z.infer<typeof ListUsersQuerySchema>;
