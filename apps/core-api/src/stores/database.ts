import { Db, MongoClient, MongoClientOptions } from "mongodb";

import { config } from "@/config/env";
import { dbLogger } from "@/config/logger";

export interface DatabaseConfig {
  uri: string;
  name: string;
  connectionPool?: {
    maxPoolSize: number;
    minPoolSize: number;
    maxIdleTimeMS: number;
    socketTimeoutMS: number;
    connectTimeoutMS: number;
    maxConnecting: number;
    waitQueueTimeoutMS: number;
  };
}

export interface ConnectionPoolMetrics {
  checkedOutConnections: number;
  totalConnections: number;
  connectionEvents: {
    created: number;
    closed: number;
    checkoutFailed: number;
  };
}

class DatabaseStore {
  private client: MongoClient | null = null;
  private database: Db | null = null;
  private metrics: ConnectionPoolMetrics = {
    checkedOutConnections: 0,
    totalConnections: 0,
    connectionEvents: {
      created: 0,
      closed: 0,
      checkoutFailed: 0,
    },
  };

  constructor(private config: DatabaseConfig) {}

  private get hasConnectionPool(): boolean {
    return !!this.config.connectionPool;
  }

  private createMongoClientOptions(): MongoClientOptions {
    const options: MongoClientOptions = {
      ...(this.config.connectionPool
        ? {
            // Connection pool configuration
            maxPoolSize: this.config.connectionPool.maxPoolSize,
            minPoolSize: this.config.connectionPool.minPoolSize,
            maxConnecting: this.config.connectionPool.maxConnecting,

            // Timeout configuration
            maxIdleTimeMS: this.config.connectionPool.maxIdleTimeMS,
            waitQueueTimeoutMS: this.config.connectionPool.waitQueueTimeoutMS,
            socketTimeoutMS: this.config.connectionPool.socketTimeoutMS,
            connectTimeoutMS: this.config.connectionPool.connectTimeoutMS,
          }
        : {}),

      // Monitoring and health
      heartbeatFrequencyMS: 10000,
      serverSelectionTimeoutMS: 30000,

      // Resilience
      retryWrites: true,
      retryReads: true,
      maxStalenessSeconds: 90,

      // Compression
      compressors: ["snappy", "zlib"],
      zlibCompressionLevel: 6,
    };

    return options;
  }

  private setupConnectionPoolMonitoring(): void {
    if (!this.client) return;

    // Monitor connection creation
    this.client.on("connectionCreated", (event) => {
      this.metrics.connectionEvents.created++;
      this.metrics.totalConnections++;
      dbLogger.debug(
        {
          connectionId: event.connectionId,
          total: this.metrics.totalConnections,
        },
        "➕ MongoDB connection created",
      );
    });

    // Monitor connection closure
    this.client.on("connectionClosed", (event) => {
      this.metrics.connectionEvents.closed++;
      this.metrics.totalConnections--;
      dbLogger.debug(
        {
          connectionId: event.connectionId,
          reason: event.reason,
          total: this.metrics.totalConnections,
        },
        "➖ MongoDB connection closed",
      );
    });

    // Monitor connection checkouts
    this.client.on("connectionCheckedOut", (event) => {
      this.metrics.checkedOutConnections++;
      dbLogger.debug(
        {
          connectionId: event.connectionId,
          checkedOut: this.metrics.checkedOutConnections,
        },
        "🔓 MongoDB connection checked out",
      );
    });

    // Monitor connection check-ins
    this.client.on("connectionCheckedIn", (event) => {
      this.metrics.checkedOutConnections--;
      dbLogger.debug(
        {
          connectionId: event.connectionId,
          checkedOut: this.metrics.checkedOutConnections,
        },
        "🔒 MongoDB connection checked in",
      );
    });

    // Monitor connection checkout failures
    this.client.on("connectionCheckOutFailed", (event) => {
      this.metrics.connectionEvents.checkoutFailed++;
      dbLogger.warn(
        {
          reason: event.reason,
          failures: this.metrics.connectionEvents.checkoutFailed,
        },
        "❌ MongoDB connection checkout failed",
      );
    });

    // Monitor pool creation and closure
    this.client.on("connectionPoolCreated", (event) => {
      dbLogger.info(
        { address: event.address, maxPoolSize: event.options?.maxPoolSize },
        "🏊 MongoDB connection pool created",
      );
    });

    this.client.on("connectionPoolClosed", (event) => {
      dbLogger.info(
        { address: event.address },
        "🏊 MongoDB connection pool closed",
      );
    });

    // Log periodic pool statistics
    setInterval(() => {
      if (this.isConnected()) {
        dbLogger.debug(this.metrics, "📊 MongoDB connection pool metrics");
      }
    }, 3600000); // Log every hour
  }

  private buildLogData(options: MongoClientOptions) {
    const baseData = {
      database: this.config.name,
      uri: this.config.uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
    };

    return this.hasConnectionPool
      ? {
          ...baseData,
          connectionPool: {
            maxPoolSize: options.maxPoolSize,
            minPoolSize: options.minPoolSize,
            maxIdleTimeMS: options.maxIdleTimeMS,
            socketTimeoutMS: options.socketTimeoutMS,
          },
        }
      : baseData;
  }

  async connect(): Promise<void> {
    try {
      const options = this.createMongoClientOptions();
      this.client = new MongoClient(this.config.uri, options);

      if (this.hasConnectionPool) {
        // Setup connection pool monitoring before connecting
        this.setupConnectionPoolMonitoring();
      }

      await this.client.connect();
      this.database = this.client.db(this.config.name);

      dbLogger.info(
        this.buildLogData(options),
        this.hasConnectionPool
          ? "✅ Connected to MongoDB with connection pool"
          : "✅ Connected to MongoDB",
      );

      if (this.hasConnectionPool) {
        // Warm up the connection pool
        await this.warmUpConnections();
      }
    } catch (error) {
      dbLogger.error(
        { err: error, database: this.config.name },
        "❌ Failed to connect to MongoDB",
      );
      throw error;
    }
  }

  private async warmUpConnections(): Promise<void> {
    try {
      const minPoolSize = this.config.connectionPool?.minPoolSize || 5;
      dbLogger.info({ minPoolSize }, "🔥 Warming up MongoDB connection pool");

      // Perform ping operations to warm up connections
      const warmUpPromises = Array.from(
        { length: Math.min(minPoolSize, 3) },
        () => this.database?.admin().ping(),
      );

      await Promise.all(warmUpPromises);

      dbLogger.info(
        { connections: warmUpPromises.length },
        "✅ MongoDB connection pool warmed up",
      );
    } catch (error) {
      dbLogger.warn({ err: error }, "⚠️ Failed to warm up connection pool");
      // Don't throw - connection pool will still work
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

  getConnectionPoolMetrics(): ConnectionPoolMetrics {
    return { ...this.metrics };
  }

  async getConnectionPoolStatus(): Promise<{
    isHealthy: boolean;
    metrics: ConnectionPoolMetrics;
    utilization: number;
    timestamp: Date;
  }> {
    // If connection pooling is not enabled, return basic status
    if (!this.config.connectionPool) {
      return {
        isHealthy: this.isConnected(),
        metrics: this.getConnectionPoolMetrics(),
        utilization: -1,
        timestamp: new Date(),
      };
    }

    const maxPoolSize = this.config.connectionPool.maxPoolSize;
    const utilization =
      (this.metrics.checkedOutConnections / maxPoolSize) * 100;

    return {
      isHealthy: this.isConnected() && utilization < 90, // Consider unhealthy if >90% utilization
      metrics: this.getConnectionPoolMetrics(),
      utilization: Math.round(utilization * 100) / 100, // Round to 2 decimal places
      timestamp: new Date(),
    };
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

export const databaseStore = new DatabaseStore(config.database);
export default databaseStore;
