import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock user service
mock.module("../user.service", () => ({
  listUsers: mock(() => {}),
  getUserById: mock(() => {}),
  getUserByEmail: mock(() => {}),
  createUser: mock(() => {}),
  updateUser: mock(() => {}),
  deleteUser: mock(() => {}),
  restoreUser: mock(() => {}),
}));

import { ObjectId } from "mongodb";
import {
  createMockCombinedUser,
  deleteRequest,
  expectCombinedUserStructure,
  expectError,
  expectPaginatedResponse,
  expectSuccess,
  expectValidationError,
  getRequest,
  postRequest,
  putRequest,
  setupTestApp,
} from "../../../../testUtils";
import userRoutes from "../user.routes";
import * as userService from "../user.service";
import testFixtures from "./fixtures/users.json";

// Access the mocked module functions directly
const mockUserService = userService;

const app = setupTestApp((app) => {
  app.use("/users", userRoutes);
});

describe("User Routes Integration Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(mockUserService).forEach((mockFn) => {
      if (typeof mockFn === "function" && mockFn.mockReset) {
        mockFn.mockReset();
      }
    });
  });

  describe("GET /users", () => {
    describe("Success Cases", () => {
      it("should list users with default pagination", async () => {
        const mockUsers = [createMockCombinedUser(), createMockCombinedUser()];
        mockUserService.listUsers.mockResolvedValue({
          users: mockUsers,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        });

        const response = await getRequest(app, "/users");

        const body = expectPaginatedResponse(response, 1, 10);
        expect(body.users).toHaveLength(2);
        expect(body.total).toBe(2);
        body.users.forEach(expectCombinedUserStructure);
      });

      it("should handle custom pagination", async () => {
        const mockUsers = Array.from({ length: 5 }, () =>
          createMockCombinedUser(),
        );
        mockUserService.listUsers.mockResolvedValue({
          users: mockUsers,
          total: 25,
          page: 2,
          limit: 5,
          totalPages: 5,
        });

        const response = await getRequest(app, "/users?page=2&limit=5");

        const body = expectPaginatedResponse(response, 2, 5);
        expect(body.users).toHaveLength(5);
        expect(body.total).toBe(25);
        expect(body.totalPages).toBe(5);
      });

      it("should filter by role", async () => {
        const mockAdminUser = createMockCombinedUser({ role: "admin" });
        mockUserService.listUsers.mockResolvedValue({
          users: [mockAdminUser],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        });

        const response = await getRequest(app, "/users?role=admin");

        const body = expectPaginatedResponse(response);
        expect(body.users).toHaveLength(1);
        expect(body.users[0].role).toBe("admin");
      });

      it("should handle empty result set", async () => {
        mockUserService.listUsers.mockResolvedValue({
          users: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        });

        const response = await getRequest(app, "/users");

        const body = expectPaginatedResponse(response);
        expect(body.users).toHaveLength(0);
        expect(body.total).toBe(0);
      });
    });

    describe("Error Cases", () => {
      it("should reject invalid pagination values", async () => {
        const response = await getRequest(app, "/users?page=0&limit=10");
        expectValidationError(response);
      });

      it("should reject invalid UUID for supabaseUserId", async () => {
        const response = await getRequest(
          app,
          "/users?supabaseUserId=invalid-uuid",
        );
        expectValidationError(response, ["supabaseUserId"]);
      });
    });
  });

  describe("GET /users/:id", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    describe("Success Cases", () => {
      it("should get user by valid ID", async () => {
        const mockUser = createMockCombinedUser({
          _id: new ObjectId(validObjectId),
        });
        mockUserService.getUserById.mockResolvedValue(mockUser);

        const response = await getRequest(app, `/users/${validObjectId}`);

        const body = expectSuccess(response);
        expectCombinedUserStructure(body);
      });
    });

    describe("Error Cases", () => {
      it("should return 404 for non-existent user", async () => {
        mockUserService.getUserById.mockResolvedValue(null);

        const response = await getRequest(app, `/users/${validObjectId}`);

        expectError(response, 404, "Not found", "User not found");
      });

      it("should reject invalid ObjectId format", async () => {
        const response = await getRequest(app, "/users/invalid-id");
        expectError(
          response,
          400,
          "Validation failed",
          "Invalid ObjectId format",
        );
      });
    });
  });

  describe("POST /users", () => {
    describe("Success Cases", () => {
      it("should create user with valid data", async () => {
        const userData = testFixtures.validUsers[0];
        const mockCreatedUser = createMockCombinedUser({
          email: userData.email,
          role: userData.role as any,
        });

        mockUserService.getUserByEmail.mockResolvedValue(null);
        mockUserService.createUser.mockResolvedValue(mockCreatedUser);

        const response = await postRequest(app, "/users", userData);

        const body = expectSuccess(response, 201);
        expectCombinedUserStructure(body);
        expect(body.email).toBe(userData.email);
        expect(body.role).toBe(userData.role);
      });
    });

    describe("Error Cases", () => {
      it("should reject missing required fields", async () => {
        const incompleteData = { email: "test@example.com" };

        const response = await postRequest(app, "/users", incompleteData);

        expectValidationError(response);
      });

      it("should return 409 for duplicate email", async () => {
        const userData = testFixtures.validUsers[0];
        const existingUser = createMockCombinedUser({ email: userData.email });

        mockUserService.getUserByEmail.mockResolvedValue(existingUser);

        const response = await postRequest(app, "/users", userData);

        expectError(
          response,
          409,
          "Conflict",
          "User with this email already exists",
        );
      });
    });
  });

  describe("PUT /users/:id", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    describe("Success Cases", () => {
      it("should update user role", async () => {
        const updateData = { role: "admin" };
        const mockUpdatedUser = createMockCombinedUser({
          _id: new ObjectId(validObjectId),
          role: "admin",
        });

        mockUserService.updateUser.mockResolvedValue(mockUpdatedUser);

        const response = await putRequest(
          app,
          `/users/${validObjectId}`,
          updateData,
        );

        const body = expectSuccess(response);
        expectCombinedUserStructure(body);
        expect(body.role).toBe("admin");
      });
    });

    describe("Error Cases", () => {
      it("should reject empty update body", async () => {
        const response = await putRequest(app, `/users/${validObjectId}`, {});

        expectValidationError(response);
      });

      it("should return 404 for non-existent user", async () => {
        mockUserService.updateUser.mockResolvedValue(null);

        const response = await putRequest(app, `/users/${validObjectId}`, {
          role: "admin",
        });

        expectError(response, 404, "Not found", "User not found");
      });
    });
  });

  describe("DELETE /users/:id", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    describe("Success Cases", () => {
      it("should delete user successfully", async () => {
        mockUserService.deleteUser.mockResolvedValue(true);

        const response = await deleteRequest(app, `/users/${validObjectId}`);

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
      });
    });

    describe("Error Cases", () => {
      it("should return 404 for non-existent user", async () => {
        mockUserService.deleteUser.mockResolvedValue(false);

        const response = await deleteRequest(app, `/users/${validObjectId}`);

        expectError(response, 404, "Not found", "User not found");
      });
    });
  });

  describe("POST /users/:id/restore", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    describe("Success Cases", () => {
      it("should restore deleted user", async () => {
        const mockRestoredUser = createMockCombinedUser({
          _id: new ObjectId(validObjectId),
          status: "active",
        });

        mockUserService.restoreUser.mockResolvedValue(mockRestoredUser);

        const response = await postRequest(
          app,
          `/users/${validObjectId}/restore`,
        );

        const body = expectSuccess(response);
        expectCombinedUserStructure(body);
        expect(body.status).toBe("active");
      });
    });

    describe("Error Cases", () => {
      it("should return 404 for non-existent deleted user", async () => {
        mockUserService.restoreUser.mockResolvedValue(null);

        const response = await postRequest(
          app,
          `/users/${validObjectId}/restore`,
        );

        expectError(response, 404, "Not found", "Deleted user not found");
      });
    });
  });

  describe("Error Handling", () => {
    it.skip("should handle service layer errors", async () => {
      mockUserService.listUsers.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await getRequest(app, "/users");

      expectError(response, 500, "Internal server error");
    });
  });
});
