import express from 'express';
import type { Request, Response } from 'express';
import { ZodError, type ZodIssue } from 'zod';
import * as userService from './userService.js';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
  ObjectIdSchema,
} from './schemas.js';
import type { CreateUserRequest, UpdateUserRequest } from './types.js';

const router = express.Router();

const INTERNAL_SERVER_ERROR = 'Internal server error';
const VALIDATION_FAILED = 'Validation failed';

// Helper function to handle Zod validation errors
function handleZodError(error: ZodError, res: Response): void {
  const details = error.issues.map((err: ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  res.status(400).json({
    error: VALIDATION_FAILED,
    details,
  });
}

// GET /users - List users with optional filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const validationResult = ListUsersQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleZodError(validationResult.error, res);
      return;
    }

    const { page, limit, email, name, authProvider, status, includeDeleted } = validationResult.data;

    const filters = { email, name, authProvider, status, includeDeleted };
    const pagination = { page, limit };

    const result = await userService.listUsers(filters, pagination);
    res.json(result);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      error: INTERNAL_SERVER_ERROR,
      message: 'Failed to list users',
    });
  }
});

// GET /users/stats - Get user statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await userService.getUserStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      error: INTERNAL_SERVER_ERROR,
      message: 'Failed to get user statistics',
    });
  }
});

// GET /users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const validationResult = ObjectIdSchema.safeParse(req.params.id);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: VALIDATION_FAILED,
        message: 'Invalid ObjectId format',
      });
      return;
    }

    const user = await userService.getUserById(validationResult.data);
    
    if (!user) {
      res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: INTERNAL_SERVER_ERROR,
      message: 'Failed to get user',
    });
  }
});

// POST /users - Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = CreateUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      handleZodError(validationResult.error, res);
      return;
    }

    const userData: CreateUserRequest = validationResult.data;

    // Check if user already exists
    const existingUser = await userService.userExists(userData.email);
    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
      return;
    }

    const user = await userService.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: INTERNAL_SERVER_ERROR,
      message: 'Failed to create user',
    });
  }
});

// PUT /users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const idValidation = ObjectIdSchema.safeParse(req.params.id);
    
    if (!idValidation.success) {
      res.status(400).json({
        error: VALIDATION_FAILED,
        message: 'Invalid ObjectId format',
      });
      return;
    }

    const bodyValidation = UpdateUserSchema.safeParse(req.body);
    
    if (!bodyValidation.success) {
      handleZodError(bodyValidation.error, res);
      return;
    }

    const id = idValidation.data;
    const updateData: UpdateUserRequest = bodyValidation.data;

    // If email is being updated, check for conflicts
    if (updateData.email) {
      const existingUser = await userService.getUserByEmail(updateData.email);
      if (existingUser && existingUser._id?.toString() !== id) {
        res.status(409).json({
          error: 'Conflict',
          message: 'Another user with this email already exists',
        });
        return;
      }
    }

    const user = await userService.updateUser(id, updateData);
    
    if (!user) {
      res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: INTERNAL_SERVER_ERROR,
      message: 'Failed to update user',
    });
  }
});

// DELETE /users/:id - Soft delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const validationResult = ObjectIdSchema.safeParse(req.params.id);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: VALIDATION_FAILED,
        message: 'Invalid ObjectId format',
      });
      return;
    }

    const deleted = await userService.deleteUser(validationResult.data);
    
    if (!deleted) {
      res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: INTERNAL_SERVER_ERROR,
      message: 'Failed to delete user',
    });
  }
});

// POST /users/:id/restore - Restore deleted user
router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const validationResult = ObjectIdSchema.safeParse(req.params.id);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: VALIDATION_FAILED,
        message: 'Invalid ObjectId format',
      });
      return;
    }

    const user = await userService.restoreUser(validationResult.data);
    
    if (!user) {
      res.status(404).json({
        error: 'Not found',
        message: 'Deleted user not found',
      });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error restoring user:', error);
    res.status(500).json({
      error: INTERNAL_SERVER_ERROR,
      message: 'Failed to restore user',
    });
  }
});

export default router;