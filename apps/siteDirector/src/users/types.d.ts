// Extend Express types to include validated data in res.locals
declare global {
  namespace Express {
    interface Locals {
      validatedId?: string;
      validatedBody?: unknown;
      validatedQuery?: unknown;
    }
  }
}

export {};
