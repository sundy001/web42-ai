import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// MongoDB ObjectId validation schema
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Common error response schema used across all API endpoints
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
