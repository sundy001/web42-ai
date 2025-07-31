import { databaseStore } from "@/stores/database";
import { ObjectId, WithoutId } from "mongodb";
import type {
  CreateUserData,
  MongoUser,
  PaginationOptionsDb,
  UpdateUserData,
  UserFiltersDb,
  UserListResponseDb,
} from "./types";

const COLLECTION_NAME = "users";

function getCollection() {
  const db = databaseStore.getDatabase();
  // MongoDB's collection type automatically handles _id insertion
  return db.collection<WithoutId<MongoUser>>(COLLECTION_NAME);
}

// Database-only operations - no auth provider coordination

export async function createUser(userData: CreateUserData): Promise<MongoUser> {
  const collection = getCollection();
  const now = new Date().toISOString();

  const mongoUser: WithoutId<MongoUser> = {
    supabaseUserId: userData.supabaseUserId,
    email: userData.email,
    role: userData.role,
    status: userData.status,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await collection.insertOne(mongoUser);

    return {
      _id: result.insertedId,
      ...mongoUser,
    };
  } catch (error) {
    // Handle duplicate key error for email
    if (
      (error as { code?: number; keyPattern?: { email?: number } }).code ===
        11000 &&
      (error as { keyPattern?: { email?: number } }).keyPattern?.email
    ) {
      throw new Error(`Email already registered (${userData.email})`);
    }
    throw error;
  }
}

export async function getUserById(
  id: string,
  includeDeleted = false,
): Promise<MongoUser | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const filter: Record<string, unknown> = { _id: new ObjectId(id) };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return collection.findOne(filter);
}

export async function getUserByEmail(
  email: string,
  includeDeleted = false,
): Promise<MongoUser | null> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { email };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return collection.findOne(filter);
}

export async function getUserBySupabaseId(
  supabaseUserId: string,
  includeDeleted = false,
): Promise<MongoUser | null> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { supabaseUserId };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return collection.findOne(filter);
}

export async function updateUser(
  id: string,
  updateData: UpdateUserData,
): Promise<MongoUser | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const updateDoc = {
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id), status: { $ne: "deleted" } },
    { $set: updateDoc },
    { returnDocument: "after" },
  );

  return result;
}

export async function deleteUser(id: string): Promise<boolean> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await collection.updateOne(
    {
      _id: new ObjectId(id),
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "deleted" as const,
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

export async function restoreUser(id: string): Promise<MongoUser | null> {
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
        status: "active" as const,
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
}

export async function listUsers(
  filters: UserFiltersDb = {},
  pagination: PaginationOptionsDb = {},
): Promise<UserListResponseDb> {
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
    items: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function userExistsByEmail(email: string): Promise<boolean> {
  const collection = getCollection();

  const filter: Record<string, unknown> = { email };

  const count = await collection.countDocuments(filter);
  return count > 0;
}

export async function userExists(id: string): Promise<boolean> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return false;
  }

  const filter: Record<string, unknown> = { _id: new ObjectId(id) };

  // Don't count deleted users
  filter.status = { $ne: "deleted" };

  const count = await collection.countDocuments(filter);
  return count > 0;
}
