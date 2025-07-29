import { ObjectId } from "mongodb";
import { getAuthProvider } from "../lib/authProvider";
import { combineUserData } from "../lib/user/combineUserData";
import type {
  CombinedUser,
  CreateUserRequest,
  PaginationOptions,
  UpdateUserRequest,
  User,
  UserFilters,
  UserListResponse,
} from "../users/types";
import { databaseStore } from "./database";

const COLLECTION_NAME = "users";

function getCollection() {
  const db = databaseStore.getDatabase();
  return db.collection<User>(COLLECTION_NAME);
}

// Helper function is now imported from lib/user/combineUserData.ts

export async function createUser(
  userData: CreateUserRequest,
): Promise<CombinedUser> {
  const collection = getCollection();
  const now = new Date().toISOString();
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
    const mongoUser: Omit<User, "_id"> = {
      supabaseUserId: authUser.id,
      email: userData.email,
      role: userData.role || "user",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(mongoUser);

    // Return combined user data
    return combineUserData({
      _id: result.insertedId,
      ...mongoUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUserById(
  id: string,
  includeDeleted = false,
): Promise<CombinedUser | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const filter: Record<string, unknown> = { _id: new ObjectId(id) };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  const mongoUser = await collection.findOne(filter);
  if (!mongoUser) {
    return null;
  }

  return combineUserData(mongoUser);
}

export async function getUserByEmail(
  email: string,
  includeDeleted = false,
): Promise<CombinedUser | null> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { email };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  const mongoUser = await collection.findOne(filter);
  if (!mongoUser) {
    return null;
  }

  return combineUserData(mongoUser);
}

export async function getUserBySupabaseId(
  supabaseUserId: string,
  includeDeleted = false,
): Promise<CombinedUser | null> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { supabaseUserId };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  const mongoUser = await collection.findOne(filter);
  if (!mongoUser) {
    return null;
  }

  return combineUserData(mongoUser);
}

export async function updateUser(
  id: string,
  updateData: UpdateUserRequest,
): Promise<CombinedUser | null> {
  const collection = getCollection();
  const authProvider = getAuthProvider();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  try {
    // Get the current user to find the auth provider ID
    const currentUser = await collection.findOne({
      _id: new ObjectId(id),
      status: { $ne: "deleted" },
    });

    if (!currentUser) {
      return null;
    }

    // Update MongoDB document
    const updateDoc = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const mongoResult = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), status: { $ne: "deleted" } },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

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
  const collection = getCollection();
  const authProvider = getAuthProvider();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  try {
    // Get the current user to find the auth provider ID
    const currentUser = await collection.findOne({
      _id: new ObjectId(id),
      status: { $ne: "deleted" },
    });

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
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function permanentlyDeleteUser(id: string): Promise<boolean> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function restoreUser(id: string): Promise<CombinedUser | null> {
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

  if (!result) {
    return null;
  }

  return combineUserData(result);
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
  if (filters.role) {
    query.role = filters.role;
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
  const [total, mongoUsers] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  // Combine each user with Supabase data
  const users = await Promise.all(
    mongoUsers.map((user) => combineUserData(user)),
  );

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

  const [total, active, inactive, deleted, byRole] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ status: "active" }),
    collection.countDocuments({ status: "inactive" }),
    collection.countDocuments({ status: "deleted" }),
    collection
      .aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
      .toArray(),
  ]);

  const roleStats = byRole.reduce(
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
    byAuthProvider: roleStats,
  };
}

// Sync function for creating user from auth provider (for OAuth flows)
export async function syncUserWithAuthProvider(
  authUserId: string,
): Promise<CombinedUser | null> {
  const authProvider = getAuthProvider();
  const collection = getCollection();

  try {
    const authUser = await authProvider.getUserById(authUserId);

    if (!authUser) {
      return null;
    }

    // Check if user already exists
    const existingUser = await collection.findOne({
      supabaseUserId: authUserId,
    });

    if (existingUser) {
      // User exists, return combined data
      return combineUserData(existingUser);
    }

    // Create new user in MongoDB from auth provider data
    const now = new Date().toISOString();
    const mongoUser: Omit<User, "_id"> = {
      supabaseUserId: authUserId,
      email: authUser.email!,
      role: (authUser.appMetadata?.role as "admin" | "user") || "user",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(mongoUser);

    return combineUserData({
      _id: result.insertedId,
      ...mongoUser,
    });
  } catch (error) {
    console.error("Error syncing user with auth provider:", error);
    return null;
  }
}
