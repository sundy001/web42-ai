import { ObjectId } from "mongodb";
import { getSupabaseAdmin } from "../config/supabase.js";
import type {
  CreateUserFromSupabaseRequest,
  PaginationOptions,
  UpdateUserRequest,
  User,
  UserFilters,
  UserListResponse,
} from "../users/types.js";
import { databaseStore } from "./database.js";

const COLLECTION_NAME = "users";

function getCollection() {
  const db = databaseStore.getDatabase();
  return db.collection<User>(COLLECTION_NAME);
}

export async function createUserFromSupabase(
  userData: CreateUserFromSupabaseRequest,
): Promise<User> {
  const collection = getCollection();
  const now = new Date().toISOString();

  // Get additional user data from Supabase
  const supabaseAdmin = getSupabaseAdmin();
  const { data: supabaseUser, error } =
    await supabaseAdmin.auth.admin.getUserById(userData.supabaseUserId);

  if (error || !supabaseUser.user) {
    throw new Error(`Failed to fetch user from Supabase: ${error?.message}`);
  }

  const user: Omit<User, "_id"> = {
    supabaseUserId: userData.supabaseUserId,
    email: userData.email,
    name:
      userData.name ||
      supabaseUser.user.user_metadata?.name ||
      supabaseUser.user.user_metadata?.full_name,
    avatarUrl:
      userData.avatarUrl || supabaseUser.user.user_metadata?.avatar_url,
    authProvider: userData.authProvider,
    status: "active",
    lastSignInAt: supabaseUser.user.last_sign_in_at,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(user);

  return {
    _id: result.insertedId,
    ...user,
  };
}

export async function getUserById(
  id: string,
  includeDeleted = false,
): Promise<User | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const filter: Record<string, unknown> = { _id: new ObjectId(id) };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return await collection.findOne(filter);
}

export async function getUserByEmail(
  email: string,
  includeDeleted = false,
): Promise<User | null> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { email };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return await collection.findOne(filter);
}

export async function getUserBySupabaseId(
  supabaseUserId: string,
  includeDeleted = false,
): Promise<User | null> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { supabaseUserId };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return await collection.findOne(filter);
}

export async function updateUser(
  id: string,
  updateData: UpdateUserRequest,
): Promise<User | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const updateDoc = {
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      status: { $ne: "deleted" },
    },
    { $set: updateDoc },
    { returnDocument: "after" },
  );

  return result || null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  // Soft delete by updating status to 'deleted'
  const result = await collection.updateOne(
    {
      _id: new ObjectId(id),
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "deleted",
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return result.modifiedCount > 0;
}

export async function permanentlyDeleteUser(id: string): Promise<boolean> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function restoreUser(id: string): Promise<User | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      status: "deleted",
    },
    {
      $set: {
        status: "active",
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: "after" },
  );

  return result || null;
}

export async function listUsers(
  filters: UserFilters = {},
  pagination: PaginationOptions = {},
): Promise<UserListResponse> {
  const collection = getCollection();
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  // Build filter query
  const query: Record<string, unknown> = {};

  if (filters.supabaseUserId) {
    query.supabaseUserId = filters.supabaseUserId;
  }
  if (filters.email) {
    query.email = { $regex: filters.email, $options: "i" };
  }
  if (filters.name) {
    query.name = { $regex: filters.name, $options: "i" };
  }
  if (filters.authProvider) {
    query.authProvider = filters.authProvider;
  }
  if (filters.status) {
    query.status = filters.status;
  }

  // Include deleted users only if explicitly requested
  if (!filters.includeDeleted) {
    query.status = query.status
      ? { $in: [query.status, "active", "inactive"] }
      : { $ne: "deleted" };
  }

  // Get total count and users in parallel
  const [total, users] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function userExists(
  email: string,
  excludeDeleted = true,
): Promise<boolean> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { email };

  if (excludeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  const count = await collection.countDocuments(filter);
  return count > 0;
}

export async function getUserStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  byAuthProvider: Record<string, number>;
}> {
  const collection = getCollection();

  const [total, active, inactive, deleted, byAuthProvider] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ status: "active" }),
    collection.countDocuments({ status: "inactive" }),
    collection.countDocuments({ status: "deleted" }),
    collection
      .aggregate([{ $group: { _id: "$authProvider", count: { $sum: 1 } } }])
      .toArray(),
  ]);

  const authProviderStats = byAuthProvider.reduce(
    (acc, item) => {
      acc[item._id] = item.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total,
    active,
    inactive,
    deleted,
    byAuthProvider: authProviderStats,
  };
}

export async function syncUserWithSupabase(
  supabaseUserId: string,
): Promise<User | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: supabaseUser, error } =
    await supabaseAdmin.auth.admin.getUserById(supabaseUserId);

  if (error || !supabaseUser.user) {
    return null;
  }

  const collection = getCollection();
  const now = new Date().toISOString();

  // Try to find existing user by supabaseUserId
  let existingUser = await getUserBySupabaseId(supabaseUserId, true);

  // If not found by supabaseUserId, try to find by email
  if (!existingUser) {
    existingUser = await getUserByEmail(supabaseUser.user.email!, true);
  }

  const userData = {
    supabaseUserId,
    email: supabaseUser.user.email!,
    name:
      supabaseUser.user.user_metadata?.name ||
      supabaseUser.user.user_metadata?.full_name,
    avatarUrl: supabaseUser.user.user_metadata?.avatar_url,
    authProvider:
      (supabaseUser.user.app_metadata?.provider as
        | "google"
        | "github"
        | "email") || "email",
    lastSignInAt: supabaseUser.user.last_sign_in_at,
    updatedAt: now,
  };

  if (existingUser) {
    // Update existing user
    const result = await collection.findOneAndUpdate(
      { _id: existingUser._id },
      { $set: userData },
      { returnDocument: "after" },
    );
    return result || null;
  } else {
    // Create new user
    const newUser: Omit<User, "_id"> = {
      ...userData,
      status: "active",
      createdAt: now,
    };

    const result = await collection.insertOne(newUser);
    return {
      _id: result.insertedId,
      ...newUser,
    };
  }
}
