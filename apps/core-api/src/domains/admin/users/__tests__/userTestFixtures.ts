import { AuthUser } from "@/domains/auth";
import { ObjectId, WithId } from "mongodb";
import type {
  CreateUserRequest,
  MongoUser,
  UpdateUserRequest,
  User,
  UserListResponse,
} from "../types";

// Test constants
export const MOCK_EMAIL = "test@example.com";
export const MOCK_TIMESTAMP = "2024-01-01T00:00:00.000Z";
export const TEST_USER_NAME = "Test User";

// Mock data factory functions
export const createMockMongoUser = (
  overrides: Partial<MongoUser> = {},
): WithId<MongoUser> => ({
  _id: new ObjectId(),
  supabaseUserId: "supabase-123",
  email: MOCK_EMAIL,
  role: "user",
  status: "active",
  createdAt: MOCK_TIMESTAMP,
  updatedAt: MOCK_TIMESTAMP,
  ...overrides,
});

export const createMockAuthUser = (
  overrides: Partial<AuthUser> = {},
): AuthUser => ({
  id: "supabase-123",
  email: MOCK_EMAIL,
  name: TEST_USER_NAME,
  avatarUrl: "https://example.com/avatar.png",
  authProvider: "supabase",
  lastSignInAt: MOCK_TIMESTAMP,
  emailConfirmedAt: MOCK_TIMESTAMP,
  ...overrides,
});

export const createMockUser = (
  overrides: Partial<User> = {},
): WithId<User> => ({
  ...createMockMongoUser(),
  name: TEST_USER_NAME,
  avatarUrl: "https://example.com/avatar.png",
  authProvider: "supabase",
  lastSignInAt: MOCK_TIMESTAMP,
  emailConfirmedAt: MOCK_TIMESTAMP,
  ...overrides,
});

// Mock request data factories
export const createMockCreateUserRequest = (
  overrides: Partial<CreateUserRequest> = {},
): CreateUserRequest => ({
  email: "newuser@example.com",
  password: "securePassword123",
  name: "New User",
  role: "user",
  ...overrides,
});

export const createMockUpdateUserRequest = (
  overrides: Partial<UpdateUserRequest> = {},
): UpdateUserRequest => {
  const baseData: UpdateUserRequest = {
    role: "admin",
    status: "inactive",
    ...overrides,
  };

  // Remove undefined values to maintain proper UpdateUserRequest shape
  return Object.fromEntries(
    Object.entries(baseData).filter(([, value]) => value !== undefined),
  ) as UpdateUserRequest;
};

// Mock response data factories
export const createMockUserListResponse = (
  users: User[] = [],
  overrides: Partial<UserListResponse> = {},
): UserListResponse => ({
  users,
  total: users.length,
  page: 1,
  limit: 10,
  totalPages: Math.ceil(users.length / 10),
  ...overrides,
});

// Common test data sets
export const createMockUserCollection = (count: number = 2): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      email: `user${index + 1}@example.com`,
      name: `User ${index + 1}`,
    }),
  );
};
