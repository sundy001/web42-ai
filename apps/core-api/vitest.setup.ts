import { vi } from "vitest";

// Mock common middleware globally
vi.mock("./src/middleware", () => ({
  validateQuery: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateBody: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateParams: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateObjectId: vi.fn(() => (req: any, res: any, next: any) => next()),
  asyncHandler: vi.fn((fn: any) => fn),
  errorHandler: vi.fn((err: any, req: any, res: any, next: any) => next()),
}));

// Mock auth middleware globally
vi.mock("./src/domains/auth/middleware/auth", () => ({
  authenticateToken: vi.fn((req: any, res: any, next: any) => next()),
  requireRole: vi.fn(() => (req: any, res: any, next: any) => next()),
}));
