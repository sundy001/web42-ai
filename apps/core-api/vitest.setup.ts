import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";

// Mock common middleware globally
vi.mock("./src/middleware", () => ({
  validateQuery: vi.fn(
    () => (req: Request, res: Response, next: NextFunction) => next(),
  ),
  validateBody: vi.fn(
    () => (req: Request, res: Response, next: NextFunction) => next(),
  ),
  validateParams: vi.fn(
    () => (req: Request, res: Response, next: NextFunction) => next(),
  ),
  validateObjectId: vi.fn(
    () => (req: Request, res: Response, next: NextFunction) => next(),
  ),
  asyncHandler: vi.fn(
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
      fn,
  ),
  errorHandler: vi.fn(
    (err: Error, req: Request, res: Response, next: NextFunction) => next(),
  ),
}));

// Mock auth middleware globally
vi.mock("./src/domains/auth/middleware/auth", () => ({
  authenticateToken: vi.fn((req: Request, res: Response, next: NextFunction) =>
    next(),
  ),
  requireRole: vi.fn(
    () => (req: Request, res: Response, next: NextFunction) => next(),
  ),
}));
