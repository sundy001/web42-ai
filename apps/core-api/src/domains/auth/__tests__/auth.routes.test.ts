import { vi } from "vitest";

import { errorHandler } from "@/middleware";
import {
  expectError,
  expectSuccess,
  expectValidationError,
  postRequest,
} from "@/testUtils/apiTestHelpers";
import { UnauthorizedError } from "@/utils/errors";
import cookieParser from "cookie-parser";
import type { Application } from "express";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import authRoutes from "../auth.routes";
import { createMockLoginRequest, createMockUser } from "./authTestFixtures";

const mockAuthService = vi.hoisted(() => ({
  loginUser: vi.fn(),
  signoutUser: vi.fn(),
  refreshUserToken: vi.fn(),
}));

vi.mock("../auth.service", () => mockAuthService);

// Test constants
const LOGIN_ENDPOINT = "/auth/login";

describe("Auth Routes Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    // Create fresh app instance
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/auth", authRoutes);
    app.use(errorHandler);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /auth/login", () => {
    it("should login user successfully and set cookies", async () => {
      const loginData = createMockLoginRequest();
      const mockUser = createMockUser({ email: loginData.email });
      const mockSession = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        expires_in: 3600,
        token_type: "bearer",
      };

      mockAuthService.loginUser.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const response = await postRequest(app, LOGIN_ENDPOINT, loginData);

      const body = expectSuccess(response);
      expect(body).toHaveProperty("user");
      expect(body).not.toHaveProperty("session");
      expect(body.user.email).toBe(loginData.email);

      // Check cookies are set
      const cookies = response.headers["set-cookie"] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies).toBeInstanceOf(Array);

      const accessTokenCookie = cookies.find((c) =>
        c.startsWith("web42_access_token="),
      );
      const refreshTokenCookie = cookies.find((c) =>
        c.startsWith("web42_refresh_token="),
      );

      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain("HttpOnly");
      expect(accessTokenCookie).toContain("SameSite=Strict");

      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain("HttpOnly");
      expect(refreshTokenCookie).toContain("SameSite=Strict");

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginData);
    });

    it("should return 401 for invalid credentials", async () => {
      const loginData = createMockLoginRequest({
        email: "invalid@example.com",
        password: "wrongpassword",
      });

      const error = new UnauthorizedError("INVALID CREDENTIALS");
      mockAuthService.loginUser.mockRejectedValue(error);

      const response = await postRequest(app, LOGIN_ENDPOINT, loginData);

      expectError(response, 401, "UnauthorizedError", "INVALID CREDENTIALS");
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginData);
    });

    it("should return 500 for service layer errors", async () => {
      const loginData = createMockLoginRequest();
      mockAuthService.loginUser.mockRejectedValue(
        new Error("Service layer error"),
      );

      const response = await postRequest(app, LOGIN_ENDPOINT, loginData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginData);
    });

    it("should return validation error for missing email", async () => {
      const invalidData = {
        password: "password123",
        // missing email
      };

      const response = await postRequest(app, LOGIN_ENDPOINT, invalidData);

      expectValidationError(response, ["email"]);
      expect(mockAuthService.loginUser).not.toHaveBeenCalled();
    });

    it("should return validation error for missing password", async () => {
      const invalidData = {
        email: "test@example.com",
        // missing password
      };

      const response = await postRequest(app, LOGIN_ENDPOINT, invalidData);

      expectValidationError(response, ["password"]);
      expect(mockAuthService.loginUser).not.toHaveBeenCalled();
    });

    it("should return validation error for invalid email format", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      const response = await postRequest(app, LOGIN_ENDPOINT, invalidData);

      expectValidationError(response, ["email"]);
      expect(mockAuthService.loginUser).not.toHaveBeenCalled();
    });

    it("should return validation error for empty password", async () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const response = await postRequest(app, LOGIN_ENDPOINT, invalidData);

      expectValidationError(response, ["password"]);
      expect(mockAuthService.loginUser).not.toHaveBeenCalled();
    });
  });

  describe("POST /auth/signout", () => {
    it("should signout user successfully and clear cookies", async () => {
      mockAuthService.signoutUser.mockResolvedValue(undefined);

      const response = await postRequest(app, "/auth/signout", {});

      const body = expectSuccess(response);
      expect(body).toHaveProperty("message", "Successfully signed out");

      // Check cookies are cleared
      const cookies = response.headers["set-cookie"] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies).toBeInstanceOf(Array);

      const accessTokenCookie = cookies.find((c) =>
        c.startsWith("web42_access_token="),
      );
      const refreshTokenCookie = cookies.find((c) =>
        c.startsWith("web42_refresh_token="),
      );

      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain(
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      );

      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain(
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      );

      expect(mockAuthService.signoutUser).toHaveBeenCalledWith();
    });

    it("should return success even if signout service fails", async () => {
      // Service layer handles errors internally and doesn't throw
      mockAuthService.signoutUser.mockResolvedValue(undefined);

      const response = await postRequest(app, "/auth/signout", {});

      const body = expectSuccess(response);
      expect(body).toHaveProperty("message", "Successfully signed out");
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh token successfully", async () => {
      const mockSession = {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 3600,
        token_type: "bearer",
      };

      mockAuthService.refreshUserToken.mockResolvedValue(mockSession);

      const response = await postRequest(app, "/auth/refresh", {}).set(
        "Cookie",
        "web42_refresh_token=old_refresh_token",
      );

      const body = expectSuccess(response);
      expect(body).toHaveProperty("message", "Token refreshed successfully");

      // Check new cookies are set
      const cookies = response.headers["set-cookie"] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies).toBeInstanceOf(Array);

      const accessTokenCookie = cookies.find((c) =>
        c.startsWith("web42_access_token="),
      );
      const refreshTokenCookie = cookies.find((c) =>
        c.startsWith("web42_refresh_token="),
      );

      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain("new_access_token");

      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain("new_refresh_token");

      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(
        "old_refresh_token",
      );
    });

    it("should return 401 if no refresh token cookie", async () => {
      const response = await postRequest(app, "/auth/refresh", {});

      expectError(response, 401, "UnauthorizedError", "Invalid credentials");
      expect(mockAuthService.refreshUserToken).not.toHaveBeenCalled();
    });

    it("should return 401 if refresh token is invalid", async () => {
      const error = new UnauthorizedError("Invalid credentials");
      mockAuthService.refreshUserToken.mockRejectedValue(error);

      const response = await postRequest(app, "/auth/refresh", {}).set(
        "Cookie",
        "web42_refresh_token=invalid_token",
      );

      expectError(response, 401, "UnauthorizedError", "Invalid credentials");
      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(
        "invalid_token",
      );
    });
  });
});
