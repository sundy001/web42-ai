import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  isUser: z.boolean(),
  timestamp: z.date(),
});

export const chatSessionSchema = z.object({
  id: z.string(),
  messages: z.array(messageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const sendMessageRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  sessionId: z.string().optional(),
});

export const sendMessageResponseSchema = z.object({
  sessionId: z.string(),
  userMessage: messageSchema,
  aiMessage: messageSchema,
});
