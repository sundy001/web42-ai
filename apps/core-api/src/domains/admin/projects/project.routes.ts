import {
  asyncHandler,
  validateBody,
  validateObjectId,
  validateQuery,
} from "@/middleware";
import type { Request, Response } from "express";
import express from "express";
import {
  CreateProjectSchema,
  ListProjectsQuerySchema,
  type ListProjectsQueryInput,
} from "./project.schemas";
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
} from "./project.service";
import type { CreateProjectRequest } from "./types";

const router = express.Router();

// GET /projects - List projects with optional filtering and pagination (Admin only)
router.get(
  "/",
  validateQuery(ListProjectsQuerySchema),
  asyncHandler(async (_req: Request, res: Response) => {
    const { page, limit, userId, name, status, includeDeleted } = res.locals
      .validatedQuery as ListProjectsQueryInput;

    const filters = {
      userId,
      name,
      status,
      includeDeleted,
    };
    const pagination = { page, limit };

    const result = await listProjects(filters, pagination);
    res.json(result);
  }),
);

// GET /projects/:id - Get project by ID (Admin only)
router.get(
  "/:id",
  validateObjectId(),
  asyncHandler(async (_req: Request, res: Response) => {
    const project = await getProjectById(res.locals.validatedId);

    if (!project) {
      res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
      return;
    }

    res.json(project);
  }),
);

// POST /projects - Create new project (Admin only)
router.post(
  "/",
  validateBody(CreateProjectSchema),
  asyncHandler(async (_req: Request, res: Response) => {
    const projectData: CreateProjectRequest = res.locals.validatedBody;

    const project = await createProject(projectData);
    res.status(201).json(project);
  }),
);

// DELETE /projects/:id - Soft delete project (Admin only)
router.delete(
  "/:id",
  validateObjectId(),
  asyncHandler(async (_req: Request, res: Response) => {
    const deleted = await deleteProject(res.locals.validatedId);

    if (!deleted) {
      res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
      return;
    }

    res.status(204).send();
  }),
);

export default router;
