import type { ThreadMessage } from "@web42-ai/types";
import * as threadRepository from "./thread.repository";

/**
 * Create a new thread with an initial message
 */
export async function createThread(
  projectId: string,
  initialMessage: string,
): Promise<ThreadMessage[]> {
  const thread = await threadRepository.createThread({
    projectId,
    initialMessage,
  });

  // Return only the user-facing message data
  return thread.messages.map((message) => ({
    id: message.messageId,
    role: message.role,
    contentType: message.contentType,
    content: message.content,
    createdAt: message.createdAt,
  }));
}
