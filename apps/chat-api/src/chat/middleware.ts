import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("API Error:", err);

  const status = err.status || 500;
  const message = err.message || "Internal server error";
  const code = err.code || "INTERNAL_ERROR";

  res.status(status).json({
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
}

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (_error) {
      const apiError: ApiError = new Error("Validation failed");
      apiError.status = 400;
      apiError.code = "VALIDATION_ERROR";
      next(apiError);
    }
  };
}
