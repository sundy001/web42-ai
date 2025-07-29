import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// Create mocks
const mockGetAuthProvider = mock(() => ({}));
const mockCombineUserData = mock();

// Mock dependencies before imports
mock.module("../user.repository", () => ({
  createUser: mock(() => {}),
  getUserById: mock(() => {}),
  getUserByEmail: mock(() => {}),
  updateUser: mock(() => {}),
  deleteUser: mock(() => {}),
  restoreUser: mock(() => {}),
  listUsers: mock(() => {}),
  userExists: mock(() => {}),
}));

mock.module("../../../auth", () => ({
  getAuthProvider: mockGetAuthProvider,
}));

mock.module("../combineUserData", () => ({
  combineUserData: mockCombineUserData,
}));

import {
  createMockAuthUser,
  createMockCombinedUser,
  createMockUser,
} from "../../../../testUtils";
import * as userStore from "../user.repository";
import * as userService from "../user.service";

const mockAuthProvider = {
  createUser: mock(() => {}),
  getUserById: mock(() => {}),
  updateUser: mock(() => {}),
  deleteUser: mock(() => {}),
};

// Access the mocked modules
const mockUserStore = userStore;

describe("User Service", () => {
  beforeEach(() => {
    // Reset all mocks
    Object.values(mockUserStore).forEach((mockFn) => {
      if (typeof mockFn === "function" && mockFn.mockReset) {
        mockFn.mockReset();
      }
    });
    Object.values(mockAuthProvider).forEach((mockFn) => {
      if (typeof mockFn === "function" && mockFn.mockReset) {
        mockFn.mockReset();
      }
    });

    // Reset module-level mocks
    mockCombineUserData.mockReset();
    mockGetAuthProvider.mockReset();

    // Configure the auth provider mock to return our mock auth provider
    mockGetAuthProvider.mockReturnValue(mockAuthProvider as any);
  });

  afterEach(() => {
    // Clean up all mocks after each test
    mockCombineUserData.mockReset();
    mockGetAuthProvider.mockReset();
  });

  describe("createUser", () => {
    it("should create user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "user" as const,
      };

      const mockAuthUser = createMockAuthUser({
        id: "auth-user-id",
        email: userData.email,
      });

      const mockMongoUser = createMockUser({
        supabaseUserId: mockAuthUser.id,
        email: userData.email,
        role: userData.role,
      });

      const mockCombinedUser = createMockCombinedUser({
        ...mockMongoUser,
        name: userData.name,
      });

      mockAuthProvider.createUser.mockResolvedValue(mockAuthUser);
      mockUserStore.createUser.mockResolvedValue(mockMongoUser);
      mockCombineUserData.mockResolvedValue(mockCombinedUser);

      const result = await userService.createUser(userData);

      expect(mockAuthProvider.createUser).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        emailConfirm: true,
      });

      expect(mockUserStore.createUser).toHaveBeenCalledWith({
        supabaseUserId: mockAuthUser.id,
        email: userData.email,
        role: userData.role,
        status: "active",
      });

      expect(result).toEqual(mockCombinedUser);
    });

    it("should handle auth provider creation failure", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "user" as const,
      };

      mockAuthProvider.createUser.mockRejectedValue(
        new Error("Auth provider failed"),
      );

      await expect(userService.createUser(userData)).rejects.toThrow(
        "Auth provider failed",
      );

      expect(mockUserStore.createUser).not.toHaveBeenCalled();
    });

    it("should handle MongoDB creation failure after auth user created", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "user" as const,
      };

      const mockAuthUser = createMockAuthUser();
      mockAuthProvider.createUser.mockResolvedValue(mockAuthUser);
      mockUserStore.createUser.mockRejectedValue(new Error("Database error"));

      await expect(userService.createUser(userData)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("getUserById", () => {
    it("should get user by ID successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const mockMongoUser = createMockUser();
      const mockCombinedUser = createMockCombinedUser();

      mockUserStore.getUserById.mockResolvedValue(mockMongoUser);
      mockCombineUserData.mockResolvedValue(mockCombinedUser);

      const result = await userService.getUserById(userId);

      expect(mockUserStore.getUserById).toHaveBeenCalledWith(userId, false);
      expect(result).toEqual(mockCombinedUser);
    });

    it("should return null when user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      mockUserStore.getUserById.mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(result).toBeNull();
    });

    it("should include deleted users when requested", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const mockMongoUser = createMockUser({ status: "deleted" });
      const mockCombinedUser = createMockCombinedUser({ status: "deleted" });

      mockUserStore.getUserById.mockResolvedValue(mockMongoUser);
      mockCombineUserData.mockResolvedValue(mockCombinedUser);

      const result = await userService.getUserById(userId, true);

      expect(mockUserStore.getUserById).toHaveBeenCalledWith(userId, true);
      expect(result).toEqual(mockCombinedUser);
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const updateData = { role: "admin" as const };

      const existingUser = createMockUser({
        supabaseUserId: "auth-user-id",
      });

      const updatedUser = createMockUser({
        ...existingUser,
        role: "admin",
      });

      const mockUpdatedAuthUser = createMockAuthUser();
      const mockCombinedUser = createMockCombinedUser({ role: "admin" });

      mockUserStore.getUserById.mockResolvedValue(existingUser);
      mockUserStore.updateUser.mockResolvedValue(updatedUser);
      mockAuthProvider.updateUser.mockResolvedValue(mockUpdatedAuthUser);
      mockCombineUserData.mockResolvedValue(mockCombinedUser);

      const result = await userService.updateUser(userId, updateData);

      expect(mockUserStore.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(mockAuthProvider.updateUser).toHaveBeenCalledWith(
        existingUser.supabaseUserId,
        { appMetadata: { role: "admin" } },
      );
      expect(result).toEqual(mockCombinedUser);
    });

    it("should return null when user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const updateData = { role: "admin" as const };

      mockUserStore.getUserById.mockResolvedValue(null);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toBeNull();
      expect(mockUserStore.updateUser).not.toHaveBeenCalled();
      expect(mockAuthProvider.updateUser).not.toHaveBeenCalled();
    });

    it("should not update auth provider if role not changed", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const updateData = { status: "inactive" as const };

      const existingUser = createMockUser();
      const updatedUser = createMockUser({
        ...existingUser,
        status: "inactive",
      });
      const mockCombinedUser = createMockCombinedUser({ status: "inactive" });

      mockUserStore.getUserById.mockResolvedValue(existingUser);
      mockUserStore.updateUser.mockResolvedValue(updatedUser);
      mockCombineUserData.mockResolvedValue(mockCombinedUser);

      const result = await userService.updateUser(userId, updateData);

      expect(mockAuthProvider.updateUser).not.toHaveBeenCalled();
      expect(result).toEqual(mockCombinedUser);
    });

    it("should handle auth provider update failure", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const updateData = { role: "admin" as const };

      const existingUser = createMockUser();
      const updatedUser = createMockUser({ ...existingUser, role: "admin" });

      mockUserStore.getUserById.mockResolvedValue(existingUser);
      mockUserStore.updateUser.mockResolvedValue(updatedUser);
      mockAuthProvider.updateUser.mockRejectedValue(
        new Error("Auth provider failed"),
      );

      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
        "Auth provider failed",
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const existingUser = createMockUser({
        supabaseUserId: "auth-user-id",
      });

      mockUserStore.getUserById.mockResolvedValue(existingUser);
      mockAuthProvider.deleteUser.mockResolvedValue(undefined);
      mockUserStore.deleteUser.mockResolvedValue(true);

      const result = await userService.deleteUser(userId);

      expect(mockAuthProvider.deleteUser).toHaveBeenCalledWith(
        existingUser.supabaseUserId,
      );
      expect(mockUserStore.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it("should return false when user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      mockUserStore.getUserById.mockResolvedValue(null);

      const result = await userService.deleteUser(userId);

      expect(result).toBe(false);
      expect(mockAuthProvider.deleteUser).not.toHaveBeenCalled();
      expect(mockUserStore.deleteUser).not.toHaveBeenCalled();
    });

    it("should continue with MongoDB deletion if auth provider deletion fails", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const existingUser = createMockUser();

      mockUserStore.getUserById.mockResolvedValue(existingUser);
      mockAuthProvider.deleteUser.mockRejectedValue(
        new Error("Auth provider failed"),
      );
      mockUserStore.deleteUser.mockResolvedValue(true);

      const result = await userService.deleteUser(userId);

      expect(mockUserStore.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });
  });

  describe("restoreUser", () => {
    it("should restore user successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const restoredUser = createMockUser({ status: "active" });
      const mockCombinedUser = createMockCombinedUser({ status: "active" });

      mockUserStore.restoreUser.mockResolvedValue(restoredUser);
      mockCombineUserData.mockResolvedValue(mockCombinedUser);

      const result = await userService.restoreUser(userId);

      expect(mockUserStore.restoreUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCombinedUser);
    });

    it("should return null when deleted user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      mockUserStore.restoreUser.mockResolvedValue(null);

      const result = await userService.restoreUser(userId);

      expect(result).toBeNull();
    });
  });

  describe("listUsers", () => {
    it("should list users successfully", async () => {
      const filters = { role: "admin" as const };
      const pagination = { page: 1, limit: 10 };

      const mockUsers = [createMockUser(), createMockUser()];
      const mockCombinedUsers = [
        createMockCombinedUser(),
        createMockCombinedUser(),
      ];

      mockUserStore.listUsers.mockResolvedValue({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      mockCombineUserData
        .mockResolvedValueOnce(mockCombinedUsers[0])
        .mockResolvedValueOnce(mockCombinedUsers[1]);

      const result = await userService.listUsers(filters, pagination);

      expect(mockUserStore.listUsers).toHaveBeenCalledWith(filters, pagination);
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it("should handle empty user list", async () => {
      mockUserStore.listUsers.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const result = await userService.listUsers();

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("userExists", () => {
    it("should return true when user exists", async () => {
      mockUserStore.userExists.mockResolvedValue(true);

      const result = await userService.userExists("test@example.com");

      expect(mockUserStore.userExists).toHaveBeenCalledWith("test@example.com");
      expect(result).toBe(true);
    });

    it("should return false when user does not exist", async () => {
      mockUserStore.userExists.mockResolvedValue(false);

      const result = await userService.userExists("nonexistent@example.com");

      expect(result).toBe(false);
    });
  });
});
