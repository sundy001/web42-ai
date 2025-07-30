import { vi } from "vitest";
import type { AuthProvider } from "../../../auth/types";

/* eslint-disable @typescript-eslint/no-explicit-any -- Mocks require any types for flexible testing */

// Mock constants
export const VALIDATION_ERROR = "Validation failed";
export const BAD_REQUEST_ERROR = "Bad Request";
export const INTERNAL_SERVER_ERROR = "Internal Server Error";
export const INVALID_ID_FORMAT = "Invalid ID format";

// Middleware mock factory
export const createMiddlewareMocks = () => ({
  validateQuery: vi.fn(() => (req: any, res: any, next: any) => {
    // Extract and parse query params
    res.locals = res.locals || {};
    const query = req.query;

    // Parse specific fields that need type conversion
    const parsedQuery: Record<string, unknown> = {};
    if (query.page !== undefined)
      parsedQuery.page = parseInt(query.page as string, 10);
    if (query.limit !== undefined)
      parsedQuery.limit = parseInt(query.limit as string, 10);
    if (query.includeDeleted !== undefined)
      parsedQuery.includeDeleted = query.includeDeleted === "true";
    if (query.email !== undefined) parsedQuery.email = query.email;
    if (query.role !== undefined) parsedQuery.role = query.role;
    if (query.status !== undefined) parsedQuery.status = query.status;
    if (query.supabaseUserId !== undefined)
      parsedQuery.supabaseUserId = query.supabaseUserId;

    res.locals.validatedQuery = parsedQuery;
    next();
  }),

  validateBody: vi.fn(() => {
    const validateCreateUser = (body: any) => {
      const errors: { field: string }[] = [];
      if (!body.email || !/\S+@\S+\.\S+/.test(body.email))
        errors.push({ field: "email" });
      if (!body.password) errors.push({ field: "password" });
      if (!body.name) errors.push({ field: "name" });
      if (!body.role || !["admin", "user"].includes(body.role))
        errors.push({ field: "role" });
      return errors;
    };

    const validateUpdateUser = (body: any) => {
      const errors: { field: string }[] = [];
      if (body.role && !["admin", "user"].includes(body.role))
        errors.push({ field: "role" });
      if (body.status && !["active", "inactive"].includes(body.status))
        errors.push({ field: "status" });
      return errors;
    };

    return (req: any, res: any, next: any) => {
      res.locals = res.locals || {};
      const body = req.body;

      let errors: Array<{ field: string }> = [];
      if (req.method === "POST" && req.path === "/") {
        errors = validateCreateUser(body);
      } else if (req.method === "PUT") {
        errors = validateUpdateUser(body);
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: VALIDATION_ERROR,
          details: errors,
        });
      }

      res.locals.validatedBody = body;
      next();
    };
  }),

  validateObjectId: vi.fn(() => (req: any, res: any, next: any) => {
    res.locals = res.locals || {};
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        error: BAD_REQUEST_ERROR,
        message: INVALID_ID_FORMAT,
      });
    }
    res.locals.validatedId = id;
    next();
  }),

  asyncHandler: vi.fn((fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      res.status(500).json({
        error: INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    });
  }),
});

// Auth provider mock factory
export const createMockAuthProvider = (): Partial<AuthProvider> => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserById: vi.fn(),
});

// Service mocks
export const createUserServiceMocks = () => ({
  createUser: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  restoreUser: vi.fn(),
  listUsers: vi.fn(),
  userExists: vi.fn(),
});

// Module mock setup functions
export const setupMiddlewareMocks = () => {
  vi.mock("../../../../middleware", () => createMiddlewareMocks());
};

export const setupAuthProviderMocks = () => {
  vi.mock("../../../auth", () => ({
    getAuthProvider: vi.fn(),
  }));
};

export const setupUserRepositoryMocks = () => {
  vi.mock("../user.repository", () => createUserServiceMocks());
};

export const setupUserServiceMocks = () => {
  vi.mock("../user.service", () => createUserServiceMocks());
};