import { vi } from "vitest";

import { errorHandler } from "@/middleware";
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
} from "@/testUtils/apiTestHelpers";
import type { Application } from "express";
import express from "express";
import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockAuthUser,
  createMockCombinedUser,
  createMockCreateUserRequest,
  createMockMongoUser,
  createMockUpdateUserRequest,
  createMockUserListResponse,
} from "./userTestFixtures";
import {
  setupAuthProviderMocks,
  setupUserRepositoryMocks,
} from "./userTestMocks";

// Setup mocks
const authProvider = setupAuthProviderMocks();
setupUserRepositoryMocks();

import { AuthError } from "@/domains/auth/authUtils";
import * as userRepository from "../user.repository";
import userRoutes from "../user.routes";

describe("User Routes Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    // Create fresh app instance
    app = express();
    app.use(express.json());
    app.use("/users", userRoutes);
    app.use(errorHandler);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /users", () => {
    it("should list users with default pagination", async () => {
      const mockResponse = createMockUserListResponse(
        [
          createMockMongoUser(),
          createMockMongoUser({ email: "user2@example.com" }),
        ],
        {
          total: 2,
          totalPages: 1,
        },
      );

      userRepository.listUsers.mockResolvedValue(mockResponse);
      authProvider.getUserById.mockResolvedValue(createMockAuthUser());

      const response = await getRequest(app, "/users");

      expectPaginatedResponse(response, 1, 10);
      expect(userRepository.listUsers).toHaveBeenCalledWith({}, {});

      const body = response.body;
      expect(body.users).toHaveLength(2);
      body.users.forEach(expectCombinedUserStructure);
    });

    it("should list users with custom pagination", async () => {
      const mockResponse = createMockUserListResponse([createMockMongoUser()], {
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      });

      userRepository.listUsers.mockResolvedValue(mockResponse);
      authProvider.getUserById.mockResolvedValue(createMockAuthUser());

      const response = await getRequest(app, "/users?page=2&limit=5");

      expectPaginatedResponse(response, 2, 5);
      expect(userRepository.listUsers).toHaveBeenCalledWith(
        {},
        { page: 2, limit: 5 },
      );
    });

    it("should filter users by email", async () => {
      const mockResponse = createMockUserListResponse([
        createMockMongoUser({ email: "specific@example.com" }),
      ]);

      userRepository.listUsers.mockResolvedValue(mockResponse);
      authProvider.getUserById.mockResolvedValue(createMockAuthUser());

      const response = await getRequest(
        app,
        "/users?email=specific@example.com",
      );

      expectPaginatedResponse(response, 1, 10);
      expect(userRepository.listUsers).toHaveBeenCalledWith(
        { email: "specific@example.com" },
        {},
      );
    });

    it("should filter users by role and status", async () => {
      const mockResponse = createMockUserListResponse([
        createMockMongoUser({ role: "admin", status: "inactive" }),
      ]);

      userRepository.listUsers.mockResolvedValue(mockResponse);
      authProvider.getUserById.mockResolvedValue(createMockAuthUser());

      const response = await getRequest(
        app,
        "/users?role=admin&status=inactive",
      );

      expectPaginatedResponse(response, 1, 10);
      expect(userRepository.listUsers).toHaveBeenCalledWith(
        { role: "admin", status: "inactive" },
        {},
      );
    });

    it("should include deleted users when requested", async () => {
      const mockResponse = createMockUserListResponse([
        createMockMongoUser({ status: "deleted" }),
      ]);

      userRepository.listUsers.mockResolvedValue(mockResponse);
      authProvider.getUserById.mockResolvedValue(createMockAuthUser());

      const response = await getRequest(app, "/users?includeDeleted=true");

      expectPaginatedResponse(response, 1, 10);
      expect(userRepository.listUsers).toHaveBeenCalledWith(
        { includeDeleted: true },
        {},
      );
    });
  });

  describe("GET /users/:id", () => {
    it("should get user by valid ID", async () => {
      const mockMongoUser = createMockMongoUser();
      const userId = mockMongoUser._id.toString();

      userRepository.getUserById.mockResolvedValue(mockMongoUser);
      authProvider.getUserById.mockResolvedValue(createMockAuthUser());

      const response = await getRequest(app, `/users/${userId}`);

      const body = expectSuccess(response);
      expectCombinedUserStructure(body);
      expect(userRepository.getUserById).toHaveBeenCalledWith(userId, false);
      expect(authProvider.getUserById).toHaveBeenCalledWith(
        mockMongoUser.supabaseUserId,
      );
    });

    it("should return 404 for non-existent user", async () => {
      const userId = new ObjectId().toString();
      userRepository.getUserById.mockResolvedValue(null);

      const response = await getRequest(app, `/users/${userId}`);

      expectError(response, 404, "NotFoundError", "User not found");
      expect(userRepository.getUserById).toHaveBeenCalledWith(userId, false);
    });

    it("should return 404 for missing auth provider user", async () => {
      const userId = new ObjectId().toString();

      userRepository.getUserById.mockResolvedValue(createMockMongoUser());
      authProvider.getUserById.mockRejectedValue(
        new AuthError("Auth provider error", 404, "user_not_found"),
      );

      const response = await getRequest(app, `/users/${userId}`);

      expectError(response, 404, "NotFoundError", "Auth provider error");
      expect(userRepository.getUserById).toHaveBeenCalledWith(userId, false);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await getRequest(app, "/users/invalid-id");

      expectError(response, 400);
    });
  });

  describe("POST /users", () => {
    it("should create new user successfully", async () => {
      const createUserData = createMockCreateUserRequest();
      const mockMongoUser = createMockMongoUser({
        email: createUserData.email,
        role: createUserData.role,
      });
      const mockAuthUser = createMockAuthUser({
        email: createUserData.email,
        name: createUserData.name,
      });

      userRepository.getUserByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(mockMongoUser);
      authProvider.createUser.mockResolvedValue(mockAuthUser);

      const response = await postRequest(app, "/users", createUserData);

      const body = expectSuccess(response, 201);
      expectCombinedUserStructure(body);
      expect(body.email).toBe(createUserData.email);
      expect(body.name).toBe(createUserData.name);
      expect(body.role).toBe(createUserData.role);

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        createUserData.email,
        true,
      );
      expect(authProvider.createUser).toHaveBeenCalledWith({
        ...createUserData,
        emailConfirm: true,
      });
      expect(userRepository.createUser).toHaveBeenCalledWith({
        supabaseUserId: mockAuthUser.id,
        email: createUserData.email,
        role: createUserData.role,
        status: "active",
      });
    });

    it.only("should return 409 for duplicate email", async () => {
      const createUserData = createMockCreateUserRequest({
        email: "existing@example.com",
      });

      const existingUser = createMockCombinedUser({
        email: createUserData.email,
      });
      userRepository.getUserByEmail.mockResolvedValue(existingUser);

      const response = await postRequest(app, "/users", createUserData);

      expectError(
        response,
        409,
        "ConflictError",
        "User with this email already exists",
      );
      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        createUserData.email,
        true,
      );
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it("should return validation error for missing required fields", async () => {
      const invalidData = {
        email: "invalid-email",
        // missing password, name, role
      };

      const response = await postRequest(app, "/users", invalidData);

      expectValidationError(response, ["email", "name", "role"]);
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
      const mockAuthUser = createMockAuthUser();

      const mockMongoUser = createMockMongoUser({
        _id: new ObjectId(userId),
        role: updateData.role!,
        status: updateData.status!,
      });

      userRepository.updateUser.mockResolvedValue(mockMongoUser);
      authProvider.updateUser.mockResolvedValue(mockAuthUser);

      const response = await putRequest(app, `/users/${userId}`, updateData);

      const body = expectSuccess(response);
      expectCombinedUserStructure(body);
      expect(body.role).toBe(updateData.role);
      expect(body.status).toBe(updateData.status);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
      expect(authProvider.updateUser).toHaveBeenCalledWith(mockAuthUser.id, {
        appMetadata: {
          role: updateData.role,
        },
      });
    });

    it("should return 404 for non-existent user", async () => {
      const userId = new ObjectId().toString();
      const updateData = createMockUpdateUserRequest({
        role: "admin",
        status: undefined,
      });

      userRepository.updateUser.mockResolvedValue(null);

      const response = await putRequest(app, `/users/${userId}`, updateData);

      expectError(response, 404, "NotFoundError", "User not found in MongoDB");
      expect(userRepository.updateUser).toHaveBeenCalledWith(
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

      expectError(response, 400);
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
      const mockMongoUser = createMockMongoUser();
      const mockAuthUser = createMockAuthUser();

      userRepository.deleteUser.mockResolvedValue(true);
      userRepository.getUserById.mockResolvedValue(mockMongoUser);
      authProvider.deleteUser.mockResolvedValue(mockAuthUser);

      const response = await deleteRequest(app, `/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        _id: mockMongoUser._id.toString(),
        authProvider: "supabase",
        avatarUrl: mockAuthUser.avatarUrl,
        createdAt: mockMongoUser.createdAt,
        email: mockAuthUser.email,
        emailConfirmedAt: mockAuthUser.emailConfirmedAt,
        lastSignInAt: mockAuthUser.lastSignInAt,
        name: mockAuthUser.name,
        role: mockMongoUser.role,
        status: mockMongoUser.status,
        supabaseUserId: mockAuthUser.id,
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
      expect(userRepository.deleteUser).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent user", async () => {
      const userId = new ObjectId().toString();

      userRepository.deleteUser.mockResolvedValue(false);

      const response = await deleteRequest(app, `/users/${userId}`);

      expectError(response, 404, "Not found", "User not found");
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await deleteRequest(app, "/users/invalid-id");

      expectError(response, 400);
    });
  });

  describe("POST /users/:id/restore", () => {
    it("should restore deleted user successfully", async () => {
      const userId = new ObjectId().toString();
      const mockRestoredUser = createMockCombinedUser({
        _id: new ObjectId(userId),
        status: "active",
      });

      userRepository.restoreUser.mockResolvedValue(mockRestoredUser);

      const response = await postRequest(app, `/users/${userId}/restore`);

      const body = expectSuccess(response);
      expectCombinedUserStructure(body);
      expect(body.status).toBe("active");
      expect(userRepository.restoreUser).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent deleted user", async () => {
      const userId = new ObjectId().toString();

      userRepository.restoreUser.mockResolvedValue(null);

      const response = await postRequest(app, `/users/${userId}/restore`);

      expectError(response, 404, "Not found", "Deleted user not found");
      expect(userRepository.restoreUser).toHaveBeenCalledWith(userId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await postRequest(app, "/users/invalid-id/restore");

      expectError(response, 400);
    });
  });

  describe("Error handling", () => {
    it("should handle service layer errors gracefully", async () => {
      userRepository.listUsers.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await getRequest(app, "/users");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty("message", "Something went wrong");
    });

    it("should handle auth provider errors during user creation", async () => {
      const createUserData = createMockCreateUserRequest({
        email: "test@example.com",
        name: "Test User",
      });

      userRepository.getUserByEmail.mockResolvedValue(null);
      userRepository.createUser.mockRejectedValue(
        new Error("Auth provider error"),
      );

      const response = await postRequest(app, "/users", createUserData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(response.body).toHaveProperty("message", "Something went wrong");
    });
  });
});
