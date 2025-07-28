import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { validateRequest } from "./middleware.js";
import { sendMessageRequestSchema } from "./schemas.js";
import type {
  ChatSession,
  Message,
  SendMessageRequest,
  SendMessageResponse,
} from "./types.js";

export const chatRoutes = Router();

// In-memory storage for chat sessions (replace with database in production)
const chatSessions = new Map<string, ChatSession>();

// Simulate AI response generation
function generateAIResponse(userMessage: string): string {
  const responses = [
    "That's an interesting idea! Let me help you build that.",
    "Great concept! I can help you create that website.",
    "I understand what you're looking for. Let me work on that for you.",
    "Excellent! I'll start working on your website right away.",
    "Perfect! I can definitely help you build something like that.",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// POST /api/v1/chat/send - Send a message and get AI response
chatRoutes.post(
  "/send",
  validateRequest(sendMessageRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, sessionId }: SendMessageRequest = req.body;

      // Get or create session
      let session: ChatSession;
      const finalSessionId = sessionId || uuidv4();

      if (sessionId && chatSessions.has(sessionId)) {
        session = chatSessions.get(sessionId)!;
      } else {
        session = {
          id: finalSessionId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        chatSessions.set(finalSessionId, session);
      }

      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        content: message,
        isUser: true,
        timestamp: new Date(),
      };

      // Generate AI response
      const aiResponse = generateAIResponse(message);
      const aiMessage: Message = {
        id: uuidv4(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      // Add messages to session
      session.messages.push(userMessage, aiMessage);
      session.updatedAt = new Date();

      const response: SendMessageResponse = {
        sessionId: finalSessionId,
        userMessage,
        aiMessage,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/chat/session/:sessionId - Get chat session
chatRoutes.get(
  "/session/:sessionId",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      if (!chatSessions.has(sessionId)) {
        return res.status(404).json({
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Chat session not found",
            timestamp: new Date().toISOString(),
          },
        });
      }

      const session = chatSessions.get(sessionId)!;
      res.json(session);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/chat/sessions - Get all chat sessions
chatRoutes.get("/sessions", (req: Request, res: Response) => {
  const sessions = Array.from(chatSessions.values());
  res.json({
    sessions,
    count: sessions.length,
  });
});

// DELETE /api/v1/chat/session/:sessionId - Delete chat session
chatRoutes.delete("/session/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!chatSessions.has(sessionId)) {
    return res.status(404).json({
      error: {
        code: "SESSION_NOT_FOUND",
        message: "Chat session not found",
        timestamp: new Date().toISOString(),
      },
    });
  }

  chatSessions.delete(sessionId);
  res.status(204).send();
});
