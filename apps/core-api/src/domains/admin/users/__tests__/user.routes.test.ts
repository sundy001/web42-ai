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
import type {
  CombinedUser,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserListResponse,
} from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any -- Mocks require any types for flexible testing */
// Mock middleware to handle validation properly
const VALIDATION_ERROR = "Validation failed";
const BAD_REQUEST_ERROR = "Bad Request";
const INTERNAL_SERVER_ERROR = "Internal Server Error";
const INVALID_ID_FORMAT = "Invalid ID format";
const MOCK_EMAIL = "test@example.com";
const MOCK_TIMESTAMP = "2024-01-01T00:00:00.000Z";
const TEST_USER_NAME = "Test User";

vi.mock("../../../../middleware", () => ({
  validateQuery: vi.fn(() => (req: any, res: any, next: any) => {
    // Extract and parse query params
    res.locals = res.locals || {};
    const query = req.query;

    // Parse specific fields that need type conversion
    const parsedQuery: Record<string, unknown> = {};
    if (query.page !== undefined)
      parsedQuery.page = parseInt(query.page as string, 10);
    if (query.limit !== undefined)
      parsedQuery.limit = parseInt(query.limit as string, 10);
    if (query.includeDeleted !== undefined)
      parsedQuery.includeDeleted = query.includeDeleted === "true";
    if (query.email !== undefined) parsedQuery.email = query.email;
    if (query.role !== undefined) parsedQuery.role = query.role;
    if (query.status !== undefined) parsedQuery.status = query.status;
    if (query.supabaseUserId !== undefined)
      parsedQuery.supabaseUserId = query.supabaseUserId;

    res.locals.validatedQuery = parsedQuery;
    next();
  }),
  validateBody: vi.fn(() => {
    const validateCreateUser = (body: any) => {
      const errors = [];
      if (!body.email || !/\S+@\S+\.\S+/.test(body.email))
        errors.push({ field: "email" });
      if (!body.password) errors.push({ field: "password" });
      if (!body.name) errors.push({ field: "name" });
      if (!body.role || !["admin", "user"].includes(body.role))
        errors.push({ field: "role" });
      return errors;
    };

    const validateUpdateUser = (body: any) => {
      const errors = [];
      if (body.role && !["admin", "user"].includes(body.role))
        errors.push({ field: "role" });
      if (body.status && !["active", "inactive"].includes(body.status))
        errors.push({ field: "status" });
      return errors;
    };

    return (req: any, res: any, next: any) => {
      res.locals = res.locals || {};
      const body = req.body;

      let errors: Array<{ field: string }> = [];
      if (req.method === "POST" && req.path === "/") {
        errors = validateCreateUser(body);
      } else if (req.method === "PUT") {
        errors = validateUpdateUser(body);
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: VALIDATION_ERROR,
          details: errors,
        });
      }

      res.locals.validatedBody = body;
      next();
    };
  }),
  validateObjectId: vi.fn(() => (req: any, res: any, next: any) => {
    res.locals = res.locals || {};
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        error: BAD_REQUEST_ERROR,
        message: INVALID_ID_FORMAT,
      });
    }
    res.locals.validatedId = id;
    next();
  }),
  asyncHandler: vi.fn((fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      res.status(500).json({
        error: INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    });
  }),
}));

// Mock the auth provider
vi.mock("../../../auth", () => ({
  getAuthProvider: vi.fn(),
}));

// Mock the user repository
vi.mock("../user.repository", () => ({
  createUser: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  restoreUser: vi.fn(),
  listUsers: vi.fn(),
  userExists: vi.fn(),
}));

// Mock the user service
vi.mock("../user.service", () => ({
  createUser: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  restoreUser: vi.fn(),
  listUsers: vi.fn(),
  userExists: vi.fn(),
}));

import { getAuthProvider } from "../../../auth";
import userRoutes from "../user.routes";
import * as userService from "../user.service";

// Type the mocked modules
const mockGetAuthProvider = vi.mocked(getAuthProvider);
const mockUserService = vi.mocked(userService);

// Mock data factories
const createMockUser = (overrides: Partial<User> = {}): User => ({
  _id: new ObjectId(),
  supabaseUserId: "supabase-123",
  email: MOCK_EMAIL,
  role: "user",
  status: "active",
  createdAt: MOCK_TIMESTAMP,
  updatedAt: MOCK_TIMESTAMP,
  ...overrides,
});

const createMockCombinedUser = (
  overrides: Partial<CombinedUser> = {},
): CombinedUser => ({
  ...createMockUser(),
  name: TEST_USER_NAME,
  avatarUrl: "https://example.com/avatar.png",
  authProvider: "supabase",
  lastSignInAt: MOCK_TIMESTAMP,
  emailConfirmedAt: MOCK_TIMESTAMP,
  ...overrides,
});

const createMockAuthProvider = (): Partial<AuthProvider> => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserById: vi.fn(),
});

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
    mockAuthProvider = createMockAuthProvider();
    mockGetAuthProvider.mockReturnValue(mockAuthProvider as AuthProvider);
  });

  describe("GET /users", () => {
    it("should list users with default pagination", async () => {
      const mockUsers = [
        createMockCombinedUser(),
        createMockCombinedUser({ email: "user2@example.com" }),
      ];
      const mockResponse: UserListResponse = {
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

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
      const mockResponse: UserListResponse = {
        users: mockUsers,
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      };

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
      const mockResponse: UserListResponse = {
        users: mockUsers,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

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
      const mockResponse: UserListResponse = {
        users: mockUsers,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

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
      const mockResponse: UserListResponse = {
        users: mockUsers,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

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
      const createUserData: CreateUserRequest = {
        email: "newuser@example.com",
        password: "securePassword123",
        name: "New User",
        role: "user",
      };

      const mockCreatedUser = createMockCombinedUser({
        email: createUserData.email,
        name: createUserData.name,
        role: createUserData.role,
      });

      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockCreatedUser);

      const response = await postRequest(app, "/users", createUserData);

      const body = expectSuccess(response, 201);
      console.log("body", body);
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
      const createUserData: CreateUserRequest = {
        email: "existing@example.com",
        password: "securePassword123",
        name: "New User",
        role: "user",
      };

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
      const updateData: UpdateUserRequest = {
        role: "admin",
        status: "inactive",
      };

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
      const updateData: UpdateUserRequest = { role: "admin" };

      mockUserService.updateUser.mockResolvedValue(null);

      const response = await putRequest(app, `/users/${userId}`, updateData);

      expectError(response, 404, "Not found", "User not found");
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
    });

    it("should return 400 for invalid ObjectId", async () => {
      const updateData: UpdateUserRequest = { role: "admin" };

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
      const createUserData: CreateUserRequest = {
        email: "test@example.com",
        password: "securePassword123",
        name: "Test User",
        role: "user",
      };

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
