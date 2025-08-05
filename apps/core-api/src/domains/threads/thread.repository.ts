import { databaseStore } from "@/stores/database";
import { WithoutId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import type { CreateThreadData, MongoThread, ThreadMessage } from "./types";

const COLLECTION_NAME = "threads";

function getCollection() {
  const db = databaseStore.getDatabase();
  return db.collection<WithoutId<MongoThread>>(COLLECTION_NAME);
}

export async function createThread(
  threadData: CreateThreadData,
): Promise<MongoThread> {
  const collection = getCollection();
  const now = new Date().toISOString();

  const initialMessage: ThreadMessage = {
    messageId: uuidv4(),
    role: "user",
    contentType: "text",
    content: threadData.initialMessage,
    createdAt: now,
  };

  const mongoThread: WithoutId<MongoThread> = {
    projectId: threadData.projectId,
    messages: [initialMessage],
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(mongoThread);

  return {
    _id: result.insertedId,
    ...mongoThread,
  };
}
