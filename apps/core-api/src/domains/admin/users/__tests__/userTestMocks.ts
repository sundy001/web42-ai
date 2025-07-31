import { vi } from "vitest";

export const setupAuthProviderMocks = () => {
  const mocks = vi.hoisted(() => ({
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    getUserById: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  }));

  vi.mock("@/domains/auth", () => ({
    getAuthProvider: () => mocks,
  }));

  return mocks;
};

export const setupUserRepositoryMocks = () => {
  const userRepoMocks = vi.hoisted(() => {
    return {
      createUser: vi.fn(),
      getUserById: vi.fn(),
      getUserByEmail: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      restoreUser: vi.fn(),
      listUsers: vi.fn(),
      userExists: vi.fn(),
      userExistsByEmail: vi.fn(),
    };
  });

  vi.mock("../user.repository", () => userRepoMocks);

  return userRepoMocks;
};
