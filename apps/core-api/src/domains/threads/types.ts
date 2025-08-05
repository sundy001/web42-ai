import type { ObjectId } from "mongodb";

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

/**
 * Message role enum
 */
export type MessageRole = "user" | "assistant";

/**
 * Content type enum
 */
export type ContentType = "text" | "image" | "code";

/**
 * Thread message
 */
export interface ThreadMessage {
  messageId: string;
  role: MessageRole;
  contentType: ContentType;
  content: string;
  createdAt: string;
}

/**
 * Thread entity as stored in MongoDB
 */
export interface MongoThread {
  _id: ObjectId;
  projectId: string;
  messages: ThreadMessage[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// REPOSITORY LAYER TYPES
// =============================================================================

/**
 * Data required to create a new thread
 */
export interface CreateThreadData {
  projectId: string;
  initialMessage: string;
}
