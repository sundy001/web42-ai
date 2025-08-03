import { vi } from "vitest";

import { AuthError } from "@/domains/auth/providers/authUtils";
import { ConflictError, NotFoundError } from "@/utils/errors";
import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it } from "vitest";
import {
  createMockAuthUser,
  createMockCreateUserRequest,
  createMockMongoUser,
  createMockUpdateUserRequest,
} from "./userTestFixtures";

const mockAuthProvider = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserById: vi.fn(),
}));

const mockUserRepository = vi.hoisted(() => ({
  createUser: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserBySupabaseId: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  restoreUser: vi.fn(),
  listUsers: vi.fn(),
  userExists: vi.fn(),
  userExistsByEmail: vi.fn(),
  permanentlyDeleteUser: vi.fn(),
}));

// Mock the dependencies
vi.mock("@/domains/auth", () => ({
  getAuthProvider: () => mockAuthProvider,
}));

vi.mock("../user.repository", () => mockUserRepository);

import * as userService from "../user.service";

describe("User Service Unit Tests", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createUser", () => {
    it("should create user successfully", async () => {
      const createUserData = createMockCreateUserRequest();
      const mockAuthUser = createMockAuthUser({
        email: createUserData.email,
        name: createUserData.name,
      });
      const mockMongoUser = createMockMongoUser({
        email: createUserData.email,
        name: createUserData.name,
        role: createUserData.role,
        supabaseUserId: mockAuthUser.id,
      });
      mockUserRepository.getUserByEmail.mockResolvedValue(null);
      mockAuthProvider.createUser.mockResolvedValue(mockAuthUser);
      mockUserRepository.createUser.mockResolvedValue(mockMongoUser);

      const result = await userService.createUser(createUserData);

      expect(result).toBeTruthy();
      expect(result.email).toBe(createUserData.email);
      expect(result.name).toBe(createUserData.name);
      expect(result.role).toBe(createUserData.role);
      expect(result.status).toBe("active");
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(
        createUserData.email,
        true,
      );
      expect(mockAuthProvider.createUser).toHaveBeenCalledWith({
        ...createUserData,
        emailConfirm: true,
      });
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        supabaseUserId: mockAuthUser.id,
        email: createUserData.email,
        name: createUserData.name,
        role: createUserData.role,
        status: "active",
      });
    });

    it("should throw ConflictError for duplicate email", async () => {
      const createUserData = createMockCreateUserRequest({
        email: "existing@example.com",
      });
      const existingUser = createMockMongoUser({ email: createUserData.email });

      mockUserRepository.getUserByEmail.mockResolvedValue(existingUser);

      await expect(userService.createUser(createUserData)).rejects.toThrow(
        ConflictError,
      );
      await expect(userService.createUser(createUserData)).rejects.toThrow(
        "Email already registered (existing@example.com)",
      );

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(
        createUserData.email,
        true,
      );
      expect(mockAuthProvider.createUser).not.toHaveBeenCalled();
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it("should handle auth provider errors", async () => {
      const createUserData = createMockCreateUserRequest();

      mockUserRepository.getUserByEmail.mockResolvedValue(null);
      mockAuthProvider.createUser.mockRejectedValue(
        new AuthError("Auth provider error", 400, "user_creation_failed"),
      );

      await expect(userService.createUser(createUserData)).rejects.toThrow(
        AuthError,
      );

      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("should get user by valid ID", async () => {
      const mockMongoUser = createMockMongoUser();
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });
      const userId = mockMongoUser._id.toString();

      mockUserRepository.getUserById.mockResolvedValue(mockMongoUser);
      mockAuthProvider.getUserById.mockResolvedValue(mockAuthUser);

      const result = await userService.getUserById(userId);

      expect(result).toBeTruthy();
      expect(result.id.toString()).toBe(userId);
      expect(result.email).toBe(mockAuthUser.email);
      expect(result.name).toBe(mockAuthUser.name);
      expect(result.role).toBe(mockMongoUser.role);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(
        userId,
        false,
      );
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const userId = new ObjectId().toString();

      mockUserRepository.getUserById.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(userService.getUserById(userId)).rejects.toThrow(
        `User not found by ID ${userId}`,
      );

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(
        userId,
        false,
      );
    });

    it("should include deleted users when requested", async () => {
      const mockMongoUser = createMockMongoUser({ status: "deleted" });
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });
      const userId = mockMongoUser._id.toString();

      mockUserRepository.getUserById.mockResolvedValue(mockMongoUser);
      mockAuthProvider.getUserById.mockResolvedValue(mockAuthUser);

      const result = await userService.getUserById(userId, true);

      expect(result).toBeTruthy();
      expect(result.status).toBe("deleted");
      expect(result.id.toString()).toBe(userId);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId, true);
    });
  });

  describe("getUserBySupabaseId", () => {
    it("should get user by supabase ID", async () => {
      const mockMongoUser = createMockMongoUser();
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });
      const supabaseUserId = mockMongoUser.supabaseUserId;

      mockUserRepository.getUserBySupabaseId.mockResolvedValue(mockMongoUser);
      mockAuthProvider.getUserById.mockResolvedValue(mockAuthUser);

      const result = await userService.getUserBySupabaseId(supabaseUserId);

      expect(result).toBeTruthy();
      expect(result.id).toEqual(mockMongoUser._id.toString());
      expect(result.email).toBe(mockAuthUser.email);
      expect(mockUserRepository.getUserBySupabaseId).toHaveBeenCalledWith(
        supabaseUserId,
        false,
      );
    });

    it("should throw NotFoundError for non-existent supabase user", async () => {
      const supabaseUserId = "non-existent-id";

      mockUserRepository.getUserBySupabaseId.mockResolvedValue(null);

      await expect(
        userService.getUserBySupabaseId(supabaseUserId),
      ).rejects.toThrow(NotFoundError);
      await expect(
        userService.getUserBySupabaseId(supabaseUserId),
      ).rejects.toThrow(`User not found by supabase ID ${supabaseUserId}`);

      expect(mockUserRepository.getUserBySupabaseId).toHaveBeenCalledWith(
        supabaseUserId,
        false,
      );
    });

    it("should include deleted users when requested", async () => {
      const mockMongoUser = createMockMongoUser({ status: "deleted" });
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });
      const supabaseUserId = mockMongoUser.supabaseUserId;

      mockUserRepository.getUserBySupabaseId.mockResolvedValue(mockMongoUser);
      mockAuthProvider.getUserById.mockResolvedValue(mockAuthUser);

      const result = await userService.getUserBySupabaseId(
        supabaseUserId,
        true,
      );

      expect(result).toBeTruthy();
      expect(result.status).toBe("deleted");
      expect(result.id).toEqual(mockMongoUser._id.toString());
      expect(mockUserRepository.getUserBySupabaseId).toHaveBeenCalledWith(
        supabaseUserId,
        true,
      );
    });
  });

  describe("updateUser", () => {
    it("should update user successfully with role change", async () => {
      const userId = new ObjectId().toString();
      const updateData = createMockUpdateUserRequest();
      const mockMongoUser = createMockMongoUser({
        role: updateData.role!,
        status: updateData.status!,
      });
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });

      mockUserRepository.updateUser.mockResolvedValue(mockMongoUser);
      mockAuthProvider.updateUser.mockResolvedValue(mockAuthUser);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toBeTruthy();
      expect(result.role).toBe(updateData.role);
      expect(result.status).toBe(updateData.status);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
      expect(mockAuthProvider.updateUser).toHaveBeenCalledWith(
        mockMongoUser.supabaseUserId,
        {
          appMetadata: { role: updateData.role },
        },
      );
    });

    it("should update user successfully without role change", async () => {
      const userId = new ObjectId().toString();
      const updateData = createMockUpdateUserRequest({ role: undefined });
      const mockMongoUser = createMockMongoUser({
        status: updateData.status!,
      });
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });

      mockUserRepository.updateUser.mockResolvedValue(mockMongoUser);
      mockAuthProvider.getUserById.mockResolvedValue(mockAuthUser);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toBeTruthy();
      expect(result.status).toBe(updateData.status);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
      expect(mockAuthProvider.updateUser).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const userId = new ObjectId().toString();
      const updateData = createMockUpdateUserRequest();

      mockUserRepository.updateUser.mockResolvedValue(null);

      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
        NotFoundError,
      );
      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
        `User not found for update ${userId}`,
      );

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
      expect(mockAuthProvider.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const userId = new ObjectId().toString();
      const mockMongoUser = createMockMongoUser();
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });

      mockUserRepository.getUserById.mockResolvedValue(mockMongoUser);
      mockAuthProvider.deleteUser.mockResolvedValue(mockAuthUser);
      mockUserRepository.deleteUser.mockResolvedValue(true);

      const result = await userService.deleteUser(userId);

      expect(result).toBeTruthy();
      expect(result.id).toEqual(mockMongoUser._id.toString());
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockAuthProvider.deleteUser).toHaveBeenCalledWith(
        mockMongoUser.supabaseUserId,
        true,
      );
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith(userId);
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const userId = new ObjectId().toString();

      mockUserRepository.getUserById.mockResolvedValue(null);

      await expect(userService.deleteUser(userId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(userService.deleteUser(userId)).rejects.toThrow(
        `User not found for deletion ${userId}`,
      );

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockAuthProvider.deleteUser).not.toHaveBeenCalled();
      expect(mockUserRepository.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe("permanentlyDeleteUser", () => {
    it("should permanently delete user successfully", async () => {
      const userId = new ObjectId().toString();

      mockUserRepository.permanentlyDeleteUser.mockResolvedValue(true);

      const result = await userService.permanentlyDeleteUser(userId);

      expect(result).toBe(true);
      expect(mockUserRepository.permanentlyDeleteUser).toHaveBeenCalledWith(
        userId,
      );
    });

    it("should return false for non-existent user", async () => {
      const userId = new ObjectId().toString();

      mockUserRepository.permanentlyDeleteUser.mockResolvedValue(false);

      const result = await userService.permanentlyDeleteUser(userId);

      expect(result).toBe(false);
      expect(mockUserRepository.permanentlyDeleteUser).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe("restoreUser", () => {
    it("should restore user successfully", async () => {
      const userId = new ObjectId().toString();
      const mockMongoUser = createMockMongoUser({ status: "active" });
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });

      mockUserRepository.restoreUser.mockResolvedValue(mockMongoUser);
      mockAuthProvider.getUserById.mockResolvedValue(mockAuthUser);

      const result = await userService.restoreUser(userId);

      expect(result).toBeTruthy();
      expect(result.status).toBe("active");
      expect(mockUserRepository.restoreUser).toHaveBeenCalledWith(userId);
    });

    it("should throw NotFoundError for non-existent deleted user", async () => {
      const userId = new ObjectId().toString();

      mockUserRepository.restoreUser.mockResolvedValue(null);

      await expect(userService.restoreUser(userId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(userService.restoreUser(userId)).rejects.toThrow(
        `User not found for restoration ${userId}`,
      );

      expect(mockUserRepository.restoreUser).toHaveBeenCalledWith(userId);
    });
  });

  describe("listUsers", () => {
    it("should list users with default parameters", async () => {
      const mockMongoUsers = [
        createMockMongoUser(),
        createMockMongoUser({ email: "user2@example.com" }),
      ];
      const mockAuthUsers = [
        createMockAuthUser({ id: mockMongoUsers[0]!.supabaseUserId }),
        createMockAuthUser({
          id: mockMongoUsers[1]!.supabaseUserId,
          email: "user2@example.com",
        }),
      ];
      const mockRepositoryResponse = {
        items: mockMongoUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockUserRepository.listUsers.mockResolvedValue(mockRepositoryResponse);
      mockAuthProvider.getUserById
        .mockResolvedValueOnce(mockAuthUsers[0])
        .mockResolvedValueOnce(mockAuthUsers[1]);

      const result = await userService.listUsers();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.items[0]!.email).toBe(mockMongoUsers[0]!.email);
      expect(result.items[0]!.name).toBe(mockMongoUsers[0]!.name);
      expect(result.items[0]!.role).toBe(mockMongoUsers[0]!.role);
      expect(result.items[1]!.email).toBe(mockMongoUsers[1]!.email);
      expect(result.items[1]!.name).toBe(mockMongoUsers[1]!.name);
      expect(result.items[1]!.role).toBe(mockMongoUsers[1]!.role);
      expect(mockUserRepository.listUsers).toHaveBeenCalledWith({}, {});
    });

    it("should list users with filters and pagination", async () => {
      const filters = { email: "test@example.com", role: "admin" as const };
      const pagination = { page: 2, limit: 5 };
      const mockMongoUser = createMockMongoUser();
      const mockAuthUser = createMockAuthUser({
        id: mockMongoUser.supabaseUserId,
      });
      const mockRepositoryResponse = {
        items: [mockMongoUser],
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      };

      mockUserRepository.listUsers.mockResolvedValue(mockRepositoryResponse);
      mockAuthProvider.getUserById.mockResolvedValue(mockAuthUser);

      const result = await userService.listUsers(filters, pagination);

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.items[0]!.email).toBe(mockMongoUser.email);
      expect(result.items[0]!.name).toBe(mockMongoUser.name);
      expect(result.items[0]!.role).toBe(mockMongoUser.role);
      expect(mockUserRepository.listUsers).toHaveBeenCalledWith(
        filters,
        pagination,
      );
    });

    it("should handle empty user list", async () => {
      const mockRepositoryResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockUserRepository.listUsers.mockResolvedValue(mockRepositoryResponse);

      const result = await userService.listUsers();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("userExistsByEmail", () => {
    it("should return true for existing email", async () => {
      const email = "existing@example.com";

      mockUserRepository.userExistsByEmail.mockResolvedValue(true);

      const result = await userService.userExistsByEmail(email);

      expect(result).toBe(true);
      expect(mockUserRepository.userExistsByEmail).toHaveBeenCalledWith(email);
    });

    it("should return false for non-existing email", async () => {
      const email = "nonexistent@example.com";

      mockUserRepository.userExistsByEmail.mockResolvedValue(false);

      const result = await userService.userExistsByEmail(email);

      expect(result).toBe(false);
      expect(mockUserRepository.userExistsByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe("userExists", () => {
    it("should return true for existing user ID", async () => {
      const userId = new ObjectId().toString();

      mockUserRepository.userExists.mockResolvedValue(true);

      const result = await userService.userExists(userId);

      expect(result).toBe(true);
      expect(mockUserRepository.userExists).toHaveBeenCalledWith(userId);
    });

    it("should return false for non-existing user ID", async () => {
      const userId = new ObjectId().toString();

      mockUserRepository.userExists.mockResolvedValue(false);

      const result = await userService.userExists(userId);

      expect(result).toBe(false);
      expect(mockUserRepository.userExists).toHaveBeenCalledWith(userId);
    });
  });

  describe("Error handling", () => {
    it("should handle repository errors during creation", async () => {
      const createUserData = createMockCreateUserRequest();
      const mockAuthUser = createMockAuthUser();

      mockUserRepository.getUserByEmail.mockResolvedValue(null);
      mockAuthProvider.createUser.mockResolvedValue(mockAuthUser);
      mockUserRepository.createUser.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(userService.createUser(createUserData)).rejects.toThrow(
        "Database connection failed",
      );

      expect(mockAuthProvider.createUser).toHaveBeenCalled();
    });

    it("should handle auth provider errors during update", async () => {
      const userId = new ObjectId().toString();
      const updateData = createMockUpdateUserRequest();
      const mockMongoUser = createMockMongoUser();

      mockUserRepository.updateUser.mockResolvedValue(mockMongoUser);
      mockAuthProvider.updateUser.mockRejectedValue(
        new AuthError("Auth update failed", 500, "update_failed"),
      );

      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
        AuthError,
      );

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData,
      );
    });

    it("should handle auth provider errors during deletion", async () => {
      const userId = new ObjectId().toString();
      const mockMongoUser = createMockMongoUser();

      mockUserRepository.getUserById.mockResolvedValue(mockMongoUser);
      mockAuthProvider.deleteUser.mockRejectedValue(
        new AuthError("Auth delete failed", 500, "delete_failed"),
      );

      await expect(userService.deleteUser(userId)).rejects.toThrow(AuthError);

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
    });
  });
});
