import { databaseStore } from "@/stores/database";
import { WithoutId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import type { CreateMessageData, MongoMessage } from "./types";

const COLLECTION_NAME = "messages";

function getCollection() {
  const db = databaseStore.getDatabase();
  return db.collection<WithoutId<MongoMessage>>(COLLECTION_NAME);
}

/**
 * Create a new message
 */
export async function createMessage(
  messageData: CreateMessageData,
): Promise<MongoMessage> {
  const collection = getCollection();
  const now = new Date().toISOString();

  const mongoMessage: WithoutId<MongoMessage> = {
    projectId: messageData.projectId,
    messageId: uuidv4(),
    role: messageData.role,
    contentType: messageData.contentType,
    content: messageData.content,
    createdAt: now,
  };

  const result = await collection.insertOne(mongoMessage);

  return {
    _id: result.insertedId,
    ...mongoMessage,
  };
}

/**
 * Get messages for a project with cursor-based pagination
 * Now uses direct MongoDB queries with index optimization
 */
export async function getMessagesByProjectId(
  projectId: string,
  timestamp?: string,
  limit: number = 20,
): Promise<MongoMessage[]> {
  const collection = getCollection();

  // Build query
  const query: Record<string, unknown> = { projectId };

  // Add timestamp filter if provided (cursor-based pagination)
  if (timestamp) {
    query.createdAt = { $lt: timestamp };
  }

  // Query messages directly with proper indexing
  // This will use a compound index on (projectId, createdAt)
  const messages = await collection
    .find(query)
    .sort({ createdAt: -1 }) // Newest first
    .limit(limit)
    .toArray();

  return messages as MongoMessage[];
}

/**
 * Create index for efficient message queries
 * This should be called during database initialization
 */
export async function createIndexes(): Promise<void> {
  const collection = getCollection();

  // Compound index for efficient queries by projectId and sorting by createdAt
  await collection.createIndex(
    { projectId: 1, createdAt: -1 },
    { name: "projectId_createdAt_idx" },
  );
}
