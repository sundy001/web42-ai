import type { User } from "./user.types";

// Database-only operations for user store
export interface CreateUserData {
  supabaseUserId: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "deleted";
}

export interface UpdateUserData {
  role?: "admin" | "user";
  status?: "active" | "inactive";
}

export interface UserFiltersDb {
  supabaseUserId?: string;
  email?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive";
  includeDeleted?: boolean;
}

export interface PaginationOptionsDb {
  page?: number;
  limit?: number;
}

export interface UserListResponseDb {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
