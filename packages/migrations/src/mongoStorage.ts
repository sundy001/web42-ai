import type { Db } from "mongodb";
import type { UmzugStorage } from "umzug";

export class MongoDBStorage implements UmzugStorage {
  private db: Db;
  private collectionName: string;

  constructor(db: Db, collectionName = "_migrations") {
    this.db = db;
    this.collectionName = collectionName;
  }

  async logMigration({ name }: { name: string }): Promise<void> {
    const collection = this.db.collection(this.collectionName);
    await collection.insertOne({
      name,
      migratedAt: new Date(),
    });
  }

  async unlogMigration({ name }: { name: string }): Promise<void> {
    const collection = this.db.collection(this.collectionName);
    await collection.deleteOne({ name });
  }

  async executed(): Promise<string[]> {
    const collection = this.db.collection(this.collectionName);
    const migrations = await collection
      .find({})
      .sort({ migratedAt: 1 })
      .toArray();
    return migrations.map((m) => m.name);
  }
}
