import { vi } from "vitest";
import { createMockUser } from "../../../../../testUtils";
import type { User, UserRepositoryListResponse } from "../../types";

/**
 * Mock implementation for user repository functions
 */
export const mockUserRepository = {
  createUser: vi.fn<[any], Promise<User>>(),
  getUserById: vi.fn<[string, boolean?], Promise<User | null>>(),
  getUserByEmail: vi.fn<[string, boolean?], Promise<User | null>>(),
  getUserBySupabaseId: vi.fn<[string, boolean?], Promise<User | null>>(),
  updateUser: vi.fn<[string, any], Promise<User | null>>(),
  deleteUser: vi.fn<[string], Promise<boolean>>(),
  permanentlyDeleteUser: vi.fn<[string], Promise<boolean>>(),
  restoreUser: vi.fn<[string], Promise<User | null>>(),
  listUsers: vi.fn<[any, any], Promise<UserRepositoryListResponse>>(),
  userExists: vi.fn<[string], Promise<boolean>>(),
};

/**
 * Setup default mock implementations that return reasonable defaults
 */
export function setupDefaultUserRepositoryMocks() {
  // Default successful responses
  mockUserRepository.createUser.mockResolvedValue(createMockUser());
  mockUserRepository.getUserById.mockResolvedValue(createMockUser());
  mockUserRepository.getUserByEmail.mockResolvedValue(createMockUser());
  mockUserRepository.getUserBySupabaseId.mockResolvedValue(createMockUser());
  mockUserRepository.updateUser.mockResolvedValue(createMockUser());
  mockUserRepository.deleteUser.mockResolvedValue(true);
  mockUserRepository.permanentlyDeleteUser.mockResolvedValue(true);
  mockUserRepository.restoreUser.mockResolvedValue(createMockUser());
  mockUserRepository.userExists.mockResolvedValue(false);

  // Default list response
  const mockUsers = [createMockUser()];
  mockUserRepository.listUsers.mockResolvedValue({
    users: mockUsers,
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
}

/**
 * Reset all mocks to their default state
 */
export function resetUserRepositoryMocks() {
  Object.values(mockUserRepository).forEach((mock) => {
    mock.mockReset();
  });
  setupDefaultUserRepositoryMocks();
}

/**
 * Mock specific scenarios
 */
export const userRepositoryScenarios = {
  userNotFound: () => {
    mockUserRepository.getUserById.mockResolvedValue(null);
    mockUserRepository.getUserByEmail.mockResolvedValue(null);
    mockUserRepository.updateUser.mockResolvedValue(null);
    mockUserRepository.restoreUser.mockResolvedValue(null);
  },

  userExists: () => {
    mockUserRepository.userExists.mockResolvedValue(true);
    mockUserRepository.getUserByEmail.mockResolvedValue(createMockUser());
  },

  deleteUserFailed: () => {
    mockUserRepository.deleteUser.mockResolvedValue(false);
  },

  emptyUserList: () => {
    mockUserRepository.listUsers.mockResolvedValue({
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  },

  repositoryError: (errorMessage = "Database error") => {
    const error = new Error(errorMessage);
    Object.values(mockUserRepository).forEach((mock) => {
      mock.mockRejectedValue(error);
    });
  },

  invalidObjectId: () => {
    mockUserRepository.getUserById.mockResolvedValue(null);
    mockUserRepository.updateUser.mockResolvedValue(null);
    mockUserRepository.deleteUser.mockResolvedValue(false);
    mockUserRepository.restoreUser.mockResolvedValue(null);
  },
};
