import type { Request, Response } from "express";
import express from "express";
import {
  asyncHandler,
  validateBody,
  validateObjectId,
  validateQuery,
} from "../../../middleware";
import { type AuthenticatedRequest } from "../../auth";
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
  getUserBySupabaseId,
  getUserStats,
  listUsers,
  restoreUser,
  syncUserWithAuthProvider,
  updateUser,
} from "./user.service";

const router = express.Router();

// GET /users - List users with optional filtering and pagination (Admin only)
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

// GET /users/stats - Get user statistics (Admin only)
router.get(
  "/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await getUserStats();
    res.json(stats);
  }),
);

// GET /users/:id - Get user by ID (Admin only)
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

    // Check if user already exists by email
    const existingUser = await getUserByEmail(userData.email);
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

// GET /users/supabase/:supabaseUserId - Get user by Supabase ID
router.get(
  "/supabase/:supabaseUserId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { supabaseUserId } = req.params;

    if (!supabaseUserId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Supabase user ID is required",
      });
      return;
    }

    // Admin can access any user profile

    const user = await getUserBySupabaseId(supabaseUserId);

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

// POST /users/sync/:supabaseUserId - Sync user with Supabase
router.post(
  "/sync/:supabaseUserId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { supabaseUserId } = req.params;

    if (!supabaseUserId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Supabase user ID is required",
      });
      return;
    }

    // Admin can sync any user profile

    const user = await syncUserWithAuthProvider(supabaseUserId);

    if (!user) {
      res.status(404).json({
        error: "Not found",
        message: "User not found in Supabase",
      });
      return;
    }

    res.json(user);
  }),
);

// PUT /users/:id - Update user (Admin only)
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

// DELETE /users/:id - Soft delete user (Admin only)
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

// POST /users/:id/restore - Restore deleted user (Admin only)
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
