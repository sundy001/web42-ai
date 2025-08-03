import { UserSchema } from "@/domains/admin/users";
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

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

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

// Login response schema
export const LoginResponseSchema = UserSchema;

// Signout response schema
export const SignoutResponseSchema = z.object({
  message: z.string().openapi({
    example: "Successfully signed out",
    description: "Confirmation message",
  }),
});

// Refresh token response schema (web client - cookies)
export const RefreshTokenResponseSchema = z.object({
  message: z.string().openapi({
    example: "Token refreshed successfully",
    description: "Confirmation message",
  }),
});

// API Refresh token response schema (API clients - returns tokens)
export const ApiRefreshTokenResponseSchema = z.object({
  access_token: z.string().openapi({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token",
  }),
  refresh_token: z.string().openapi({
    example: "v1.MHg5ZjA4NzU2NzY4NDY3MDY4NjQ2NTc0NjM2NTczNzM...",
    description: "Refresh token for obtaining new access tokens",
  }),
  token_type: z.string().openapi({
    example: "Bearer",
    description: "Token type (always 'Bearer')",
  }),
  expires_in: z.number().openapi({
    example: 3600,
    description: "Access token expiration time in seconds",
  }),
});

// Me response schema - returns current user info from JWT
export const MeResponseSchema = z.object({
  id: z.string().uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "User ID from JWT claims",
  }),
  email: z.string().email().openapi({
    example: "user@example.com",
    description: "User email from JWT claims",
  }),
  name: z.string().openapi({
    example: "Jane Doe",
    description: "User full name from JWT claims",
  }),
  role: z.string().openapi({
    example: "user",
    description: "User role from JWT claims",
  }),
  is_anonymous: z.boolean().openapi({
    example: false,
    description: "Whether the user is anonymous from JWT claims",
  }),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Request types
export type LoginInput = z.infer<typeof LoginSchema>;

// Response types
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type SignoutResponse = z.infer<typeof SignoutResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type ApiRefreshTokenResponse = z.infer<
  typeof ApiRefreshTokenResponseSchema
>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
