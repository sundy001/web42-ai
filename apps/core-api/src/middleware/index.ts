import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodIssue, type ZodSchema } from "zod";
import { ObjectIdSchema } from "../domains/users";

const INTERNAL_SERVER_ERROR = "Internal server error";
const VALIDATION_FAILED = "Validation failed";

// Helper function to handle Zod validation errors
function handleZodError(error: ZodError, res: Response): void {
  const details = error.issues.map((err: ZodIssue) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  res.status(400).json({
    error: VALIDATION_FAILED,
    details,
  });
}

// Middleware to validate ObjectId parameter
export function validateObjectId(paramName = "id") {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line security/detect-object-injection -- Safe: paramName is controlled by function parameter
    const id = req.params[paramName];
    const validationResult = ObjectIdSchema.safeParse(id);

    if (!validationResult.success) {
      res.status(400).json({
        error: VALIDATION_FAILED,
        message: "Invalid ObjectId format",
      });
      return;
    }

    // Store validated ID in res.locals for use in route handlers
    res.locals.validatedId = validationResult.data;
    next();
  };
}

// Middleware to validate request body with a Zod schema
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      handleZodError(validationResult.error, res);
      return;
    }

    // Store validated data in res.locals for use in route handlers
    res.locals.validatedBody = validationResult.data;
    next();
  };
}

// Middleware to validate query parameters with a Zod schema
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationResult = schema.safeParse(req.query);

    if (!validationResult.success) {
      handleZodError(validationResult.error, res);
      return;
    }

    // Store validated data in res.locals for use in route handlers
    res.locals.validatedQuery = validationResult.data;
    next();
  };
}

// Middleware to handle async route errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

// Global error handler middleware
export function errorHandler(error: Error, req: Request, res: Response) {
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);

  res.status(500).json({
    error: INTERNAL_SERVER_ERROR,
    message: "Something went wrong",
    timestamp: new Date().toISOString(),
  });
}
