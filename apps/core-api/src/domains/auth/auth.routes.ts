import { asyncHandler, validateBody } from "@/middleware";
import type { Request, Response } from "express";
import express from "express";
import { LoginSchema, SignoutSchema } from "./auth.schemas";
import { loginUser, signoutUser } from "./auth.service";
import type { LoginRequest } from "./types";

const router = express.Router();

// POST /auth/login - User login
router.post(
  "/login",
  validateBody(LoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const loginData: LoginRequest = res.locals.validatedBody;

    try {
      const loginResponse = await loginUser(loginData);
      res.json(loginResponse);
    } catch (error) {
      res.status(401).json({
        error: "Authentication failed",
        message: error instanceof Error ? error.message : "Invalid credentials",
      });
    }
  }),
);

// POST /auth/signout - User signout
router.post(
  "/signout",
  validateBody(SignoutSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await signoutUser();
      res.json({
        message: "Successfully signed out",
      });
    } catch {
      // Always return success for signout, even if there's an error
      res.json({
        message: "Successfully signed out",
      });
    }
  }),
);

export default router;
