import type { ObjectId } from "mongodb";

// MongoDB User document
export interface User {
  _id?: ObjectId;
  supabaseUserId: string;
  email: string; // Duplicated for performance
  role: "admin" | "user"; // Duplicated for performance
  status: "active" | "inactive" | "deleted";
  createdAt?: string;
  updatedAt?: string;
}

// Combined user data (MongoDB + Supabase)
export interface CombinedUser extends User {
  // Supabase fields
  name?: string;
  avatarUrl?: string;
  authProvider?: string;
  lastSignInAt?: string;
  emailConfirmedAt?: string;
  phoneConfirmedAt?: string;
  phone?: string;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  name?: string;
  role?: "admin" | "user";
}

export interface UpdateUserRequest {
  role?: "admin" | "user";
  status?: "active" | "inactive";
}

export interface UserFilters {
  supabaseUserId?: string;
  email?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive";
  includeDeleted?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: CombinedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
