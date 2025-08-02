import { AuthUser, getAuthProvider } from "@/domains/auth";
import { ConflictError, NotFoundError } from "@/utils/errors";
import type { PaginationOptions } from "@/utils/types";
import { combineUserData } from "./combineUserData";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserFilters,
  UserListResponse,
} from "./types";
import * as userRepository from "./user.repository";

// High-level user service that coordinates between userStore and auth provider

export async function createUser(userData: CreateUserRequest): Promise<User> {
  // Check if user already exists by email, including soft deleted users
  const existingUser = await getMongoUserByEmail(userData.email, true);
  if (existingUser) {
    throw new ConflictError(`Email already registered (${userData.email})`);
  }

  const authProvider = getAuthProvider();

  // Create user in auth provider first
  const authUser = await authProvider.createUser({
    email: userData.email,
    password: userData.password,
    name: userData.name,
    role: userData.role,
    emailConfirm: true, // Auto-confirm email for admin-created users
  });

  // Create user document in MongoDB
  const mongoUser = await userRepository.createUser({
    supabaseUserId: authUser.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    status: "active",
  });

  // Return combined user data using existing authUser to avoid API call
  return combineUserData(mongoUser, authUser);
}

export async function getUserById(
  id: string,
  includeDeleted = false,
): Promise<User> {
  const mongoUser = await userRepository.getUserById(id, includeDeleted);

  if (!mongoUser) {
    throw new NotFoundError(`User not found by ID ${id}`);
  }

  return combineUserData(mongoUser);
}

export async function getUserBySupabaseId(
  supabaseUserId: string,
  includeDeleted = false,
): Promise<User> {
  const mongoUser = await userRepository.getUserBySupabaseId(
    supabaseUserId,
    includeDeleted,
  );
  if (!mongoUser) {
    throw new NotFoundError(`User not found by supabase ID ${supabaseUserId}`);
  }
  return combineUserData(mongoUser);
}

export async function updateUser(
  id: string,
  updateData: UpdateUserRequest,
): Promise<User> {
  const authProvider = getAuthProvider();

  // Update MongoDB document first
  const mongoUser = await userRepository.updateUser(id, updateData);
  if (!mongoUser) {
    throw new NotFoundError(`User not found for update ${id}`);
  }

  // Update auth provider user if role changed
  let authUser: AuthUser | undefined;
  if (updateData.role) {
    authUser = await authProvider.updateUser(mongoUser.supabaseUserId, {
      appMetadata: { role: updateData.role },
    });
  }

  return combineUserData(mongoUser, authUser);
}

export async function deleteUser(id: string): Promise<User> {
  const authProvider = getAuthProvider();

  // Get the current user to find the auth provider ID
  const currentUser = await userRepository.getUserById(id);
  if (!currentUser) {
    throw new NotFoundError(`User not found for deletion ${id}`);
  }

  // Delete from auth provider first
  const authUser = await authProvider.deleteUser(
    currentUser.supabaseUserId,
    true,
  );

  // Soft delete in MongoDB
  userRepository.deleteUser(id);

  return combineUserData(currentUser, authUser);
}

export async function permanentlyDeleteUser(id: string): Promise<boolean> {
  // TODO: should remove it from auth provider as well
  return userRepository.permanentlyDeleteUser(id);
}

export async function restoreUser(id: string): Promise<User> {
  const mongoUser = await userRepository.restoreUser(id);

  if (!mongoUser) {
    throw new NotFoundError(`User not found for restoration ${id}`);
  }
  return combineUserData(mongoUser);
}

export async function listUsers(
  filters: UserFilters = {},
  pagination: PaginationOptions = {},
): Promise<UserListResponse> {
  const result = await userRepository.listUsers(filters, pagination);

  // TODO: this is a bottleneck, we should fetch all users from auth provider in one go
  // Combine each user with auth provider data
  const items = await Promise.all(
    result.items.map((user) => combineUserData(user)),
  );

  return {
    ...result,
    items,
  };
}

export async function userExistsByEmail(email: string): Promise<boolean> {
  return userRepository.userExistsByEmail(email);
}

export async function userExists(id: string): Promise<boolean> {
  return userRepository.userExists(id);
}

async function getMongoUserByEmail(
  email: string,
  includeDeleted = false,
): Promise<User | null> {
  const mongoUser = await userRepository.getUserByEmail(email, includeDeleted);
  if (!mongoUser) {
    return null;
  }
  return mongoUser;
}
