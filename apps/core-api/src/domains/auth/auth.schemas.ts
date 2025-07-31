import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Schema constants
const EXAMPLE_TIMESTAMP = "2024-01-26T12:00:00.000Z";

// Login request schema
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").openapi({
    example: "user@example.com",
    description: "User email address",
  }),
  password: z.string().min(1, "Password is required").openapi({
    example: "password123",
    description: "User password",
  }),
});

// Login response schema
export const LoginResponseSchema = z.object({
  user: z
    .object({
      _id: z.string().optional().openapi({
        example: "68842630e5d48662e0313589",
        description: "MongoDB ObjectId",
      }),
      supabaseUserId: z.string().uuid().openapi({
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "Supabase Auth User ID",
      }),
      email: z.string().email().openapi({
        example: "user@example.com",
        description: "User email address",
      }),
      role: z.enum(["admin", "user"]).openapi({
        example: "user",
        description: "User role",
      }),
      status: z.enum(["active", "inactive", "deleted"]).openapi({
        example: "active",
        description: "User status",
      }),
      name: z.string().optional().openapi({
        example: "Jane Doe",
        description: "User full name",
      }),
      avatarUrl: z.string().optional().openapi({
        example: "https://example.com/avatar.jpg",
        description: "User avatar URL",
      }),
      createdAt: z.string().datetime().optional().openapi({
        example: EXAMPLE_TIMESTAMP,
        description: "User creation timestamp",
      }),
      updatedAt: z.string().datetime().optional().openapi({
        example: EXAMPLE_TIMESTAMP,
        description: "User last update timestamp",
      }),
      // Auth provider fields
      authProvider: z.string().optional().openapi({
        example: "supabase",
        description: "Authentication provider",
      }),
      lastSignInAt: z.string().optional().openapi({
        example: EXAMPLE_TIMESTAMP,
        description: "Last sign in timestamp",
      }),
      emailConfirmedAt: z.string().optional().openapi({
        example: EXAMPLE_TIMESTAMP,
        description: "Email confirmation timestamp",
      }),
      phoneConfirmedAt: z.string().optional().openapi({
        example: EXAMPLE_TIMESTAMP,
        description: "Phone confirmation timestamp",
      }),
      phone: z.string().optional().openapi({
        example: "+1234567890",
        description: "User phone number",
      }),
      userMetadata: z.record(z.unknown()).optional().openapi({
        description: "User metadata from auth provider",
      }),
      appMetadata: z.record(z.unknown()).optional().openapi({
        description: "App metadata from auth provider",
      }),
    })
    .openapi({
      description: "Combined user data from MongoDB and Supabase",
    }),
  session: z
    .object({
      access_token: z.string().openapi({
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        description: "JWT access token",
      }),
      refresh_token: z.string().openapi({
        example: "refresh_token_string",
        description: "Refresh token for obtaining new access tokens",
      }),
      expires_in: z.number().openapi({
        example: 3600,
        description: "Token expiration time in seconds",
      }),
      token_type: z.string().openapi({
        example: "bearer",
        description: "Token type",
      }),
    })
    .openapi({
      description: "Supabase session information",
    }),
});

// Signout response schema
export const SignoutResponseSchema = z.object({
  message: z.string().openapi({
    example: "Successfully signed out",
    description: "Confirmation message",
  }),
});

// Export types inferred from schemas
export type LoginInput = z.infer<typeof LoginSchema>;
