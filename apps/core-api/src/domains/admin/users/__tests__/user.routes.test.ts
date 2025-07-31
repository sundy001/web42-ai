import { vi } from "vitest";

import { errorHandler } from "@/middleware";
import {
  deleteRequest,
  expectError,
  expectPaginatedResponse,
  expectSuccess,
  expectUserStructure,
  expectValidationError,
  getRequest,
  postRequest,
  putRequest,
} from "@/testUtils/apiTestHelpers";
import { ConflictError, NotFoundError } from "@/utils/errors";
import type { Application } from "express";
import express from "express";
import { ObjectId } from "mongodb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userRoutes } from "../user.routes";
import {
  createMockCreateUserRequest,
  createMockUpdateUserRequest,
  createMockUser,
  createMockUserListResponse,
} from "./userTestFixtures";

const mockUserService = vi.hoisted(() => ({
  createUser: vi.fn(),
  getUserById: vi.fn(),
  getUserBySupabaseId: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  permanentlyDeleteUser: vi.fn(),
  restoreUser: vi.fn(),
  listUsers: vi.fn(),
  userExistsByEmail: vi.fn(),
  userExists: vi.fn(),
}));

vi.mock("../user.service", () => mockUserService);

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
        [createMockUser(), createMockUser({ email: "user2@example.com" })],
        {
          total: 2,
          totalPages: 1,
        },
      );

      mockUserService.listUsers.mockResolvedValue(mockResponse);

      const response = await getRequest(app, "/users");

      expectPaginatedResponse(response, 1, 10);
      expect(mockUserService.listUsers).toHaveBeenCalledWith({}, {});

      const body = response.body;
      expect(body.items).toHaveLength(2);
      body.items.forEach(expectUserStructure);
    });

    it("should list users with custom pagination", async () => {
      const mockResponse = createMockUserListResponse([createMockUser()], {
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
      const mockResponse = createMockUserListResponse([
        createMockUser({ email: "specific@example.com" }),
      ]);

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
      const mockResponse = createMockUserListResponse([
        createMockUser({ role: "admin", status: "inactive" }),
      ]);

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
      const mockResponse = createMockUserListResponse([
        createMockUser({ status: "deleted" }),
      ]);

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
      const mockUser = createMockUser();
      const userId = mockUser._id;

      mockUserService.getUserById.mockResolvedValue(mockUser);

      const response = await getRequest(app, `/users/${userId}`);

      const body = expectSuccess(response);
      expectUserStructure(body);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(
        expect.any(String),
      );
    });

    it("should return 500 for service layer errors", async () => {
      const userId = new ObjectId().toString();
      mockUserService.getUserById.mockRejectedValue(
        new Error("Service layer error"),
      );

      const response = await getRequest(app, `/users/${userId}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Internal Server Error");
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await getRequest(app, "/users/invalid-id");

      expectError(response, 400);
    });
  });

  describe("POST /users", () => {
    it("should create new user successfully", async () => {
      const createUserData = createMockCreateUserRequest();
      const mockUser = createMockUser({
        email: createUserData.email,
        name: createUserData.name,
        role: createUserData.role,
      });

      mockUserService.createUser.mockResolvedValue(mockUser);

      const response = await postRequest(app, "/users", createUserData);

      const body = expectSuccess(response, 201);
      expectUserStructure(body);
      expect(body.email).toBe(createUserData.email);
      expect(body.name).toBe(createUserData.name);
      expect(body.role).toBe(createUserData.role);

      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserData);
    });

    it("should return 409 for duplicate email", async () => {
      const createUserData = createMockCreateUserRequest({
        email: "existing@example.com",
      });

      const error = new ConflictError(
        "Email already registered (existing@example.com)",
      );
      mockUserService.createUser.mockRejectedValue(error);

      const response = await postRequest(app, "/users", createUserData);

      expectError(
        response,
        409,
        "ConflictError",
        "Email already registered (existing@example.com)",
      );
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserData);
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
      const mockUser = createMockUser({
        role: updateData.role!,
        status: updateData.status!,
      });
      mockUser._id = new ObjectId(userId);

      mockUserService.updateUser.mockResolvedValue(mockUser);

      const response = await putRequest(app, `/users/${userId}`, updateData);

      const body = expectSuccess(response);
      expectUserStructure(body);
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

      const error = new NotFoundError(`User not found for update ${userId}`);
      mockUserService.updateUser.mockRejectedValue(error);

      const response = await putRequest(app, `/users/${userId}`, updateData);

      expectError(
        response,
        404,
        "NotFoundError",
        `User not found for update ${userId}`,
      );
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
      const mockUser = createMockUser();
      mockUser._id = new ObjectId(userId);

      mockUserService.deleteUser.mockResolvedValue(mockUser);

      const response = await deleteRequest(app, `/users/${userId}`);

      const body = expectSuccess(response);
      expectUserStructure(body);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent user", async () => {
      const userId = new ObjectId().toString();

      const error = new NotFoundError(`User not found for deletion ${userId}`);
      mockUserService.deleteUser.mockRejectedValue(error);

      const response = await deleteRequest(app, `/users/${userId}`);

      expectError(
        response,
        404,
        "NotFoundError",
        `User not found for deletion ${userId}`,
      );
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await deleteRequest(app, "/users/invalid-id");

      expectError(response, 400);
    });
  });

  describe("POST /users/:id/restore", () => {
    it("should restore deleted user successfully", async () => {
      const userId = new ObjectId().toString();
      const mockUser = createMockUser({
        status: "active",
      });
      mockUser._id = new ObjectId(userId);

      mockUserService.restoreUser.mockResolvedValue(mockUser);

      const response = await postRequest(app, `/users/${userId}/restore`);

      const body = expectSuccess(response);
      expectUserStructure(body);
      expect(body.status).toBe("active");
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent deleted user", async () => {
      const userId = new ObjectId().toString();

      const error = new NotFoundError(
        `User not found for restoration ${userId}`,
      );
      mockUserService.restoreUser.mockRejectedValue(error);

      const response = await postRequest(app, `/users/${userId}/restore`);

      expectError(
        response,
        404,
        "NotFoundError",
        `User not found for restoration ${userId}`,
      );
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const response = await postRequest(app, "/users/invalid-id/restore");

      expectError(response, 400);
    });
  });
});
