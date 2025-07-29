import type { NextFunction, Request, Response } from "express";
import { supabaseClient } from "../domains/auth";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware to verify Supabase JWT tokens
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
      return;
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
}

/**
 * Middleware to optionally authenticate user (doesn't fail if no token)
 */
export async function optionalAuthentication(
  req: AuthenticatedRequest,
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

    // Try to verify the token
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    // Continue without authentication on error
    next();
  }
}

/**
 * Middleware to check if user is an admin
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      error: "Forbidden",
      message: "Admin access required",
    });
    return;
  }

  next();
}
