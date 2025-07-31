import { authLogger } from "@/config/logger";
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
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const { data, error } = await supabaseClient.auth.getClaims(token);

    if (error || !data) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
      return;
    }

    // Extract user info from JWT claims
    req.user = {
      id: data.claims.sub,
      email: data.claims.email,
      role: data.claims.app_metadata?.role,
    };

    next();
  } catch (error) {
    authLogger.error({ err: error }, "Authentication failed");
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
