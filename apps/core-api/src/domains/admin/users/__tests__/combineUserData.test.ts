import { AuthError } from "@/domains/auth/authUtils";
import { ApiError, NotFoundError } from "@/utils/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { combineUserData } from "../combineUserData";
import { createMockAuthUser, createMockMongoUser } from "./userTestFixtures";

const mockAuthProvider = vi.hoisted(() => ({
  getUserById: vi.fn(),
}));

// Mock the auth dependency
vi.mock("@/domains/auth", () => ({
  getAuthProvider: () => mockAuthProvider,
}));

describe("combineUserData", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("when authUser is provided", () => {
    it("should combine mongoUser with provided authUser", async () => {
      const mongoUser = createMockMongoUser({
        supabaseUserId: "user-123",
        email: "test@example.com",
      });

      const authUser = createMockAuthUser({
        id: "user-123",
        name: "John Doe",
        avatarUrl: "https://example.com/avatar.jpg",
        authProvider: "supabase",
        lastSignInAt: "2024-01-15T10:00:00.000Z",
        emailConfirmedAt: "2024-01-01T00:00:00.000Z",
        phoneConfirmedAt: "2024-01-02T00:00:00.000Z",
        phone: "+1234567890",
        userMetadata: { theme: "dark" },
        appMetadata: { role: "premium" },
      });

      const result = await combineUserData(mongoUser, authUser);

      expect(result).toEqual({
        ...mongoUser,
        name: "John Doe",
        avatarUrl: "https://example.com/avatar.jpg",
        authProvider: "supabase",
        lastSignInAt: "2024-01-15T10:00:00.000Z",
        emailConfirmedAt: "2024-01-01T00:00:00.000Z",
        phoneConfirmedAt: "2024-01-02T00:00:00.000Z",
        phone: "+1234567890",
        userMetadata: { theme: "dark" },
        appMetadata: { role: "premium" },
      });

      // Should not call auth provider when authUser is provided
      expect(mockAuthProvider.getUserById).not.toHaveBeenCalled();
    });

    it("should handle null values from authUser by converting to undefined", async () => {
      const mongoUser = createMockMongoUser();
      const authUser = createMockAuthUser({
        lastSignInAt: null,
        emailConfirmedAt: null,
        phoneConfirmedAt: null,
        phone: null,
      });

      const result = await combineUserData(mongoUser, authUser);

      expect(result.lastSignInAt).toBeUndefined();
      expect(result.emailConfirmedAt).toBeUndefined();
      expect(result.phoneConfirmedAt).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });
  });

  describe("when authUser is not provided", () => {
    it("should fetch authUser from auth provider and combine data", async () => {
      const mongoUser = createMockMongoUser({
        supabaseUserId: "user-456",
      });

      const authUser = createMockAuthUser({
        id: "user-456",
        name: "Jane Smith",
        avatarUrl: "https://example.com/jane.jpg",
      });

      mockAuthProvider.getUserById.mockResolvedValue(authUser);

      const result = await combineUserData(mongoUser);

      expect(mockAuthProvider.getUserById).toHaveBeenCalledWith("user-456");
      expect(result).toEqual({
        ...mongoUser,
        name: "Jane Smith",
        avatarUrl: "https://example.com/jane.jpg",
        authProvider: authUser.authProvider,
        lastSignInAt: authUser.lastSignInAt,
        emailConfirmedAt: authUser.emailConfirmedAt,
        phoneConfirmedAt: authUser.phoneConfirmedAt,
        phone: authUser.phone,
        userMetadata: authUser.userMetadata,
        appMetadata: authUser.appMetadata,
      });
    });

    it("should throw NotFoundError when auth provider returns user_not_found", async () => {
      const mongoUser = createMockMongoUser({
        supabaseUserId: "nonexistent-user",
      });

      const authError = new AuthError("User not found", 404, "user_not_found");
      mockAuthProvider.getUserById.mockRejectedValue(authError);

      await expect(combineUserData(mongoUser)).rejects.toThrow(NotFoundError);
      await expect(combineUserData(mongoUser)).rejects.toThrow(
        "Auth user not found (nonexistent-user)",
      );

      expect(mockAuthProvider.getUserById).toHaveBeenCalledWith(
        "nonexistent-user",
      );
    });

    it("should throw ApiError when auth provider returns other AuthError", async () => {
      const mongoUser = createMockMongoUser({
        supabaseUserId: "error-user",
      });

      const authError = new AuthError("Access denied", 403, "access_denied");
      mockAuthProvider.getUserById.mockRejectedValue(authError);

      await expect(combineUserData(mongoUser)).rejects.toThrow(ApiError);
      await expect(combineUserData(mongoUser)).rejects.toThrow(
        "Auth provider error (error-user)",
      );

      expect(mockAuthProvider.getUserById).toHaveBeenCalledWith("error-user");
    });

    it("should throw ApiError when auth provider throws non-AuthError", async () => {
      const mongoUser = createMockMongoUser({
        supabaseUserId: "network-error-user",
      });

      const networkError = new Error("Network timeout");
      mockAuthProvider.getUserById.mockRejectedValue(networkError);

      await expect(combineUserData(mongoUser)).rejects.toThrow(ApiError);
      await expect(combineUserData(mongoUser)).rejects.toThrow(
        "Auth user fetch failed (network-error-user)",
      );

      expect(mockAuthProvider.getUserById).toHaveBeenCalledWith(
        "network-error-user",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle authUser with undefined optional fields", async () => {
      const mongoUser = createMockMongoUser();
      const authUser = createMockAuthUser({
        name: undefined,
        avatarUrl: undefined,
        authProvider: undefined,
        lastSignInAt: undefined,
        emailConfirmedAt: undefined,
        phoneConfirmedAt: undefined,
        phone: undefined,
        userMetadata: undefined,
        appMetadata: undefined,
      });

      const result = await combineUserData(mongoUser, authUser);

      expect(result.name).toBeUndefined();
      expect(result.avatarUrl).toBeUndefined();
      expect(result.authProvider).toBeUndefined();
      expect(result.lastSignInAt).toBeUndefined();
      expect(result.emailConfirmedAt).toBeUndefined();
      expect(result.phoneConfirmedAt).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.userMetadata).toBeUndefined();
      expect(result.appMetadata).toBeUndefined();
    });

    it("should preserve mongoUser data while adding auth fields", async () => {
      const mongoUser = createMockMongoUser({
        email: "preserved@example.com",
        role: "admin",
        status: "inactive",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-15T00:00:00.000Z",
      });

      const authUser = createMockAuthUser({
        name: "Override Name",
      });

      const result = await combineUserData(mongoUser, authUser);

      // MongoDB fields should be preserved
      expect(result._id).toEqual(mongoUser._id);
      expect(result.supabaseUserId).toBe(mongoUser.supabaseUserId);
      expect(result.email).toBe("preserved@example.com");
      expect(result.role).toBe("admin");
      expect(result.status).toBe("inactive");
      expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result.updatedAt).toBe("2024-01-15T00:00:00.000Z");

      // Auth fields should be added
      expect(result.name).toBe("Override Name");
    });

    it("should handle empty metadata objects", async () => {
      const mongoUser = createMockMongoUser();
      const authUser = createMockAuthUser({
        userMetadata: {},
        appMetadata: {},
      });

      const result = await combineUserData(mongoUser, authUser);

      expect(result.userMetadata).toEqual({});
      expect(result.appMetadata).toEqual({});
    });
  });
});
