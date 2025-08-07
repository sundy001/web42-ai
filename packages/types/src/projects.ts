import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";
import { MessageSchema } from "./messages.js";

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

// Project creation response schema
export const CreateProjectFromPromptResponseSchema = z.object({
  project: ProjectResponseSchema,
  thread: z.array(MessageSchema).openapi({
    description: "Initial message for the project",
  }),
});

// Export types inferred from schemas
export type CreateProjectFromPromptRequest = z.infer<
  typeof CreateProjectFromPromptSchema
>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type CreateProjectFromPromptResponse = z.infer<
  typeof CreateProjectFromPromptResponseSchema
>;
