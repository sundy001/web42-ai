import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Project creation from prompt request schema
export const CreateProjectFromPromptSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(1000, "Prompt must not exceed 1000 characters")
    .openapi({
      example: "Create a landing page for a tech startup",
      description: "The user prompt to generate a project from",
    }),
});

// User-facing project schema (minimal fields)
export const ProjectResponseSchema = z.object({
  id: z.string().openapi({
    example: "688920c8657ac16f374286c3",
    description: "MongoDB ObjectId",
  }),
  name: z.string().openapi({
    example: "Corporate Landing",
    description: "Project name generated from the prompt",
  }),
});

// Thread message schema
export const ThreadMessageSchema = z.object({
  id: z.string().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Message UUID",
  }),
  role: z.enum(["user", "assistant"]).openapi({
    example: "user",
    description: "Message sender role",
  }),
  contentType: z.enum(["text", "image", "code"]).openapi({
    example: "text",
    description: "Type of message content",
  }),
  content: z.string().openapi({
    example: "Make me a site to test math skills",
    description: "Message content",
  }),
  createdAt: z.string().datetime().openapi({
    example: "2023-10-27T10:01:00Z",
    description: "Message creation timestamp",
  }),
});

// Project creation response schema
export const CreateProjectFromPromptResponseSchema = z.object({
  project: ProjectResponseSchema,
  thread: z.array(ThreadMessageSchema).openapi({
    description: "Initial thread messages",
  }),
});

// Export types inferred from schemas
export type CreateProjectFromPromptRequest = z.infer<
  typeof CreateProjectFromPromptSchema
>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type ThreadMessage = z.infer<typeof ThreadMessageSchema>;
export type CreateProjectFromPromptResponse = z.infer<
  typeof CreateProjectFromPromptResponseSchema
>;
