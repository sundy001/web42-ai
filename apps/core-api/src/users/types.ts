import type { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  supabaseUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  authProvider: string;
  status: "active" | "inactive" | "deleted";
  lastSignInAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserFromSupabaseRequest {
  supabaseUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  authProvider: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string;
  status?: "active" | "inactive";
}

export interface UserFilters {
  supabaseUserId?: string;
  email?: string;
  name?: string;
  authProvider?: string;
  status?: "active" | "inactive";
  includeDeleted?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
