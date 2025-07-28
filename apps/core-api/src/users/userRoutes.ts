import type { Request, Response } from "express";
import express from "express";
import {
  authenticateUser,
  requireAdmin,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  createUserFromSupabase,
  deleteUser,
  getUserByEmail,
  getUserById,
  getUserBySupabaseId,
  getUserStats,
  listUsers,
  restoreUser,
  syncUserWithSupabase,
  updateUser,
} from "../stores/userStore";
import {
  asyncHandler,
  validateBody,
  validateObjectId,
  validateQuery,
} from "./middleware.js";
import {
  CreateUserFromSupabaseSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  type ListUsersQueryInput,
} from "./schemas.js";
import type {
  CreateUserFromSupabaseRequest,
  UpdateUserRequest,
} from "./types.js";

const router = express.Router();

// GET /users - List users with optional filtering and pagination (Admin only)
router.get(
  "/",
  authenticateUser,
  requireAdmin,
  validateQuery(ListUsersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      supabaseUserId,
      email,
      name,
      authProvider,
      status,
      includeDeleted,
    } = res.locals.validatedQuery as ListUsersQueryInput;

    const filters = {
      supabaseUserId,
      email,
      name,
      authProvider,
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
  authenticateUser,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await getUserStats();
    res.json(stats);
  }),
);

// GET /users/:id - Get user by ID (Admin only)
router.get(
  "/:id",
  authenticateUser,
  requireAdmin,
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

// POST /users - Create new user from Supabase auth
router.post(
  "/",
  validateBody(CreateUserFromSupabaseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserFromSupabaseRequest = res.locals.validatedBody;

    // Check if user already exists by supabaseUserId
    const existingUser = await getUserBySupabaseId(userData.supabaseUserId);
    if (existingUser) {
      res.status(409).json({
        error: "Conflict",
        message: "User with this Supabase ID already exists",
      });
      return;
    }

    // Check if user already exists by email
    const existingEmailUser = await getUserByEmail(userData.email);
    if (existingEmailUser) {
      res.status(409).json({
        error: "Conflict",
        message: "User with this email already exists",
      });
      return;
    }

    const user = await createUserFromSupabase(userData);
    res.status(201).json(user);
  }),
);

// GET /users/supabase/:supabaseUserId - Get user by Supabase ID
router.get(
  "/supabase/:supabaseUserId",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { supabaseUserId } = req.params;

    if (!supabaseUserId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Supabase user ID is required",
      });
      return;
    }

    // Allow users to access their own profile, or admins to access any profile
    if (req.user?.id !== supabaseUserId && req.user?.role !== "admin") {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only access your own profile",
      });
      return;
    }

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
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { supabaseUserId } = req.params;

    if (!supabaseUserId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Supabase user ID is required",
      });
      return;
    }

    // Allow users to sync their own profile, or admins to sync any profile
    if (req.user?.id !== supabaseUserId && req.user?.role !== "admin") {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only sync your own profile",
      });
      return;
    }

    const user = await syncUserWithSupabase(supabaseUserId);

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
  authenticateUser,
  requireAdmin,
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
  authenticateUser,
  requireAdmin,
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
  authenticateUser,
  requireAdmin,
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
