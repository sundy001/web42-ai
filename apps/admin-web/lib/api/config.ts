export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export const API_ENDPOINTS = {
  users: {
    list: "/api/v1/users",
    detail: (id: string) => `/api/v1/users/${id}`,
    create: "/api/v1/users",
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
    restore: (id: string) => `/api/v1/users/${id}/restore`,
  },
} as const;
