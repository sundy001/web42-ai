import { createAuthFetch } from "@web42-ai/next-util";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export const API_ENDPOINTS = {
  auth: {
    login: "/api/v1/auth/login",
    signout: "/api/v1/auth/signout",
    refresh: "/api/v1/auth/refresh",
    refreshApi: "/api/v1/auth/refresh/api",
    me: "/api/v1/auth/me",
  },
  users: {
    list: "/api/v1/admin/users",
    detail: (id: string) => `/api/v1/admin/users/${id}`,
    create: "/api/v1/admin/users",
    update: (id: string) => `/api/v1/admin/users/${id}`,
    delete: (id: string) => `/api/v1/admin/users/${id}`,
    restore: (id: string) => `/api/v1/admin/users/${id}/restore`,
  },
} as const;

// Create configured authFetch instance
export const authFetch = createAuthFetch({
  baseUrl: API_BASE_URL,
  endpoints: {
    refresh: API_ENDPOINTS.auth.refresh,
    refreshApi: API_ENDPOINTS.auth.refreshApi,
  },
});
