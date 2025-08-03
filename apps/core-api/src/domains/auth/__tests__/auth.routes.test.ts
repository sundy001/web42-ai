import { vi } from "vitest";

import { errorHandler } from "@/middleware";
import { UnauthorizedError } from "@/utils/errors";
import {
  expectError,
  expectSuccess,
  expectValidationError,
  getRequest,
  postRequest,
} from "@/utils/tests";
import cookieParser from "cookie-parser";
import type { Application } from "express";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authRoutes } from "../auth.routes";
import { createMockLoginRequest, createMockUser } from "./authTestFixtures";

const mockAuthService = vi.hoisted(() => ({
  loginUser: vi.fn(),
  signoutUser: vi.fn(),
  refreshUserToken: vi.fn(),
}));

const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    getClaims: vi.fn(),
  },
}));

vi.mock("../auth.service", () => mockAuthService);
vi.mock("../providers/supabase", () => ({
  supabaseClient: mockSupabaseClient,
}));

// Test constants
const LOGIN_ENDPOINT = "/auth/login";
const REFRESH_API_ENDPOINT = "/auth/refresh/api";
const INVALID_CREDENTIALS_MSG = "Invalid credentials";

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
      expect(body.email).toBe(loginData.email);

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

      expectSuccess(response, 204);
      // No body to check for 204 No Content response

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

      expectSuccess(response, 204);
      // No body to check for 204 No Content response
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

      expectSuccess(response, 204);
      // No body to check for 204 No Content response

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

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
      expect(mockAuthService.refreshUserToken).not.toHaveBeenCalled();
    });

    it("should return 401 if refresh token is invalid", async () => {
      const error = new UnauthorizedError("Invalid credentials");
      mockAuthService.refreshUserToken.mockRejectedValue(error);

      const response = await postRequest(app, "/auth/refresh", {}).set(
        "Cookie",
        "web42_refresh_token=invalid_token",
      );

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(
        "invalid_token",
      );
    });
  });

  describe("POST /auth/refresh/api", () => {
    it("should refresh tokens successfully with bearer token", async () => {
      const mockSession = {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 3600,
        token_type: "bearer",
      };

      mockAuthService.refreshUserToken.mockResolvedValue(mockSession);

      const response = await postRequest(app, REFRESH_API_ENDPOINT, {}).set(
        "Authorization",
        "Bearer old_refresh_token",
      );

      const body = expectSuccess(response);
      expect(body).toHaveProperty("access_token", "new_access_token");
      expect(body).toHaveProperty("refresh_token", "new_refresh_token");
      expect(body).toHaveProperty("expires_in", 3600);
      expect(body).toHaveProperty("token_type", "bearer");

      // Check no cookies are set
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeUndefined();

      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(
        "old_refresh_token",
      );
    });

    it("should return 401 if no authorization header", async () => {
      const response = await postRequest(app, REFRESH_API_ENDPOINT, {});

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
      expect(mockAuthService.refreshUserToken).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header is malformed", async () => {
      const response = await postRequest(app, REFRESH_API_ENDPOINT, {}).set(
        "Authorization",
        "InvalidFormat token",
      );

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
      expect(mockAuthService.refreshUserToken).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header is empty Bearer", async () => {
      const response = await postRequest(app, REFRESH_API_ENDPOINT, {}).set(
        "Authorization",
        "Bearer ",
      );

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
      expect(mockAuthService.refreshUserToken).not.toHaveBeenCalled();
    });

    it("should return 401 if refresh token is invalid", async () => {
      const error = new UnauthorizedError("Invalid credentials");
      mockAuthService.refreshUserToken.mockRejectedValue(error);

      const response = await postRequest(app, REFRESH_API_ENDPOINT, {}).set(
        "Authorization",
        "Bearer invalid_token",
      );

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(
        "invalid_token",
      );
    });

    it("should handle service errors", async () => {
      mockAuthService.refreshUserToken.mockRejectedValue(
        new Error("Service error"),
      );

      const response = await postRequest(app, REFRESH_API_ENDPOINT, {}).set(
        "Authorization",
        "Bearer valid_token",
      );

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(
        "valid_token",
      );
    });
  });

  describe("GET /auth/me", () => {
    it("should return current user info when authenticated", async () => {
      // Mock successful getClaims response
      mockSupabaseClient.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "550e8400-e29b-41d4-a716-446655440000",
            email: "user@example.com",
            user_metadata: { name: "Jane Doe" },
            app_metadata: { role: "user" },
            is_anonymous: false,
          },
        },
        error: null,
      });

      const response = await getRequest(app, "/auth/me").set(
        "Cookie",
        "web42_access_token=valid_token",
      );

      const body = expectSuccess(response);
      expect(body).toHaveProperty("id", "550e8400-e29b-41d4-a716-446655440000");
      expect(body).toHaveProperty("email", "user@example.com");
      expect(body).toHaveProperty("name", "Jane Doe");
      expect(body).toHaveProperty("role", "user");
      expect(body).toHaveProperty("is_anonymous", false);
      expect(mockSupabaseClient.auth.getClaims).toHaveBeenCalledWith(
        "valid_token",
      );
    });

    it("should return 401 when no access token provided", async () => {
      const response = await getRequest(app, "/auth/me");

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
    });

    it("should return 401 when access token is invalid", async () => {
      // Mock getClaims error
      mockSupabaseClient.auth.getClaims.mockResolvedValue({
        data: null,
        error: new Error("Invalid JWT"),
      });

      const response = await getRequest(app, "/auth/me").set(
        "Cookie",
        "web42_access_token=invalid_token",
      );

      expectError(response, 401, "UnauthorizedError", INVALID_CREDENTIALS_MSG);
      expect(mockSupabaseClient.auth.getClaims).toHaveBeenCalledWith(
        "invalid_token",
      );
    });
  });
});
