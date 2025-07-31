import { vi } from "vitest";

import { UnauthorizedError } from "@/utils/errors";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createMockAuthProviderSignInResponse,
  createMockLoginRequest,
  createMockUser,
} from "./authTestFixtures";

// Mock dependencies with proper hoisting
const mockGetUserBySupabaseId = vi.hoisted(() => vi.fn());
const mockAuthProvider = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));
const mockGetAuthProvider = vi.hoisted(() => vi.fn());

// Set up mocks before importing the service
vi.mock("@/domains/admin/users", () => ({
  getUserBySupabaseId: mockGetUserBySupabaseId,
}));

vi.mock("../providers", () => ({
  getAuthProvider: mockGetAuthProvider,
}));

// Import after mocks are set up
import { loginUser, signoutUser } from "../auth.service";

describe("Auth Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up the mockGetAuthProvider to return our mockAuthProvider
    mockGetAuthProvider.mockReturnValue(mockAuthProvider);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("loginUser", () => {
    it("should login user successfully", async () => {
      const loginData = createMockLoginRequest();
      const mockAuthResponse = createMockAuthProviderSignInResponse();
      const mockUser = createMockUser({
        supabaseUserId: mockAuthResponse.user.id,
        email: loginData.email,
      });

      mockAuthProvider.signInWithPassword.mockResolvedValue(mockAuthResponse);
      mockGetUserBySupabaseId.mockResolvedValue(mockUser);

      const result = await loginUser(loginData);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("session");
      expect(result.user.email).toBe(loginData.email);
      expect(result.session.access_token).toBe(
        mockAuthResponse.session.access_token,
      );

      expect(mockAuthProvider.signInWithPassword).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockGetUserBySupabaseId).toHaveBeenCalledWith(
        mockAuthResponse.user.id,
      );
    });

    it("should throw UnauthorizedError when auth provider fails", async () => {
      const loginData = createMockLoginRequest();
      const authError = new Error("Invalid credentials from provider");

      mockAuthProvider.signInWithPassword.mockRejectedValue(authError);

      await expect(loginUser(loginData)).rejects.toThrow(UnauthorizedError);
      await expect(loginUser(loginData)).rejects.toThrow("Invalid credentials");

      expect(mockAuthProvider.signInWithPassword).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockGetUserBySupabaseId).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when user not found in MongoDB", async () => {
      const loginData = createMockLoginRequest();
      const mockAuthResponse = createMockAuthProviderSignInResponse();

      mockAuthProvider.signInWithPassword.mockResolvedValue(mockAuthResponse);
      mockGetUserBySupabaseId.mockResolvedValue(null); // User not found

      await expect(loginUser(loginData)).rejects.toThrow(UnauthorizedError);
      await expect(loginUser(loginData)).rejects.toThrow("Invalid credentials");

      expect(mockAuthProvider.signInWithPassword).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockGetUserBySupabaseId).toHaveBeenCalledWith(
        mockAuthResponse.user.id,
      );
    });

    it("should throw UnauthorizedError when getUserBySupabaseId fails", async () => {
      const loginData = createMockLoginRequest();
      const mockAuthResponse = createMockAuthProviderSignInResponse();
      const dbError = new Error("Database connection failed");

      mockAuthProvider.signInWithPassword.mockResolvedValue(mockAuthResponse);
      mockGetUserBySupabaseId.mockRejectedValue(dbError);

      await expect(loginUser(loginData)).rejects.toThrow(UnauthorizedError);
      await expect(loginUser(loginData)).rejects.toThrow("Invalid credentials");

      expect(mockAuthProvider.signInWithPassword).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockGetUserBySupabaseId).toHaveBeenCalledWith(
        mockAuthResponse.user.id,
      );
    });

    it("should throw UnauthorizedError when session data is missing", async () => {
      const loginData = createMockLoginRequest();
      const mockAuthResponse = {
        ...createMockAuthProviderSignInResponse(),
        session: null, // No session data
      };
      const mockUser = createMockUser({
        supabaseUserId: mockAuthResponse.user.id,
        email: loginData.email,
      });

      mockAuthProvider.signInWithPassword.mockResolvedValue(mockAuthResponse);
      mockGetUserBySupabaseId.mockResolvedValue(mockUser);

      await expect(loginUser(loginData)).rejects.toThrow(UnauthorizedError);
      await expect(loginUser(loginData)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("signoutUser", () => {
    it("should signout user successfully", async () => {
      mockAuthProvider.signOut.mockResolvedValue(undefined);

      await expect(signoutUser()).resolves.toBeUndefined();

      expect(mockAuthProvider.signOut).toHaveBeenCalledWith();
    });

    it("should not throw error when signout fails", async () => {
      const signoutError = new Error("Signout failed");
      mockAuthProvider.signOut.mockRejectedValue(signoutError);

      // Should not throw - errors are handled internally
      await expect(signoutUser()).resolves.toBeUndefined();

      expect(mockAuthProvider.signOut).toHaveBeenCalledWith();
    });
  });
});
