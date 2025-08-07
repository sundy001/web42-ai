import { authenticateUser } from "@/domains/auth/middleware/auth";
import type { AuthRequest } from "@/domains/auth/types";
import { asyncHandler, validateQuery } from "@/middleware";
import { GetMessagesQuerySchema, type GetMessagesQuery } from "@web42-ai/types";
import type { Response } from "express";
import { Router } from "express";
import * as messageService from "./message.service";

const router = Router();

/**
 * GET /api/v1/messages
 * Get messages for a project (requires authentication and project ownership)
 */
router.get(
  "/",
  authenticateUser,
  validateQuery(GetMessagesQuerySchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get validated query parameters from res.locals
    const { projectId, timestamp, limit } = res.locals
      .validatedQuery as GetMessagesQuery;

    // Get messages with ownership verification
    const messages = await messageService.getMessagesForUser(
      req.user!.id,
      projectId,
      timestamp,
      limit,
    );

    res.json({
      messages,
      hasMore: messages.length === (limit || 20),
    });
  }),
);

export default router;
