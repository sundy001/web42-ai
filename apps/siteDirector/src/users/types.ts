import type { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  authProvider: string;
  status: 'active' | 'inactive' | 'deleted';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  authProvider: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  authProvider?: string;
  status?: 'active' | 'inactive';
}

export interface UserFilters {
  email?: string;
  name?: string;
  authProvider?: string;
  status?: 'active' | 'inactive';
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