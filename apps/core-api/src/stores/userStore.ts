import { ObjectId } from "mongodb";
import { getSupabaseAdmin } from "../lib/supabase/supabase";
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

// Helper function to merge MongoDB user with Supabase user data
async function combineUserData(mongoUser: User): Promise<CombinedUser> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: supabaseUser, error } =
      await supabaseAdmin.auth.admin.getUserById(mongoUser.supabaseUserId);

    if (error || !supabaseUser.user) {
      console.warn(
        `Failed to fetch Supabase user ${mongoUser.supabaseUserId}:`,
        error?.message,
      );
      return mongoUser as CombinedUser;
    }

    const user = supabaseUser.user;
    return {
      ...mongoUser,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
      authProvider: user.app_metadata?.provider,
      lastSignInAt: user.last_sign_in_at,
      emailConfirmedAt: user.email_confirmed_at,
      phoneConfirmedAt: user.phone_confirmed_at,
      phone: user.phone,
    };
  } catch (error) {
    console.warn(
      `Error combining user data for ${mongoUser.supabaseUserId}:`,
      error,
    );
    return mongoUser as CombinedUser;
  }
}

export async function createUser(
  userData: CreateUserRequest,
): Promise<CombinedUser> {
  const collection = getCollection();
  const now = new Date().toISOString();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Create user in Supabase first
    const { data: supabaseUser, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          name: userData.name,
        },
        app_metadata: {
          role: userData.role || "user",
        },
        email_confirm: true, // Auto-confirm email for admin-created users
      });

    if (error || !supabaseUser.user) {
      throw new Error(`Failed to create Supabase user: ${error?.message}`);
    }

    // Create user document in MongoDB
    const mongoUser: Omit<User, "_id"> = {
      supabaseUserId: supabaseUser.user.id,
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
  const supabaseAdmin = getSupabaseAdmin();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  try {
    // Get the current user to find the Supabase ID
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

    // Update Supabase user if role changed
    if (updateData.role) {
      await supabaseAdmin.auth.admin.updateUserById(
        currentUser.supabaseUserId,
        {
          app_metadata: { role: updateData.role },
        },
      );
    }

    return combineUserData(mongoResult);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const collection = getCollection();
  const supabaseAdmin = getSupabaseAdmin();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  try {
    // Get the current user to find the Supabase ID
    const currentUser = await collection.findOne({
      _id: new ObjectId(id),
      status: { $ne: "deleted" },
    });

    if (!currentUser) {
      return false;
    }

    // Delete from Supabase first
    const { error } = await supabaseAdmin.auth.admin.deleteUser(
      currentUser.supabaseUserId,
    );
    if (error) {
      console.error("Failed to delete Supabase user:", error);
      // Continue with soft delete in MongoDB even if Supabase deletion fails
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

// Sync function for creating user from Supabase auth (for OAuth flows)
export async function syncUserWithSupabase(
  supabaseUserId: string,
): Promise<CombinedUser | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const collection = getCollection();

  try {
    const { data: supabaseUser, error } =
      await supabaseAdmin.auth.admin.getUserById(supabaseUserId);

    if (error || !supabaseUser.user) {
      return null;
    }

    // Check if user already exists
    const existingUser = await collection.findOne({ supabaseUserId });

    if (existingUser) {
      // User exists, return combined data
      return combineUserData(existingUser);
    }

    // Create new user in MongoDB from Supabase data
    const now = new Date().toISOString();
    const mongoUser: Omit<User, "_id"> = {
      supabaseUserId,
      email: supabaseUser.user.email!,
      role:
        (supabaseUser.user.app_metadata?.role as "admin" | "user") || "user",
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
    console.error("Error syncing user with Supabase:", error);
    return null;
  }
}
