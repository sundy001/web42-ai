import { config } from "@/config";
import { UnauthorizedError } from "@/utils/errors";
import type { Request, Response } from "express";
import type { AuthSession } from "./types";

// Cookie names as constants
export const AUTH_COOKIES = {
  ACCESS_TOKEN: "web42_access_token",
  REFRESH_TOKEN: "web42_refresh_token",
} as const;

// Standard authentication cookie options
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.server.isProduction,
  sameSite: config.server.isProduction ? "strict" : "lax",
  path: "/",
  domain: config.auth.cookie.domain,
} as const;

export const setAuthCookies = (res: Response, session: AuthSession): void => {
  res.cookie(AUTH_COOKIES.ACCESS_TOKEN, session.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: config.auth.cookie.accessTokenExpiryMs,
  });

  res.cookie(AUTH_COOKIES.REFRESH_TOKEN, session.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: config.auth.cookie.refreshTokenExpiryMs,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(AUTH_COOKIES.ACCESS_TOKEN, AUTH_COOKIE_OPTIONS);
  res.clearCookie(AUTH_COOKIES.REFRESH_TOKEN, AUTH_COOKIE_OPTIONS);
};

export const getRefreshTokenFromCookies = (req: Request): string => {
  const refreshToken = req.cookies?.[AUTH_COOKIES.REFRESH_TOKEN];

  if (!refreshToken) {
    throw new UnauthorizedError("Invalid credentials");
  }

  return refreshToken;
};

export const getAccessToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback to cookie if header not present
  const cookieToken = req.cookies?.[AUTH_COOKIES.ACCESS_TOKEN];
  return cookieToken;
};
