import type { GetMessagesQuery, MessagesListResponse } from "@web42-ai/types";
import { API_ENDPOINTS, authFetch } from "./config";

/**
 * Fetch messages for a project with optional pagination cursor
 */
export const getMessages = async (
  params: GetMessagesQuery,
): Promise<MessagesListResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("projectId", params.projectId);
  if (params.timestamp) searchParams.set("timestamp", params.timestamp);
  if (typeof params.limit === "number")
    searchParams.set("limit", String(params.limit));

  const { data } = await authFetch<MessagesListResponse>(
    `${API_ENDPOINTS.messages.list}?${searchParams.toString()}`,
  );

  return data;
};
