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

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List all users
 *     description: Retrieve a paginated list of users with optional filtering
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email (case-insensitive partial match)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (case-insensitive partial match)
 *       - in: query
 *         name: authProvider
 *         schema:
 *           type: string
 *           enum: [google, github, email]
 *         description: Filter by authentication provider
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include deleted users in results
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their MongoDB ObjectId
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User MongoDB ObjectId
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           example: '68842630e5d48662e0313589'
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the provided information
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User with email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Conflict'
 *                 message:
 *                   type: string
 *                   example: 'User with this email already exists'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user's information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User MongoDB ObjectId
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           example: '68842630e5d48662e0313589'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Another user with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Conflict'
 *                 message:
 *                   type: string
 *                   example: 'Another user with this email already exists'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Soft delete user
 *     description: Soft delete a user by setting their status to 'deleted'
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User MongoDB ObjectId
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           example: '68842630e5d48662e0313589'
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/v1/users/{id}/restore:
 *   post:
 *     summary: Restore deleted user
 *     description: Restore a soft-deleted user by setting their status back to 'active'
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User MongoDB ObjectId
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           example: '68842630e5d48662e0313589'
 *     responses:
 *       200:
 *         description: User restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve statistics about users including counts by status and auth provider
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStats'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

export default router;