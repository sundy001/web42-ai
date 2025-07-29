import { getAuthProvider } from "../auth";
import { combineUserData } from "./combineUserData";
import type {
  CombinedUser,
  CreateUserRequest,
  PaginationOptions,
  UpdateUserRequest,
  UserFilters,
  UserListResponse,
} from "./types";
import * as userStore from "./user.repository";

// High-level user service that coordinates between userStore and auth provider

export async function createUser(
  userData: CreateUserRequest,
): Promise<CombinedUser> {
  const authProvider = getAuthProvider();

  try {
    // Create user in auth provider first
    const authUser = await authProvider.createUser({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role || "user",
      emailConfirm: true, // Auto-confirm email for admin-created users
    });

    // Create user document in MongoDB
    const mongoUser = await userStore.createUser({
      supabaseUserId: authUser.id,
      email: userData.email,
      role: userData.role || "user",
      status: "active",
    });

    // Return combined user data
    return combineUserData(mongoUser);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUserById(
  id: string,
  includeDeleted = false,
): Promise<CombinedUser | null> {
  const mongoUser = await userStore.getUserById(id, includeDeleted);
  if (!mongoUser) {
    return null;
  }
  return combineUserData(mongoUser);
}

export async function getUserByEmail(
  email: string,
  includeDeleted = false,
): Promise<CombinedUser | null> {
  const mongoUser = await userStore.getUserByEmail(email, includeDeleted);
  if (!mongoUser) {
    return null;
  }
  return combineUserData(mongoUser);
}

export async function getUserBySupabaseId(
  supabaseUserId: string,
  includeDeleted = false,
): Promise<CombinedUser | null> {
  const mongoUser = await userStore.getUserBySupabaseId(
    supabaseUserId,
    includeDeleted,
  );
  if (!mongoUser) {
    return null;
  }
  return combineUserData(mongoUser);
}

export async function updateUser(
  id: string,
  updateData: UpdateUserRequest,
): Promise<CombinedUser | null> {
  const authProvider = getAuthProvider();

  try {
    // Get the current user to find the auth provider ID
    const currentUser = await userStore.getUserById(id);
    if (!currentUser) {
      return null;
    }

    // Update MongoDB document first
    const mongoResult = await userStore.updateUser(id, updateData);
    if (!mongoResult) {
      return null;
    }

    // Update auth provider user if role changed
    if (updateData.role) {
      await authProvider.updateUser(currentUser.supabaseUserId, {
        appMetadata: { role: updateData.role },
      });
    }

    return combineUserData(mongoResult);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const authProvider = getAuthProvider();

  try {
    // Get the current user to find the auth provider ID
    const currentUser = await userStore.getUserById(id);
    if (!currentUser) {
      return false;
    }

    // Delete from auth provider first
    try {
      await authProvider.deleteUser(currentUser.supabaseUserId);
    } catch (error) {
      console.error("Failed to delete auth provider user:", error);
      // Continue with soft delete in MongoDB even if auth provider deletion fails
    }

    // Soft delete in MongoDB
    return userStore.deleteUser(id);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function permanentlyDeleteUser(id: string): Promise<boolean> {
  return userStore.permanentlyDeleteUser(id);
}

export async function restoreUser(id: string): Promise<CombinedUser | null> {
  const mongoUser = await userStore.restoreUser(id);
  if (!mongoUser) {
    return null;
  }
  return combineUserData(mongoUser);
}

export async function listUsers(
  filters: UserFilters = {},
  pagination: PaginationOptions = {},
): Promise<UserListResponse> {
  const result = await userStore.listUsers(filters, pagination);

  // Combine each user with auth provider data
  const users = await Promise.all(
    result.users.map((user) => combineUserData(user)),
  );

  return {
    ...result,
    users,
  };
}

export async function userExists(email: string): Promise<boolean> {
  return userStore.userExists(email);
}

export async function getUserStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  byAuthProvider: Record<string, number>;
}> {
  return userStore.getUserStats();
}

// Sync function for creating user from auth provider (for OAuth flows)
export async function syncUserWithAuthProvider(
  authUserId: string,
): Promise<CombinedUser | null> {
  const authProvider = getAuthProvider();

  try {
    const authUser = await authProvider.getUserById(authUserId);
    if (!authUser) {
      return null;
    }

    // Check if user already exists
    const existingUser = await userStore.getUserBySupabaseId(authUserId);
    if (existingUser) {
      // User exists, return combined data
      return combineUserData(existingUser);
    }

    // Create new user in MongoDB from auth provider data
    const mongoUser = await userStore.createUser({
      supabaseUserId: authUserId,
      email: authUser.email!,
      role: (authUser.appMetadata?.role as "admin" | "user") || "user",
      status: "active",
    });

    return combineUserData(mongoUser);
  } catch (error) {
    console.error("Error syncing user with auth provider:", error);
    return null;
  }
}
