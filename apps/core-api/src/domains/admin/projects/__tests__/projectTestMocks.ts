import { vi } from "vitest";

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
    if (query.userId !== undefined) parsedQuery.userId = query.userId;
    if (query.name !== undefined) parsedQuery.name = query.name;
    if (query.status !== undefined) parsedQuery.status = query.status;

    res.locals.validatedQuery = parsedQuery;
    next();
  }),

  validateBody: vi.fn(() => {
    const validateCreateProject = (body: any) => {
      const errors: { field: string }[] = [];
      if (!body.userId) errors.push({ field: "userId" });
      if (!body.name || body.name.trim() === "") errors.push({ field: "name" });
      if (!body.activeDeploymentId)
        errors.push({ field: "activeDeploymentId" });
      if (!Array.isArray(body.versions)) errors.push({ field: "versions" });
      if (body.status && !["active"].includes(body.status))
        errors.push({ field: "status" });
      return errors;
    };

    return (req: any, res: any, next: any) => {
      res.locals = res.locals || {};
      const body = req.body;

      let errors: Array<{ field: string }> = [];
      if (req.method === "POST" && req.path === "/") {
        errors = validateCreateProject(body);
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

// Setup middleware mocks
export function setupMiddlewareMocks() {
  const mocks = createMiddlewareMocks();

  vi.doMock("../../../middleware", () => ({
    validateQuery: mocks.validateQuery,
    validateBody: mocks.validateBody,
    validateObjectId: mocks.validateObjectId,
    asyncHandler: mocks.asyncHandler,
  }));
}

// Setup project service mocks
export function setupProjectServiceMocks() {
  vi.doMock("../project.service", () => ({
    createProject: vi.fn(),
    getProjectById: vi.fn(),
    deleteProject: vi.fn(),
    listProjects: vi.fn(),
  }));
}
