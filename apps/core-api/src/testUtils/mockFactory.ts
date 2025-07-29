import { ObjectId } from "mongodb";
import type { CombinedUser, User } from "../domains/admin/users/types";
import type { AuthUser } from "../domains/auth/types";

/**
 * Factory for creating mock User documents (MongoDB)
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date().toISOString();
  const objectId = new ObjectId();

  return {
    _id: objectId,
    supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    role: "user",
    status: "active",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Factory for creating mock AuthUser objects (from auth provider)
 */
export function createMockAuthUser(
  overrides: Partial<AuthUser> = {},
): AuthUser {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    name: "Test User",
    avatarUrl: "https://example.com/avatar.jpg",
    authProvider: "email",
    lastSignInAt: new Date().toISOString(),
    emailConfirmedAt: new Date().toISOString(),
    phoneConfirmedAt: null,
    phone: null,
    userMetadata: { name: "Test User" },
    appMetadata: { role: "user" },
    ...overrides,
  };
}

/**
 * Factory for creating mock CombinedUser objects
 */
export function createMockCombinedUser(
  overrides: Partial<CombinedUser> = {},
): CombinedUser {
  const mockUser = createMockUser();
  const mockAuthUser = createMockAuthUser();

  return {
    ...mockUser,
    // Convert auth user fields to match CombinedUser interface
    name: mockAuthUser.name,
    avatarUrl: mockAuthUser.avatarUrl,
    authProvider: mockAuthUser.authProvider,
    lastSignInAt: mockAuthUser.lastSignInAt || undefined,
    emailConfirmedAt: mockAuthUser.emailConfirmedAt || undefined,
    phoneConfirmedAt: mockAuthUser.phoneConfirmedAt || undefined,
    phone: mockAuthUser.phone || undefined,
    userMetadata: mockAuthUser.userMetadata,
    appMetadata: mockAuthUser.appMetadata,
    ...overrides,
  };
}

/**
 * Factory for creating multiple mock users
 */
export function createMockUsers(
  count: number,
  overridesFn?: (index: number) => Partial<User>,
): User[] {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesFn ? overridesFn(index) : {};
    return createMockUser({
      email: `user${index}@example.com`,
      supabaseUserId: `550e8400-e29b-41d4-a716-44665544000${index}`,
      ...overrides,
    });
  });
}

/**
 * Factory for creating paginated user list response
 */
export function createMockUserListResponse(
  users: CombinedUser[],
  page = 1,
  limit = 10,
  total?: number,
) {
  const actualTotal = total ?? users.length;
  return {
    users,
    total: actualTotal,
    page,
    limit,
    totalPages: Math.ceil(actualTotal / limit),
  };
}

/**
 * Factory for creating error responses
 */
export function createMockErrorResponse(
  error: string,
  message?: string,
  details?: Array<{ field: string; message: string }>,
) {
  return {
    error,
    ...(message && { message }),
    ...(details && { details }),
  };
}
