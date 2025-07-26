import type { Request, Response } from "express";
import express from "express";
import {
  asyncHandler,
  validateBody,
  validateObjectId,
  validateQuery,
} from "./middleware.js";
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  type ListUsersQueryInput,
} from "./schemas.js";
import type { CreateUserRequest, UpdateUserRequest } from "./types.js";
import * as userService from "./userService.js";

const router = express.Router();

// GET /users - List users with optional filtering and pagination
router.get(
  "/",
  validateQuery(ListUsersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, email, name, authProvider, status, includeDeleted } =
      res.locals.validatedQuery as ListUsersQueryInput;

    const filters = { email, name, authProvider, status, includeDeleted };
    const pagination = { page, limit };

    const result = await userService.listUsers(filters, pagination);
    res.json(result);
  }),
);

// GET /users/stats - Get user statistics
router.get(
  "/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await userService.getUserStats();
    res.json(stats);
  }),
);

// GET /users/:id - Get user by ID
router.get(
  "/:id",
  validateObjectId(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(res.locals.validatedId);

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

// POST /users - Create new user
router.post(
  "/",
  validateBody(CreateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserRequest = res.locals.validatedBody;

    // Check if user already exists
    const existingUser = await userService.userExists(userData.email);
    if (existingUser) {
      res.status(409).json({
        error: "Conflict",
        message: "User with this email already exists",
      });
      return;
    }

    const user = await userService.createUser(userData);
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

    // If email is being updated, check for conflicts
    if (updateData.email) {
      const existingUser = await userService.getUserByEmail(updateData.email);
      if (existingUser && existingUser._id?.toString() !== id) {
        res.status(409).json({
          error: "Conflict",
          message: "Another user with this email already exists",
        });
        return;
      }
    }

    const user = await userService.updateUser(id, updateData);

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
    const deleted = await userService.deleteUser(res.locals.validatedId);

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
    const user = await userService.restoreUser(res.locals.validatedId);

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
