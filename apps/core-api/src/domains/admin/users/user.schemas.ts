import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// User schema for database documents
export const UserSchema = z.object({
  id: z.string().openapi({
    example: "68842630e5d48662e0313589",
    description: "MongoDB ObjectId",
  }),
  email: z.string().email("Invalid email format").openapi({
    example: "user@example.com",
    description: "User email address",
  }),
  name: z.string().openapi({
    example: "Jane Doe",
    description: "User full name",
  }),
  role: z.enum(["admin", "user"]).openapi({
    example: "user",
    description: "User role",
  }),
  status: z
    .enum(["active", "inactive", "deleted"])
    .openapi({ example: "active", description: "User status" }),
  emailVerified: z.boolean().openapi({
    example: true,
    description: "Whether the user's email is verified",
  }),
  avatarUrl: z.string().url().optional().openapi({
    example: "https://example.com/avatar.jpg",
    description: "User avatar URL",
  }),
  createdAt: z.string().datetime().openapi({
    example: "2024-01-26T12:00:00.000Z",
    description: "User creation timestamp",
  }),
  updatedAt: z.string().datetime().openapi({
    example: "2024-01-26T12:00:00.000Z",
    description: "User last update timestamp",
  }),
  lastSignInAt: z.string().datetime().optional().openapi({
    example: "2024-01-26T12:00:00.000Z",
    description: "User last sign in timestamp",
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
    .openapi({ example: "Jane Doe", description: "User full name" }),
  role: z
    .enum(["admin", "user"])
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
  status: z.enum(["active", "inactive", "deleted"]).optional(),
  includeDeleted: z.boolean().optional(),
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
  status: z.enum(["active", "inactive", "deleted"]).optional(),
  includeDeleted: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// Response schemas
export const UserListResponseSchema = z.object({
  items: z.array(UserSchema),
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
export type User = z.infer<typeof UserSchema>;
export type CreateUserPayload = z.infer<typeof CreateUserSchema>;
export type UpdateUserPayload = z.infer<typeof UpdateUserSchema>;
export type UserFiltersPayload = z.infer<typeof UserFiltersSchema>;
export type ListUsersQueryPayload = z.infer<typeof ListUsersQuerySchema>;

export type UserListResponse = z.infer<typeof UserListResponseSchema>;
