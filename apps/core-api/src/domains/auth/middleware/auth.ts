import logger, { authLogger } from "@/config/logger";
import { asyncHandler } from "@/middleware";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";
import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIES } from "../cookieUtils";
import { supabaseClient } from "../providers/supabase";
import type { AuthRequest } from "../types";

/**
 * Internal async function for user authentication logic
 */
async function _authenticateUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = (req as Request).cookies?.[AUTH_COOKIES.ACCESS_TOKEN];

    if (!token) {
      // Always same message to prevent information disclosure
      throw new UnauthorizedError("Invalid credentials");
    }

    const { data, error } = await supabaseClient.auth.getClaims(token);
    logger.debug(data);

    if (error || !data) {
      // Always same message to prevent information disclosure
      throw new UnauthorizedError("Invalid credentials");
    }

    // Extract user info from JWT claims
    req.user = {
      id: data.claims.sub,
      email: data.claims.email,
      name: data.claims.user_metadata.name,
      role: data.claims.app_metadata.role,
      is_anonymous: data.claims.is_anonymous,
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
 * Middleware to verify Supabase JWT tokens from cookies
 * Uses getClaims() for better performance and reduced bandwidth usage
 * Wrapped with asyncHandler to ensure errors are properly caught by Express error handler
 */
export const authenticateUser = asyncHandler(_authenticateUser);

/**
 * Internal async function for optional authentication logic
 */
async function _optionalAuthentication(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = (req as Request).cookies?.[AUTH_COOKIES.ACCESS_TOKEN];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Try to verify the token locally using getClaims()
    const { data: claims, error } = await supabaseClient.auth.getClaims(token);

    if (!error && claims) {
      req.user = {
        id: claims.claims.sub,
        email: claims.claims.email,
        name: claims.claims.user_metadata.name,
        role: claims.claims.app_metadata.role,
        is_anonymous: claims.claims.is_anonymous,
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
 * Middleware to optionally authenticate user (doesn't fail if no token)
 * Wrapped with asyncHandler to ensure any unexpected errors are properly handled
 */
export const optionalAuthentication = asyncHandler(_optionalAuthentication);

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
