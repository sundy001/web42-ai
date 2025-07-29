import { generateSchema } from "@anatine/zod-openapi";
import {
  chatSessionSchema,
  sendMessageRequestSchema,
  sendMessageResponseSchema,
} from "../chat/schemas.js";

export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Chat API",
    version: "1.0.0",
    description: "API for chat functionality in web42-ai platform",
  },
  servers: [
    {
      url: "http://localhost:3003",
      description: "Development server",
    },
  ],
  paths: {
    "/api/v1/chat/send": {
      post: {
        summary: "Send a chat message",
        description: "Send a message and receive an AI response",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: generateSchema(sendMessageRequestSchema),
            },
          },
        },
        responses: {
          "200": {
            description: "Message sent successfully",
            content: {
              "application/json": {
                schema: generateSchema(sendMessageResponseSchema),
              },
            },
          },
          "400": {
            description: "Bad request",
          },
          "500": {
            description: "Internal server error",
          },
        },
        tags: ["Chat"],
      },
    },
    "/api/v1/chat/session/{sessionId}": {
      get: {
        summary: "Get chat session",
        description: "Retrieve a specific chat session by ID",
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Chat session ID",
          },
        ],
        responses: {
          "200": {
            description: "Chat session retrieved successfully",
            content: {
              "application/json": {
                schema: generateSchema(chatSessionSchema),
              },
            },
          },
          "404": {
            description: "Session not found",
          },
        },
        tags: ["Chat"],
      },
      delete: {
        summary: "Delete chat session",
        description: "Delete a specific chat session by ID",
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Chat session ID",
          },
        ],
        responses: {
          "204": {
            description: "Session deleted successfully",
          },
          "404": {
            description: "Session not found",
          },
        },
        tags: ["Chat"],
      },
    },
    "/api/v1/chat/sessions": {
      get: {
        summary: "Get all chat sessions",
        description: "Retrieve all chat sessions",
        responses: {
          "200": {
            description: "Chat sessions retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessions: {
                      type: "array",
                      items: generateSchema(chatSessionSchema),
                    },
                    count: {
                      type: "number",
                    },
                  },
                },
              },
            },
          },
        },
        tags: ["Chat"],
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        description: "Check the health status of the API",
        responses: {
          "200": {
            description: "API is healthy",
          },
          "503": {
            description: "API is unhealthy",
          },
        },
        tags: ["Health"],
      },
    },
  },
  components: {
    schemas: {
      SendMessageRequest: generateSchema(sendMessageRequestSchema),
      SendMessageResponse: generateSchema(sendMessageResponseSchema),
      ChatSession: generateSchema(chatSessionSchema),
    },
  },
  tags: [
    {
      name: "Chat",
      description: "Chat operations",
    },
    {
      name: "Health",
      description: "Health check operations",
    },
  ],
};
