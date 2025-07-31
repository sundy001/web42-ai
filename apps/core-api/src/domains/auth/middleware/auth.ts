import { authLogger } from "@/config/logger";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";
import type { NextFunction, Response } from "express";
import { supabaseClient } from "../providers/supabase";
import type { AuthRequest } from "../types";

/**
 * Middleware to verify Supabase JWT tokens locally without API calls
 * Uses getClaims() for better performance and reduced bandwidth usage
 */
export async function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Always same message to prevent information disclosure
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const { data, error } = await supabaseClient.auth.getClaims(token);

    if (error || !data) {
      // Always same message to prevent information disclosure
      throw new UnauthorizedError("Invalid credentials");
    }

    // Extract user info from JWT claims
    req.user = {
      id: data.claims.sub,
      email: data.claims.email,
      role: data.claims.app_metadata?.role,
    };

    next();
  } catch (error) {
    // Log the actual error for debugging
    authLogger.error({ err: error }, "Authentication failed");

    // Re-throw if it's already an UnauthorizedError (from our checks above)
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    // For unexpected errors, still throw UnauthorizedError to prevent info disclosure
    throw new UnauthorizedError("Invalid credentials", {
      cause: error as Error,
    });
  }
}

/**
 * Middleware to optionally authenticate user (doesn't fail if no token)
 */
export async function optionalAuthentication(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Try to verify the token locally using getClaims()
    const { data: claims, error } = await supabaseClient.auth.getClaims(token);

    if (!error && claims) {
      req.user = {
        id: claims.claims.sub,
        email: claims.claims.email,
        role: claims.claims.app_metadata?.role,
      };
    }

    next();
  } catch (error) {
    authLogger.warn({ err: error }, "Optional authentication error");
    // Continue without authentication on error
    next();
  }
}

/**
 * Middleware to check if user is an admin
 */
export function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (req.user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }

  next();
}
