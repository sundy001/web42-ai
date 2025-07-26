import { z } from 'zod';

// User schema for database documents
export const UserSchema = z.object({
  _id: z.string().optional(),
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  authProvider: z.enum(['google', 'github', 'email']),
  status: z.enum(['active', 'inactive', 'deleted']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Create user request schema
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  authProvider: z.enum(['google', 'github', 'email']),
});

// Update user request schema
export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters').optional(),
  authProvider: z.enum(['google', 'github', 'email']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Query filters schema
export const UserFiltersSchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  authProvider: z.enum(['google', 'github', 'email']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  includeDeleted: z.boolean().optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').optional(),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must not exceed 100').optional(),
});

// MongoDB ObjectId validation
export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Query parameters schema for list endpoint
export const ListUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1, 'Page must be at least 1').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100').optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  authProvider: z.enum(['google', 'github', 'email']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  includeDeleted: z.string().transform(val => val === 'true').optional(),
});

// Export types inferred from schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type ListUsersQueryInput = z.infer<typeof ListUsersQuerySchema>;