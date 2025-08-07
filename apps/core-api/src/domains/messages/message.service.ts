import { verifyProjectOwnership } from "@/domains/projects/project.repository";
import { NotFoundError } from "@/utils/errors";
import type { ThreadMessage } from "@web42-ai/types";
import * as messageRepository from "./message.repository";

export async function createMessage(
  projectId: string,
  content: string,
  role: "user" | "assistant" = "user",
  contentType: "text" | "image" | "code" = "text",
): Promise<ThreadMessage> {
  const message = await messageRepository.createMessage({
    projectId,
    role,
    contentType,
    content,
  });

  // Return the user-facing message data
  return {
    id: message.messageId,
    role: message.role,
    contentType: message.contentType,
    content: message.content,
    createdAt: message.createdAt,
  };
}

export async function getMessagesForUser(
  userId: string,
  projectId: string,
  timestamp?: string,
  limit: number = 20,
): Promise<ThreadMessage[]> {
  // Verify project ownership
  const isOwner = await verifyProjectOwnership(projectId, userId);

  if (!isOwner) {
    throw new NotFoundError("Project not found");
  }

  const messages = await messageRepository.getMessagesByProjectId(
    projectId,
    timestamp,
    limit,
  );

  // Return only the user-facing message data
  return messages.map((message) => ({
    id: message.messageId,
    role: message.role,
    contentType: message.contentType,
    content: message.content,
    createdAt: message.createdAt,
  }));
}
