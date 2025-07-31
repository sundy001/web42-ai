import { asyncHandler, validateBody } from "@/middleware";
import type { Request, Response } from "express";
import express from "express";
import { LoginSchema } from "./auth.schemas";
import { loginUser, signoutUser } from "./auth.service";
import type { LoginInput } from "./types";

const router = express.Router();

// POST /auth/login - User login
router.post(
  "/login",
  validateBody(LoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const loginData: LoginInput = res.locals.validatedBody;

    const loginResponse = await loginUser(loginData);
    res.json(loginResponse);
  }),
);

// POST /auth/signout - User signout
router.post(
  "/signout",
  asyncHandler(async (req: Request, res: Response) => {
    await signoutUser();
    res.json({
      message: "Successfully signed out",
    });
  }),
);

export default router;
