import { databaseStore } from "@/stores/database";
import { ObjectId, WithoutId } from "mongodb";
import type { CreateProjectData, MongoProject } from "./types";

const COLLECTION_NAME = "projects";

function getCollection() {
  const db = databaseStore.getDatabase();
  return db.collection<WithoutId<MongoProject>>(COLLECTION_NAME);
}

export async function createProject(
  projectData: CreateProjectData,
): Promise<MongoProject> {
  const collection = getCollection();
  const now = new Date().toISOString();

  const mongoProject: WithoutId<MongoProject> = {
    userId: projectData.userId,
    name: projectData.name,
    activeDeploymentId: null,
    versions: [],
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(mongoProject);

  return {
    _id: result.insertedId,
    ...mongoProject,
  };
}

export async function getProjectById(
  id: string,
  includeDeleted = false,
): Promise<MongoProject | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const filter: Record<string, unknown> = { _id: new ObjectId(id) };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return collection.findOne(filter);
}

export async function verifyProjectOwnership(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const collection = getCollection();

  if (!ObjectId.isValid(projectId)) {
    return false;
  }

  const project = await collection.findOne(
    {
      _id: new ObjectId(projectId),
      userId,
      status: { $ne: "deleted" },
    },
    { projection: { _id: 1 } },
  );

  return project !== null;
}
