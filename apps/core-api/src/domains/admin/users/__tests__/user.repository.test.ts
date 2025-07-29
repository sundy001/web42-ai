import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockCollection = {
  insertOne: mock(),
  findOne: mock(),
  find: mock(),
  findOneAndUpdate: mock(),
  updateOne: mock(),
  deleteOne: mock(),
  countDocuments: mock(),
};

const mockCursor = {
  sort: mock().mockReturnThis(),
  skip: mock().mockReturnThis(),
  limit: mock().mockReturnThis(),
  toArray: mock(),
};

const mockDatabase = {
  collection: mock().mockReturnValue(mockCollection),
};

// Create database mock
const mockGetDatabase = mock().mockReturnValue(mockDatabase);

// Mock the database store before imports
mock.module("../../../../stores/database", () => ({
  databaseStore: {
    getDatabase: mockGetDatabase,
  },
}));

import { ObjectId } from "mongodb";
import { createMockUser } from "../../../../testUtils";
import * as userRepository from "../user.repository";

describe("User Repository", () => {
  beforeEach(() => {
    // Reset all mocks
    [mockCollection, mockCursor, mockDatabase, mockGetDatabase].forEach(
      (mockObj) => {
        Object.values(mockObj).forEach((mockFn) => {
          if (typeof mockFn === "function" && mockFn.mockReset) {
            mockFn.mockReset();
          }
        });
      },
    );

    // Re-configure mocks after reset
    mockGetDatabase.mockReturnValue(mockDatabase as any);
    mockDatabase.collection.mockReturnValue(mockCollection);
    mockCollection.find.mockReturnValue(mockCursor);

    // Ensure cursor methods return this properly
    mockCursor.sort.mockReturnValue(mockCursor);
    mockCursor.skip.mockReturnValue(mockCursor);
    mockCursor.limit.mockReturnValue(mockCursor);
  });

  describe("createUser", () => {
    it("should create user successfully", async () => {
      const userData = {
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
        role: "user" as const,
        status: "active" as const,
      };

      const insertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValue({
        insertedId,
        acknowledged: true,
      });

      const result = await userRepository.createUser(userData);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        supabaseUserId: userData.supabaseUserId,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(result).toEqual({
        _id: insertedId,
        ...userData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should handle duplicate email error", async () => {
      const userData = {
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
        email: "duplicate@example.com",
        role: "user" as const,
        status: "active" as const,
      };

      const duplicateKeyError = {
        code: 11000,
        keyPattern: { email: 1 },
      };

      mockCollection.insertOne.mockRejectedValue(duplicateKeyError);

      await expect(userRepository.createUser(userData)).rejects.toThrow(
        "User with email duplicate@example.com already exists",
      );
    });

    it("should propagate other database errors", async () => {
      const userData = {
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
        role: "user" as const,
        status: "active" as const,
      };

      const genericError = new Error("Database connection failed");
      mockCollection.insertOne.mockRejectedValue(genericError);

      await expect(userRepository.createUser(userData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("getUserById", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should get user by valid ID", async () => {
      const mockUser = createMockUser({ _id: new ObjectId(validObjectId) });
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.getUserById(validObjectId);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(validObjectId),
        status: { $ne: "deleted" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should include deleted users when requested", async () => {
      const mockUser = createMockUser({
        _id: new ObjectId(validObjectId),
        status: "deleted",
      });
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.getUserById(validObjectId, true);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(validObjectId),
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null for invalid ObjectId", async () => {
      const result = await userRepository.getUserById("invalid-id");

      expect(result).toBeNull();
      expect(mockCollection.findOne).not.toHaveBeenCalled();
    });

    it("should return null when user not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await userRepository.getUserById(validObjectId);

      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("should get user by email", async () => {
      const email = "test@example.com";
      const mockUser = createMockUser({ email });
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.getUserByEmail(email);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        email,
        status: { $ne: "deleted" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should include deleted users when requested", async () => {
      const email = "deleted@example.com";
      const mockUser = createMockUser({ email, status: "deleted" });
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.getUserByEmail(email, true);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });
  });

  describe("getUserBySupabaseId", () => {
    it("should get user by Supabase ID", async () => {
      const supabaseUserId = "550e8400-e29b-41d4-a716-446655440000";
      const mockUser = createMockUser({ supabaseUserId });
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.getUserBySupabaseId(supabaseUserId);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        supabaseUserId,
        status: { $ne: "deleted" },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe("updateUser", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should update user successfully", async () => {
      const updateData = { role: "admin" as const };
      const updatedUser = createMockUser({
        _id: new ObjectId(validObjectId),
        role: "admin",
      });

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userRepository.updateUser(validObjectId, updateData);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(validObjectId), status: { $ne: "deleted" } },
        { $set: { ...updateData, updatedAt: expect.any(String) } },
        { returnDocument: "after" },
      );
      expect(result).toEqual(updatedUser);
    });

    it("should return null for invalid ObjectId", async () => {
      const result = await userRepository.updateUser("invalid-id", {
        role: "admin",
      });

      expect(result).toBeNull();
      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should return null when user not found", async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await userRepository.updateUser(validObjectId, {
        role: "admin",
      });

      expect(result).toBeNull();
    });
  });

  describe("deleteUser", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should soft delete user successfully", async () => {
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await userRepository.deleteUser(validObjectId);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        {
          _id: new ObjectId(validObjectId),
          status: { $ne: "deleted" },
        },
        {
          $set: {
            status: "deleted",
            updatedAt: expect.any(String),
          },
        },
      );
      expect(result).toBe(true);
    });

    it("should return false for invalid ObjectId", async () => {
      const result = await userRepository.deleteUser("invalid-id");

      expect(result).toBe(false);
      expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it("should return false when user not found", async () => {
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

      const result = await userRepository.deleteUser(validObjectId);

      expect(result).toBe(false);
    });
  });

  describe("permanentlyDeleteUser", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should permanently delete user successfully", async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await userRepository.permanentlyDeleteUser(validObjectId);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(validObjectId),
      });
      expect(result).toBe(true);
    });

    it("should return false when user not found", async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await userRepository.permanentlyDeleteUser(validObjectId);

      expect(result).toBe(false);
    });
  });

  describe("restoreUser", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should restore deleted user successfully", async () => {
      const restoredUser = createMockUser({
        _id: new ObjectId(validObjectId),
        status: "active",
      });

      mockCollection.findOneAndUpdate.mockResolvedValue(restoredUser);

      const result = await userRepository.restoreUser(validObjectId);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: new ObjectId(validObjectId),
          status: "deleted",
        },
        {
          $set: {
            status: "active",
            updatedAt: expect.any(String),
          },
        },
        { returnDocument: "after" },
      );
      expect(result).toEqual(restoredUser);
    });

    it("should return null when deleted user not found", async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await userRepository.restoreUser(validObjectId);

      expect(result).toBeNull();
    });
  });

  describe("listUsers", () => {
    it("should list users with default pagination", async () => {
      const mockUsers = [createMockUser(), createMockUser()];

      mockCollection.countDocuments.mockResolvedValue(2);
      mockCursor.toArray.mockResolvedValue(mockUsers);

      const result = await userRepository.listUsers();

      expect(mockCollection.find).toHaveBeenCalledWith({
        status: { $ne: "deleted" },
      });
      expect(mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockCursor.skip).toHaveBeenCalledWith(0);
      expect(mockCursor.limit).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should apply filters correctly", async () => {
      const filters = {
        role: "admin" as const,
        status: "active" as const,
        email: "test",
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
      };

      mockCollection.countDocuments.mockResolvedValue(1);
      mockCursor.toArray.mockResolvedValue([createMockUser()]);

      await userRepository.listUsers(filters);

      expect(mockCollection.find).toHaveBeenCalledWith({
        role: "admin",
        status: { $in: ["active", "active", "inactive"] },
        email: { $regex: "test", $options: "i" },
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
      });
    });

    it("should include deleted users when requested", async () => {
      const filters = { includeDeleted: true };

      mockCollection.countDocuments.mockResolvedValue(1);
      mockCursor.toArray.mockResolvedValue([createMockUser()]);

      await userRepository.listUsers(filters);

      expect(mockCollection.find).toHaveBeenCalledWith({});
    });

    it("should handle custom pagination", async () => {
      const pagination = { page: 2, limit: 5 };

      mockCollection.countDocuments.mockResolvedValue(15);
      mockCursor.toArray.mockResolvedValue([createMockUser()]);

      const result = await userRepository.listUsers({}, pagination);

      expect(mockCursor.skip).toHaveBeenCalledWith(5); // (2-1) * 5
      expect(mockCursor.limit).toHaveBeenCalledWith(5);
      expect(result.totalPages).toBe(3); // Math.ceil(15/5)
    });
  });

  describe("userExists", () => {
    it("should return true when user exists", async () => {
      mockCollection.countDocuments.mockResolvedValue(1);

      const result = await userRepository.userExists("test@example.com");

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(result).toBe(true);
    });

    it("should return false when user does not exist", async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await userRepository.userExists("nonexistent@example.com");

      expect(result).toBe(false);
    });
  });
});
