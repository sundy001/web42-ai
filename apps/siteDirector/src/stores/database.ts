import { MongoClient, Db } from 'mongodb';

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
      uri: config?.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      databaseName: config?.databaseName || process.env.DATABASE_NAME || 'web42-ai',
    };
  }

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.config.uri);
      await this.client.connect();
      this.database = this.client.db(this.config.databaseName);
      console.log(`✅ Connected to MongoDB: ${this.config.databaseName}`);
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.database = null;
        console.log('✅ MongoDB connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      throw error;
    }
  }

  getDatabase(): Db {
    if (!this.database) {
      throw new Error('Database not initialized. Make sure to call connect() first.');
    }
    return this.database;
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error('MongoDB client not initialized. Make sure to call connect() first.');
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
      console.error('❌ Database ping failed:', error);
      return false;
    }
  }
}

export const databaseStore = new DatabaseStore();
export default databaseStore;