import { asyncHandler, validateBody } from "@/middleware";
import { UnauthorizedError } from "@/utils/errors";
import type { Request, Response } from "express";
import express from "express";
import {
  ApiRefreshTokenResponse,
  LoginInput,
  LoginResponse,
  LoginSchema,
  MeResponse,
} from "./auth.schemas";
import { loginUser, refreshUserToken, signoutUser } from "./auth.service";
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "./cookieUtils";
import { authenticateUser } from "./middleware/auth";
import type { AuthRequest } from "./types";

const router = express.Router();

// POST /auth/login - User login
router.post(
  "/login",
  validateBody(LoginSchema),
  asyncHandler(async (_req: Request, res: Response) => {
    const loginData: LoginInput = res.locals.validatedBody;

    const { user, session } = await loginUser(loginData);

    setAuthCookies(res, session);

    // Return only user data
    res.json(user satisfies LoginResponse);
  }),
);

// POST /auth/signout - User signout
router.post(
  "/signout",
  asyncHandler(async (_req: Request, res: Response) => {
    await signoutUser();
    clearAuthCookies(res);

    res.status(204).send();
  }),
);

// POST /auth/refresh - Refresh access token (web client with cookies)
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromCookies(req);

    const session = await refreshUserToken(refreshToken);
    setAuthCookies(res, session);

    res.status(204).send();
  }),
);

// POST /auth/refresh/api - Refresh tokens for API clients (returns tokens in response)
router.post(
  "/refresh/api",
  asyncHandler(async (req: Request, res: Response) => {
    // Extract refresh token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const refreshToken = authHeader.substring(7); // Remove "Bearer " prefix

    const session = await refreshUserToken(refreshToken);

    // Return tokens in response body for API clients
    res.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      token_type: session.token_type,
      expires_in: session.expires_in,
    } satisfies ApiRefreshTokenResponse);
  }),
);

// GET /auth/me - Get current authenticated user info from JWT
router.get(
  "/me",
  authenticateUser,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Return user data from JWT claims (no database call needed)
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
      role: req.user!.role,
      is_anonymous: req.user!.is_anonymous,
    } satisfies MeResponse);
  }),
);

export { router as authRoutes };
