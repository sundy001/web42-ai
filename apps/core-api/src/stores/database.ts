import { Db, MongoClient } from "mongodb";

import { config as systemConfig } from "@/config";
import { dbLogger } from "@/config/logger";

export interface DatabaseConfig {
  uri: string;
  databaseName: string;
}

class DatabaseStore {
  private client: MongoClient | null = null;
  private database: Db | null = null;
  private config: DatabaseConfig;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      uri: config?.uri || systemConfig.database.uri,
      databaseName: config?.databaseName || systemConfig.database.name,
    };
  }

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.config.uri);
      await this.client.connect();
      this.database = this.client.db(this.config.databaseName);
      dbLogger.info(
        {
          database: this.config.databaseName,
          uri: this.config.uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
        },
        "✅ Connected to MongoDB",
      );
    } catch (error) {
      dbLogger.error(
        { err: error, database: this.config.databaseName },
        "❌ Failed to connect to MongoDB",
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.database = null;
        dbLogger.info("✅ MongoDB connection closed");
      }
    } catch (error) {
      dbLogger.error({ err: error }, "❌ Error closing MongoDB connection");
      throw error;
    }
  }

  getDatabase(): Db {
    if (!this.database) {
      throw new Error(
        "Database not initialized. Make sure to call connect() first.",
      );
    }
    return this.database;
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error(
        "MongoDB client not initialized. Make sure to call connect() first.",
      );
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.client !== null && this.database !== null;
  }

  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.database) {
        return false;
      }
      await this.database.admin().ping();
      return true;
    } catch (error) {
      dbLogger.error({ err: error }, "❌ Database ping failed");
      return false;
    }
  }
}

export const databaseStore = new DatabaseStore();
export default databaseStore;
