import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// Create the mock before the module mock
const mockGetAuthProvider = mock(() => ({}));

// Mock the auth module before imports
mock.module("../../../auth", () => ({
  getAuthProvider: mockGetAuthProvider,
}));

import { createMockAuthUser, createMockUser } from "../../../../testUtils";
import { combineUserData } from "../combineUserData";

const mockAuthProvider = {
  getUserById: mock(() => {}),
};

describe("combineUserData", () => {
  beforeEach(() => {
    // Reset mocks
    mockGetAuthProvider.mockReset();
    mockAuthProvider.getUserById.mockReset();
    
    // Configure the mock to return mockAuthProvider
    mockGetAuthProvider.mockReturnValue(mockAuthProvider as any);
  });

  afterEach(() => {
    // Clean up mocks
    mockGetAuthProvider.mockReset();
    mockAuthProvider.getUserById.mockReset();
  });

  describe("Success Cases", () => {
    it("should combine user data when auth user is provided", async () => {
      const mongoUser = createMockUser({
        email: "test@example.com",
        role: "user",
        status: "active",
      });

      const authUser = createMockAuthUser({
        id: mongoUser.supabaseUserId,
        name: "Test User",
        avatarUrl: "https://example.com/avatar.jpg",
        authProvider: "email",
      });

      const result = await combineUserData(mongoUser, authUser);

      // Should contain all MongoDB user fields
      expect(result._id).toBe(mongoUser._id);
      expect(result.supabaseUserId).toBe(mongoUser.supabaseUserId);
      expect(result.email).toBe(mongoUser.email);
      expect(result.role).toBe(mongoUser.role);
      expect(result.status).toBe(mongoUser.status);
      expect(result.createdAt).toBe(mongoUser.createdAt);
      expect(result.updatedAt).toBe(mongoUser.updatedAt);

      // Should contain auth provider fields
      expect(result.name).toBe(authUser.name);
      expect(result.avatarUrl).toBe(authUser.avatarUrl);
      expect(result.authProvider).toBe(authUser.authProvider);
      expect(result.lastSignInAt).toBe(authUser.lastSignInAt);
      expect(result.emailConfirmedAt).toBe(authUser.emailConfirmedAt);
      expect(result.phoneConfirmedAt).toBe(undefined); // null is converted to undefined
      expect(result.phone).toBe(undefined); // null is converted to undefined
    });

    it("should fetch auth user data when not provided", async () => {
      const mongoUser = createMockUser({
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const authUser = createMockAuthUser({
        id: mongoUser.supabaseUserId,
        name: "Fetched User",
        avatarUrl: "https://example.com/fetched-avatar.jpg",
      });

      mockAuthProvider.getUserById.mockResolvedValue(authUser);

      const result = await combineUserData(mongoUser);

      expect(mockAuthProvider.getUserById).toHaveBeenCalledWith(
        mongoUser.supabaseUserId,
      );
      expect(result.name).toBe("Fetched User");
      expect(result.avatarUrl).toBe("https://example.com/fetched-avatar.jpg");
    });

    it("should handle null values in auth user fields", async () => {
      const mongoUser = createMockUser();
      const authUser = createMockAuthUser({
        name: undefined,
        avatarUrl: undefined,
        lastSignInAt: null,
        emailConfirmedAt: null,
        phoneConfirmedAt: null,
        phone: null,
      });

      const result = await combineUserData(mongoUser, authUser);

      expect(result.name).toBeUndefined();
      expect(result.avatarUrl).toBeUndefined();
      expect(result.lastSignInAt).toBeUndefined();
      expect(result.emailConfirmedAt).toBeUndefined();
      expect(result.phoneConfirmedAt).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });

    it("should prioritize MongoDB data over auth provider data for common fields", async () => {
      const mongoUser = createMockUser({
        email: "mongo@example.com",
      });

      const authUser = createMockAuthUser({
        email: "auth@example.com", // Different email in auth provider
      });

      const result = await combineUserData(mongoUser, authUser);

      // Should use MongoDB email, not auth provider email
      expect(result.email).toBe("mongo@example.com");
    });
  });

  describe("Error Cases", () => {
    it("should handle auth provider fetch failure gracefully", async () => {
      const mongoUser = createMockUser();

      mockAuthProvider.getUserById.mockRejectedValue(
        new Error("Auth provider unavailable"),
      );

      const result = await combineUserData(mongoUser);

      // Should still return user data with MongoDB fields
      expect(result._id).toBe(mongoUser._id);
      expect(result.email).toBe(mongoUser.email);
      expect(result.role).toBe(mongoUser.role);
      expect(result.status).toBe(mongoUser.status);

      // Auth provider fields should be undefined
      expect(result.name).toBeUndefined();
      expect(result.avatarUrl).toBeUndefined();
      expect(result.authProvider).toBeUndefined();
    });

    it("should handle auth user not found", async () => {
      const mongoUser = createMockUser();

      mockAuthProvider.getUserById.mockResolvedValue(null);

      const result = await combineUserData(mongoUser);

      // Should still return user data with MongoDB fields
      expect(result._id).toBe(mongoUser._id);
      expect(result.email).toBe(mongoUser.email);
      expect(result.role).toBe(mongoUser.role);
      expect(result.status).toBe(mongoUser.status);

      // Auth provider fields should be undefined
      expect(result.name).toBeUndefined();
      expect(result.avatarUrl).toBeUndefined();
      expect(result.authProvider).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing optional MongoDB fields", async () => {
      const mongoUser = createMockUser({
        createdAt: undefined,
        updatedAt: undefined,
      });

      const authUser = createMockAuthUser();

      const result = await combineUserData(mongoUser, authUser);

      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
      // Other fields should still be present
      expect(result.email).toBe(mongoUser.email);
      expect(result.name).toBe(authUser.name);
    });

    it("should handle user with minimal data", async () => {
      const minimalUser = createMockUser({
        name: undefined,
        avatarUrl: undefined,
      });

      const result = await combineUserData(minimalUser);

      expect(result).toBeDefined();
      expect(result._id).toBe(minimalUser._id);
      expect(result.email).toBe(minimalUser.email);
    });

    it("should preserve userMetadata and appMetadata", async () => {
      const mongoUser = createMockUser();
      const authUser = createMockAuthUser({
        userMetadata: { theme: "dark", language: "en" },
        appMetadata: { role: "admin", permissions: ["read", "write"] },
      });

      const result = await combineUserData(mongoUser, authUser);

      expect(result.userMetadata).toEqual({ theme: "dark", language: "en" });
      expect(result.appMetadata).toEqual({
        role: "admin",
        permissions: ["read", "write"],
      });
    });
  });
});
