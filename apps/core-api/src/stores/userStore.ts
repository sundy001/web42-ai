import { ObjectId } from "mongodb";
import type { User } from "../users/types";
import { databaseStore } from "./database";
import type {
  CreateUserData,
  PaginationOptionsDb,
  UpdateUserData,
  UserFiltersDb,
  UserListResponseDb,
} from "./userStoreTypes";

const COLLECTION_NAME = "users";

function getCollection() {
  const db = databaseStore.getDatabase();
  return db.collection<User>(COLLECTION_NAME);
}

// Database-only operations - no auth provider coordination

export async function createUser(userData: CreateUserData): Promise<User> {
  const collection = getCollection();
  const now = new Date().toISOString();

  const mongoUser: Omit<User, "_id"> = {
    supabaseUserId: userData.supabaseUserId,
    email: userData.email,
    role: userData.role,
    status: userData.status,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(mongoUser);

  return {
    _id: result.insertedId,
    ...mongoUser,
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

  return collection.findOne(filter);
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

  return collection.findOne(filter);
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

  return collection.findOne(filter);
}

export async function updateUser(
  id: string,
  updateData: UpdateUserData,
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
