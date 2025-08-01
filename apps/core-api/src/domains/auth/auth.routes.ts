import { asyncHandler, validateBody } from "@/middleware";
import type { Request, Response } from "express";
import express from "express";
import { LoginSchema } from "./auth.schemas";
import { loginUser, refreshUserToken, signoutUser } from "./auth.service";
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "./cookieUtils";
import type { LoginInput } from "./types";

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
    res.json({ user });
  }),
);

// POST /auth/signout - User signout
router.post(
  "/signout",
  asyncHandler(async (_req: Request, res: Response) => {
    await signoutUser();
    clearAuthCookies(res);

    res.json({
      message: "Successfully signed out",
    });
  }),
);

// POST /auth/refresh - Refresh access token
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromCookies(req);

    const session = await refreshUserToken(refreshToken);
    setAuthCookies(res, session);

    res.json({
      message: "Token refreshed successfully",
    });
  }),
);

export default router;
