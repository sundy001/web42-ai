import { authenticateUser } from "@/domains/auth/middleware/auth";
import type { AuthRequest } from "@/domains/auth/types";
import { asyncHandler, validateBody } from "@/middleware";
import { CreateProjectFromPromptSchema } from "@web42-ai/types";
import { Router } from "express";
import { createProjectByPrompt } from "./project.service";

const router = Router();

/**
 * @route POST /api/v1/projects/from-prompt
 * @description Create a new project from a user prompt
 * @access Authenticated users
 */
router.post(
  "/from-prompt",
  authenticateUser,
  validateBody(CreateProjectFromPromptSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { prompt } = req.body;
    const result = await createProjectByPrompt(prompt, req);
    res.status(201).json(result);
  }),
);

export const projectRoutes = router;
