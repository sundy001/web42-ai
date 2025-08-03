import { DataWithTokensResult } from "@web42-ai/express-util";
import { API_ENDPOINTS, authFetch } from "../config";
import { AuthenticationError } from "../errors";
import type {
  CreateUserData,
  MeResponse,
  UpdateUserData,
  User,
  UserListResponse,
} from "../types";

export const getCurrentUser = async (): Promise<
  DataWithTokensResult<MeResponse>
> => {
  try {
    return await authFetch<MeResponse>(API_ENDPOINTS.auth.me);
  } catch (error) {
    throw new AuthenticationError("Failed to get current user", {
      cause: error,
    });
  }
};

export const fetchUsers = async (
  page = 1,
  limit = 10,
): Promise<UserListResponse> => {
  const { data } = await authFetch<UserListResponse>(
    `${API_ENDPOINTS.users.list}?page=${page}&limit=${limit}`,
  );

  return data;
};

export const fetchUser = async (userId: string): Promise<User> => {
  const { data } = await authFetch<User>(API_ENDPOINTS.users.detail(userId));

  return data;
};

export const createUser = async (data: CreateUserData): Promise<User> => {
  const { data: user } = await authFetch<User>(API_ENDPOINTS.users.create, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return user;
};

export const updateUser = async (
  userId: string,
  data: UpdateUserData,
): Promise<User> => {
  const { data: user } = await authFetch<User>(
    API_ENDPOINTS.users.update(userId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );

  return user;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const { data } = await authFetch<void>(API_ENDPOINTS.users.delete(userId), {
    method: "DELETE",
  });

  return data;
};

export const restoreUser = async (userId: string): Promise<User> => {
  const { data: user } = await authFetch<User>(
    API_ENDPOINTS.users.restore(userId),
    {
      method: "POST",
    },
  );

  return user;
};
