import { AuthUser } from "@/domains/auth";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserListResponse,
} from "@web42-ai/types/users";
import { ObjectId, WithId } from "mongodb";
import type { MongoUser } from "../types";

// Test constants
const MOCK_EMAIL = "test@example.com";
const MOCK_TIMESTAMP = "2024-01-01T00:00:00.000Z";
const TEST_USER_NAME = "Test User";

// Mock data factory functions
export const createMockMongoUser = (
  overrides: Partial<MongoUser> = {},
): WithId<MongoUser> => ({
  _id: new ObjectId(),
  supabaseUserId: "supabase-123",
  email: MOCK_EMAIL,
  name: TEST_USER_NAME,
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

export const createMockUser = (overrides: Partial<User> = {}): User => {
  return {
    id: new ObjectId().toString(),
    email: MOCK_EMAIL,
    name: TEST_USER_NAME,
    role: "user",
    status: "active",
    emailVerified: true,
    avatarUrl: "https://example.com/avatar.png",
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
    lastSignInAt: MOCK_TIMESTAMP,
    ...overrides,
  };
};

export const combineMockUser = (
  mongoUser: MongoUser,
  authUser: AuthUser,
): User => {
  return {
    id: mongoUser._id.toString(),
    email: mongoUser.email,
    name: mongoUser.name,
    role: mongoUser.role,
    status: mongoUser.status,
    emailVerified: Boolean(authUser.emailConfirmedAt),
    avatarUrl: authUser.avatarUrl,
    createdAt: mongoUser.createdAt,
    updatedAt: mongoUser.updatedAt,
    lastSignInAt: authUser.lastSignInAt || undefined,
  };
};

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
  items: users,
  total: users.length,
  page: 1,
  limit: 10,
  totalPages: Math.ceil(users.length / 10),
  ...overrides,
});
