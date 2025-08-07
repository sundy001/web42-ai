import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Message schema (individual message)
export const MessageSchema = z.object({
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
    example: "Create a website for me",
    description: "Message content",
  }),
  createdAt: z.string().datetime().openapi({
    example: "2023-10-27T10:01:00Z",
    description: "Message creation timestamp",
  }),
});

// Create message request schema
export const CreateMessageSchema = z.object({
  projectId: z.string().openapi({
    example: "688920c8657ac16f374286c3",
    description: "MongoDB ObjectId of the project",
  }),
  content: z.string().openapi({
    example: "Create a landing page",
    description: "Message content",
  }),
  role: z.enum(["user", "assistant"]).default("user").openapi({
    example: "user",
    description: "Message sender role",
  }),
  contentType: z.enum(["text", "image", "code"]).default("text").openapi({
    example: "text",
    description: "Type of message content",
  }),
});

// Get messages query parameters
export const GetMessagesQuerySchema = z.object({
  projectId: z.string().openapi({
    example: "688920c8657ac16f374286c3",
    description: "MongoDB ObjectId of the project",
  }),
  timestamp: z.string().datetime().optional().openapi({
    example: "2023-10-27T10:01:00Z",
    description:
      "Cursor timestamp for pagination (get messages before this time)",
  }),
  limit: z.coerce
    .number()
    .int()
    .min(10)
    .max(30)
    .default(10)
    .optional()
    .openapi({
      example: 10,
      description: "Number of messages to retrieve",
    }),
});

// Messages list response
export const MessagesListResponseSchema = z.object({
  messages: z.array(MessageSchema).openapi({
    description: "List of messages",
  }),
  hasMore: z.boolean().optional().openapi({
    example: true,
    description: "Whether there are more messages to load",
  }),
});

// Export types inferred from schemas
export type Message = z.infer<typeof MessageSchema>;
export type CreateMessageRequest = z.infer<typeof CreateMessageSchema>;
export type GetMessagesQuery = z.infer<typeof GetMessagesQuerySchema>;
export type MessagesListResponse = z.infer<typeof MessagesListResponseSchema>;
