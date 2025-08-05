import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Thread creation request schema
export const CreateThreadSchema = z.object({
  projectId: z.string().openapi({
    example: "688920c8657ac16f374286c3",
    description: "MongoDB ObjectId of the project",
  }),
  initialMessage: z.string().openapi({
    example: "Make me a site to test math skills",
    description: "Initial user message for the thread",
  }),
});

// Export types inferred from schemas
export type CreateThreadRequest = z.infer<typeof CreateThreadSchema>;
