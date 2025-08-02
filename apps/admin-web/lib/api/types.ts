export interface User {
  _id: string;
  email: string;
  name: string;
  authProvider: string;
  status: "active" | "inactive" | "deleted";
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  authProvider: string;
}

export interface UpdateUserData {
  name: string;
  email: string;
  authProvider: string;
  status: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  is_anonymous: boolean;
}

export interface ApiError {
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
