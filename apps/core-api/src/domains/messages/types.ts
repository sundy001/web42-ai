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
 * Message entity as stored in MongoDB
 */
export interface MongoMessage {
  _id: ObjectId;
  projectId: string;
  messageId: string;
  role: MessageRole;
  contentType: ContentType;
  content: string;
  createdAt: string;
}

// =============================================================================
// REPOSITORY LAYER TYPES
// =============================================================================

/**
 * Data required to create a new message
 */
export interface CreateMessageData {
  projectId: string;
  role: MessageRole;
  contentType: ContentType;
  content: string;
}
