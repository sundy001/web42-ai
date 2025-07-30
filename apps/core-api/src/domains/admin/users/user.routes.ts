import {
  asyncHandler,
  validateBody,
  validateObjectId,
  validateQuery,
} from "@/middleware";
import type { Request, Response } from "express";
import express from "express";
import type { CreateUserRequest, UpdateUserRequest } from "./types";
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  type ListUsersQueryInput,
} from "./user.schemas";
import {
  createUser,
  deleteUser,
  getUserByEmail,
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
      res.locals.validatedQuery as ListUsersQueryInput;

    const filters = {
      supabaseUserId,
      email,
      role,
      status,
      includeDeleted,
    };
    const pagination = { page, limit };

    const result = await listUsers(filters, pagination);
    res.json(result);
  }),
);

// GET /users/:id - Get user by ID
router.get(
  "/:id",
  validateObjectId(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await getUserById(res.locals.validatedId);

    if (!user) {
      res.status(404).json({
        error: "Not found",
        message: "User not found",
      });
      return;
    }

    res.json(user);
  }),
);

// POST /users - Create new user (creates both Supabase and MongoDB user)
router.post(
  "/",
  validateBody(CreateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserRequest = res.locals.validatedBody;

    // Check if user already exists by email, including soft deleted users
    const existingUser = await getUserByEmail(userData.email, true);
    if (existingUser) {
      res.status(409).json({
        error: "Conflict",
        message: "User with this email already exists",
      });
      return;
    }

    const user = await createUser(userData);
    res.status(201).json(user);
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

    if (!user) {
      res.status(404).json({
        error: "Not found",
        message: "User not found",
      });
      return;
    }

    res.json(user);
  }),
);

// DELETE /users/:id - Soft delete user
router.delete(
  "/:id",
  validateObjectId(),
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await deleteUser(res.locals.validatedId);

    if (!deleted) {
      res.status(404).json({
        error: "Not found",
        message: "User not found",
      });
      return;
    }

    res.status(204).send();
  }),
);

// POST /users/:id/restore - Restore deleted user
router.post(
  "/:id/restore",
  validateObjectId(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await restoreUser(res.locals.validatedId);

    if (!user) {
      res.status(404).json({
        error: "Not found",
        message: "Deleted user not found",
      });
      return;
    }

    res.json(user);
  }),
);

export default router;
