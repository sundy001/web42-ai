import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { handleApiResponse } from "../errors";
import type {
  CreateUserData,
  UpdateUserData,
  User,
  UserListResponse,
} from "../types";

export const fetchUsers = async (
  page = 1,
  limit = 10,
): Promise<UserListResponse> => {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.users.list}?page=${page}&limit=${limit}`,
  );

  return handleApiResponse<UserListResponse>(response);
};

export const fetchUser = async (userId: string): Promise<User> => {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.users.detail(userId)}`,
  );

  return handleApiResponse<User>(response);
};

export const createUser = async (data: CreateUserData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.users.create}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleApiResponse<User>(response);
};

export const updateUser = async (
  userId: string,
  data: UpdateUserData,
): Promise<User> => {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.users.update(userId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return handleApiResponse<User>(response);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.users.delete(userId)}`,
    {
      method: "DELETE",
    },
  );

  await handleApiResponse<void>(response);
};

export const restoreUser = async (userId: string): Promise<User> => {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.users.restore(userId)}`,
    {
      method: "POST",
    },
  );

  return handleApiResponse<User>(response);
};
