export const setupAuthProviderMocks = () => {
  const mocks = vi.hoisted(() => {
    return {
      authProviderMock: {
        createUser: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
        getUserById: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
    };
  });

  vi.mock("@/domains/auth", () => ({
    getAuthProvider: () => mocks.authProviderMock,
  }));

  return mocks.authProviderMock;
};

export const setupUserRepositoryMocks = () => {
  vi.mock("../user.repository", () => ({
    createUser: vi.fn(),
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    restoreUser: vi.fn(),
    listUsers: vi.fn(),
    userExists: vi.fn(),
    userExistsByEmail: vi.fn(),
  }));
};
