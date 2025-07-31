import { vi } from "vitest";

export const setupAuthProviderMocks = () => {
  const authProviderMocks = vi.hoisted(() => ({
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    getUserById: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  }));

  vi.mock("@/domains/auth", () => ({
    getAuthProvider: () => authProviderMocks,
  }));

  return authProviderMocks;
};

export const setupUserRepositoryMocks = () => {
  const userRepoMocks = vi.hoisted(() => {
    return {
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
    };
  });

  vi.mock("../user.repository", () => userRepoMocks);

  return userRepoMocks;
};

export const setupUserServiceMocks = () => {
  const userServiceMocks = vi.hoisted(() => ({
    createUser: vi.fn(),
    getUserById: vi.fn(),
    getUserBySupabaseId: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    permanentlyDeleteUser: vi.fn(),
    restoreUser: vi.fn(),
    listUsers: vi.fn(),
    userExistsByEmail: vi.fn(),
    userExists: vi.fn(),
  }));

  vi.mock("../user.service", () => userServiceMocks);

  return userServiceMocks;
};
