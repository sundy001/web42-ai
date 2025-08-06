import {
  asyncHandler,
  validateBody,
  validateObjectId,
  validateQuery,
} from "@/middleware";
import { PaginationOptions } from "@/utils/types";
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  User,
  type CreateUserRequest,
  type ListUsersQueryRequest,
  type UpdateUserRequest,
  type UserListResponse,
} from "@web42-ai/types";
import type { Request, Response } from "express";
import express from "express";
import type { UserFiltersRequest } from "./types";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  restoreUser,
  updateUser,
} from "./user.service";

const router = express.Router();

// GET /users - List users with optional filtering and pagination
router.get(
  "/",
  validateQuery(ListUsersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, supabaseUserId, email, role, status, includeDeleted } =
      res.locals.validatedQuery as ListUsersQueryRequest;

    const filters = {
      supabaseUserId,
      email,
      role,
      status,
      includeDeleted,
    } satisfies UserFiltersRequest;
    const pagination = { page, limit } satisfies PaginationOptions;

    const result = await listUsers(filters, pagination);

    res.json(result satisfies UserListResponse);
  }),
);

// GET /users/:id - Get user by ID
router.get(
  "/:id",
  validateObjectId(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await getUserById(res.locals.validatedId);

    res.json(user satisfies User);
  }),
);

// POST /users - Create new user (creates both Supabase and MongoDB user)
router.post(
  "/",
  validateBody(CreateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserRequest = res.locals.validatedBody;

    const user = await createUser(userData);
    res.status(201).json(user satisfies User);
  }),
);

// PUT /users/:id - Update user
router.put(
  "/:id",
  validateObjectId(),
  validateBody(UpdateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = res.locals.validatedId;
    const updateData: UpdateUserRequest = res.locals.validatedBody;

    const user = await updateUser(id, updateData);
    res.json(user satisfies User);
  }),
);

// DELETE /users/:id - Soft delete user
router.delete(
  "/:id",
  validateObjectId(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await deleteUser(res.locals.validatedId);
    res.json(user satisfies User);
  }),
);

// POST /users/:id/restore - Restore deleted user
router.post(
  "/:id/restore",
  validateObjectId(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await restoreUser(res.locals.validatedId);
    res.json(user satisfies User);
  }),
);

export { router as userRoutes };
