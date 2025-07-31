import { vi } from "vitest";

import { errorHandler } from "@/middleware";
import {
  expectError,
  expectSuccess,
  expectValidationError,
  postRequest,
} from "@/testUtils/apiTestHelpers";
import { UnauthorizedError } from "@/utils/errors";
import type { Application } from "express";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import authRoutes from "../auth.routes";
import {
  createMockLoginRequest,
  createMockLoginResponse,
  createMockUser,
} from "./authTestFixtures";

const mockAuthService = vi.hoisted(() => ({
  loginUser: vi.fn(),
  signoutUser: vi.fn(),
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
    app.use("/auth", authRoutes);
    app.use(errorHandler);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /auth/login", () => {
    it("should login user successfully", async () => {
      const loginData = createMockLoginRequest();
      const mockResponse = createMockLoginResponse({
        user: createMockUser({ email: loginData.email }),
      });

      mockAuthService.loginUser.mockResolvedValue(mockResponse);

      const response = await postRequest(app, LOGIN_ENDPOINT, loginData);

      const body = expectSuccess(response);
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("session");
      expect(body.user.email).toBe(loginData.email);
      expect(body.session.access_token).toBeDefined();
      expect(body.session.refresh_token).toBeDefined();
      expect(body.session.expires_in).toBeDefined();
      expect(body.session.token_type).toBeDefined();

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
    it("should signout user successfully", async () => {
      mockAuthService.signoutUser.mockResolvedValue(undefined);

      const response = await postRequest(app, "/auth/signout", {});

      const body = expectSuccess(response);
      expect(body).toHaveProperty("message", "Successfully signed out");

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
});
