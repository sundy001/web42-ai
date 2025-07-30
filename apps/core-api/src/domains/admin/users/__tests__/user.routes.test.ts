import type { Application } from "express";
import express from "express";
import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteRequest,
  expectCombinedUserStructure,
  expectError,
  expectPaginatedResponse,
  expectSuccess,
  expectValidationError,
  getRequest,
  postRequest,
  putRequest,
} from "../../../../testUtils/apiTestHelpers";
import type { AuthProvider } from "../../../auth/types";
import {
  createMockCombinedUser,
  createMockCreateUserRequest,
  createMockUpdateUserRequest,
  createMockUserListResponse,
} from "./userTestFixtures";
import {
  BAD_REQUEST_ERROR,
  INVALID_ID_FORMAT,
  setupAuthProviderMocks,
  setupMiddlewareMocks,
  setupUserRepositoryMocks,
  setupUserServiceMocks,
} from "./userTestMocks";

// Setup mocks
setupMiddlewareMocks();
setupAuthProviderMocks();
setupUserRepositoryMocks();
setupUserServiceMocks();

import { getAuthProvider } from "../../../auth";
import userRoutes from "../user.routes";
import * as userService from "../user.service";

// Type the mocked modules
const mockGetAuthProvider = vi.mocked(getAuthProvider);
const mockUserService = vi.mocked(userService);

describe("User Routes Integration Tests", () => {
  let app: Application;
  let mockAuthProvider: Partial<AuthProvider>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create fresh app instance
    app = express();
    app.use(express.json());
    app.use("/users", userRoutes);

    // Set up mock auth provider
    mockAuthProvider = {
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      getUserById: vi.fn(),
    };
    mockGetAuthProvider.mockReturnValue(mockAuthProvider as AuthProvider);
  });

  describe("GET /users", () => {
    it("should list users with default pagination", async () => {
      const mockUsers = [
        createMockCombinedUser(),
        createMockCombinedUser({ email: "user2@example.com" }),
      ];
      const mockResponse = createMockUserListResponse(mockUsers, {
        total: 2,
        totalPages: 1,
      });

      mockUserService.listUsers.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/users");

      expectPaginatedResponse(response, 1, 10);
      expect(mockUserService.listUsers).toHaveBeenCalledWith({}, {});

      const body = response.body;
      expect(body.users).toHaveLength(2);
      body.users.forEach(expectCombinedUserStructure);
    });

    it("should list users with custom pagination", async () => {
      const mockUsers = [createMockCombinedUser()];
      const mockResponse = createMockUserListResponse(mockUsers, {
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      });

      mockUserService.listUsers.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/users?page=2&limit=5");

      expectPaginatedResponse(response, 2, 5);
      expect(mockUserService.listUsers).toHaveBeenCalledWith(
        {},
        { page: 2, limit: 5 },
      );
    });

    it("should filter users by email", async () => {
      const mockUsers = [
        createMockCombinedUser({ email: "specific@example.com" }),
      ];
      const mockResponse = createMockUserListResponse(mockUsers);

      mockUserService.listUsers.mockResolvedValue(mockResponse);

      const response = await getRequest(
        app,
        "/users?email=specific@example.com",
      );

      expectPaginatedResponse(response, 1, 10);
      expect(mockUserService.listUsers).toHaveBeenCalledWith(
        { email: "specific@example.com" },
        {},
      );
    });

    it("should filter users by role and status", async () => {
      const mockUsers = [
        createMockCombinedUser({ role: "admin", status: "inactive" }),
      ];
      const mockResponse = createMockUserListResponse(mockUsers);

      mockUserService.listUsers.mockResolvedValue(mockResponse);

      const response = await getRequest(
        app,
        "/users?role=admin&status=inactive",
      );

      expectPaginatedResponse(response, 1, 10);
      expect(mockUserService.listUsers).toHaveBeenCalledWith(
        { role: "admin", status: "inactive" },
        {},
      );
    });

    it("should include deleted users when requested", async () => {
      const mockUsers = [createMockCombinedUser({ status: "deleted" })];
      const mockResponse = createMockUserListResponse(mockUsers);

      mockUserService.listUsers.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/users?includeDeleted=true");

      expectPaginatedResponse(response, 1, 10);
      expect(mockUserService.listUsers).toHaveBeenCalledWith(
        { includeDeleted: true },
        {},
      );
    });
  });

  describe("GET /users/:id", () => {
    it("should get user by valid ID", async () => {
      const mockUser = createMockCombinedUser();
      const userId = mockUser._id!.toString();

      mockUserService.getUserById.mockResolvedValue(mockUser);

      const response = await getRequest(app, `/users/${userId}`);

      const body = expectSuccess(response);
      expectCombinedUserStructure(body);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent user", async () => {
      const userId = new ObjectId().toString();
      mockUserService.getUserById.mockResolvedValue(null);

      const response = await getRequest(app, `/users/${userId}`);

      expectError(response, 404, "Not found", "User not found");
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await getRequest(app, "/users/invalid-id");

      expectError(response, 400, BAD_REQUEST_ERROR, INVALID_ID_FORMAT);
    });
  });

  describe("POST /users", () => {
    it("should create new user successfully", async () => {
      const createUserData = createMockCreateUserRequest();

      const mockCreatedUser = createMockCombinedUser({
        email: createUserData.email,
        name: createUserData.name,
        role: createUserData.role,
      });

      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockCreatedUser);

      const response = await postRequest(app, "/users", createUserData);

      const body = expectSuccess(response, 201);
      expectCombinedUserStructure(body);
      expect(body.email).toBe(createUserData.email);
      expect(body.name).toBe(createUserData.name);
      expect(body.role).toBe(createUserData.role);

      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
        createUserData.email,
        true,
      );
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserData);
    });

    it("should return 409 for duplicate email", async () => {
      const createUserData = createMockCreateUserRequest({
        email: "existing@example.com",
      });

      const existingUser = createMockCombinedUser({
        email: createUserData.email,
      });
      mockUserService.getUserByEmail.mockResolvedValue(existingUser);

      const response = await postRequest(app, "/users", createUserData);

      expectError(
        response,
        409,
        "Conflict",
        "User with this email already exists",
      );
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
        createUserData.email,
        true,
      );
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it("should return validation error for missing required fields", async () => {
      const invalidData = {
        email: "invalid-email",
        // missing password, name, role
      };

      const response = await postRequest(app, "/users", invalidData);

      expectValidationError(response, ["email", "password", "name", "role"]);
    });

    it("should return validation error for invalid role", async () => {
      const invalidData = {
        email: "test@example.com",
        password: "securePassword123",
        name: "Test User",
        role: "invalid-role",
      };

      const response = await postRequest(app, "/users", invalidData);

      expectValidationError(response, ["role"]);
    });
  });

  describe("PUT /users/:id", () => {
    it("should update user successfully", async () => {
      const userId = new ObjectId().toString();
      const updateData = createMockUpdateUserRequest();

      const mockUpdatedUser = createMockCombinedUser({
        _id: new ObjectId(userId),
        role: updateData.role!,
        status: updateData.status!,
      });

      mockUserService.updateUser.mockResolvedValue(mockUpdatedUser);

      const response = await putRequest(app, `/users/${userId}`, updateData);

      const body = expectSuccess(response);
      expectCombinedUserStructure(body);
      expect(body.role).toBe(updateData.role);
      expect(body.status).toBe(updateData.status);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
    });

    it("should return 404 for non-existent user", async () => {
      const userId = new ObjectId().toString();
      const updateData = createMockUpdateUserRequest({
        role: "admin",
        status: undefined,
      });

      mockUserService.updateUser.mockResolvedValue(null);

      const response = await putRequest(app, `/users/${userId}`, updateData);

      expectError(response, 404, "Not found", "User not found");
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
    });

    it("should return 400 for invalid ObjectId", async () => {
      const updateData = createMockUpdateUserRequest({
        role: "admin",
        status: undefined,
      });

      const response = await putRequest(app, "/users/invalid-id", updateData);

      expectError(response, 400, BAD_REQUEST_ERROR, INVALID_ID_FORMAT);
    });

    it("should return validation error for invalid update data", async () => {
      const userId = new ObjectId().toString();
      const invalidData = {
        role: "invalid-role",
        status: "invalid-status",
      };

      const response = await putRequest(app, `/users/${userId}`, invalidData);

      expectValidationError(response, ["role", "status"]);
    });
  });

  describe("DELETE /users/:id", () => {
    it("should soft delete user successfully", async () => {
      const userId = new ObjectId().toString();

      mockUserService.deleteUser.mockResolvedValue(true);

      const response = await deleteRequest(app, `/users/${userId}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent user", async () => {
      const userId = new ObjectId().toString();

      mockUserService.deleteUser.mockResolvedValue(false);

      const response = await deleteRequest(app, `/users/${userId}`);

      expectError(response, 404, "Not found", "User not found");
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await deleteRequest(app, "/users/invalid-id");

      expectError(response, 400, BAD_REQUEST_ERROR, INVALID_ID_FORMAT);
    });
  });

  describe("POST /users/:id/restore", () => {
    it("should restore deleted user successfully", async () => {
      const userId = new ObjectId().toString();
      const mockRestoredUser = createMockCombinedUser({
        _id: new ObjectId(userId),
        status: "active",
      });

      mockUserService.restoreUser.mockResolvedValue(mockRestoredUser);

      const response = await postRequest(app, `/users/${userId}/restore`);

      const body = expectSuccess(response);
      expectCombinedUserStructure(body);
      expect(body.status).toBe("active");
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent deleted user", async () => {
      const userId = new ObjectId().toString();

      mockUserService.restoreUser.mockResolvedValue(null);

      const response = await postRequest(app, `/users/${userId}/restore`);

      expectError(response, 404, "Not found", "Deleted user not found");
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await postRequest(app, "/users/invalid-id/restore");

      expectError(response, 400, BAD_REQUEST_ERROR, INVALID_ID_FORMAT);
    });
  });

  describe("Error handling", () => {
    it("should handle service layer errors gracefully", async () => {
      mockUserService.listUsers.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await getRequest(app, "/users");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty(
        "message",
        "Database connection failed",
      );
    });

    it("should handle auth provider errors during user creation", async () => {
      const createUserData = createMockCreateUserRequest({
        email: "test@example.com",
        name: "Test User",
      });

      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockRejectedValue(
        new Error("Auth provider error"),
      );

      const response = await postRequest(app, "/users", createUserData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty("message", "Auth provider error");
    });
  });
});
