import { vi } from "vitest";
import { createMockAuthUser } from "../../../../../testUtils";
import type { AuthProvider } from "../../../../auth/types";

/**
 * Mock implementation for auth provider
 */
export const mockAuthProvider: AuthProvider = {
  createUser: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
};

/**
 * Setup default mock implementations for auth provider
 */
export function setupDefaultAuthProviderMocks() {
  // Default successful responses
  mockAuthProvider.createUser.mockResolvedValue(createMockAuthUser());
  mockAuthProvider.getUserById.mockResolvedValue(createMockAuthUser());
  mockAuthProvider.updateUser.mockResolvedValue(createMockAuthUser());
  mockAuthProvider.deleteUser.mockResolvedValue(undefined);
  mockAuthProvider.signOut.mockResolvedValue(undefined);

  // Default sign in response
  mockAuthProvider.signInWithPassword.mockResolvedValue({
    user: createMockAuthUser(),
    session: {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: createMockAuthUser(),
    },
  });
}

/**
 * Reset all auth provider mocks
 */
export function resetAuthProviderMocks() {
  Object.values(mockAuthProvider).forEach((mock) => {
    if (vi.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
  setupDefaultAuthProviderMocks();
}

/**
 * Mock specific auth provider scenarios
 */
export const authProviderScenarios = {
  createUserFailed: (
    errorMessage = "Failed to create user in auth provider",
  ) => {
    mockAuthProvider.createUser.mockRejectedValue(new Error(errorMessage));
  },

  updateUserFailed: (
    errorMessage = "Failed to update user in auth provider",
  ) => {
    mockAuthProvider.updateUser.mockRejectedValue(new Error(errorMessage));
  },

  deleteUserFailed: (
    errorMessage = "Failed to delete user from auth provider",
  ) => {
    mockAuthProvider.deleteUser.mockRejectedValue(new Error(errorMessage));
  },

  userNotFoundInAuth: () => {
    mockAuthProvider.getUserById.mockResolvedValue(null);
  },

  authProviderDown: (errorMessage = "Auth provider is unavailable") => {
    const error = new Error(errorMessage);
    Object.values(mockAuthProvider).forEach((mock) => {
      if (vi.isMockFunction(mock)) {
        mock.mockRejectedValue(error);
      }
    });
  },
};
