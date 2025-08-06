import { asyncHandler, validateBody } from "@/middleware";
import {
  ApiRefreshTokenResponse,
  LoginRequest,
  LoginResponse,
  LoginSchema,
  MeResponse,
  RefreshTokenRequest,
  RefreshTokenSchema,
} from "@web42-ai/types";
import type { Request, Response } from "express";
import express from "express";
import { loginUser, refreshUserToken, signoutUser } from "./auth.service";
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "./authUtils";
import { authenticateUser } from "./middleware/auth";
import type { AuthRequest } from "./types";

const router = express.Router();

// POST /auth/login - User login
router.post(
  "/login",
  validateBody(LoginSchema),
  asyncHandler(async (_req: Request, res: Response) => {
    const loginData: LoginRequest = res.locals.validatedBody;

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
  validateBody(RefreshTokenSchema),
  asyncHandler(async (_req: Request, res: Response) => {
    // Extract refresh token from validated body
    const { refresh_token }: RefreshTokenRequest = res.locals.validatedBody;

    const session = await refreshUserToken(refresh_token);

    // Return tokens in response body for API clients
    res.json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      tokenType: session.token_type,
      expiresIn: session.expires_in,
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
