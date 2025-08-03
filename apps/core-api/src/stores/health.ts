import databaseStore from "./database.js";
import type { BasicHealthStatus, HealthStatus } from "./types.js";

function getBaseHealthInfo() {
  return {
    service: "core-api" as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

async function checkDatabaseHealth() {
  try {
    const isConnected = await databaseStore.ping();

    if (!isConnected) {
      return { isConnected: false };
    }

    const config = databaseStore.getConfig();

    const result = {
      isConnected: true,
      name: config.name,
    };

    // Only include connection pool metrics when pooling is enabled
    if (config.connectionPool) {
      const poolStatus = await databaseStore.getConnectionPoolStatus();
      return {
        ...result,
        connectionPool: {
          isHealthy: poolStatus.isHealthy,
          utilization: poolStatus.utilization,
          checkedOutConnections: poolStatus.metrics.checkedOutConnections,
          totalConnections: poolStatus.metrics.totalConnections,
          connectionEvents: poolStatus.metrics.connectionEvents,
        },
      };
    }

    return result;
  } catch {
    return { isConnected: false };
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const baseInfo = getBaseHealthInfo();
  const dbHealth = await checkDatabaseHealth();

  if (dbHealth.isConnected && "name" in dbHealth) {
    return {
      status: "ok",
      ...baseInfo,
      database: {
        status: "connected",
        name: dbHealth.name,
        ...("connectionPool" in dbHealth && {
          connectionPool: dbHealth.connectionPool,
        }),
      },
    };
  }

  return {
    status: "error",
    ...baseInfo,
    database: {
      status: "disconnected",
      error: "Database connection failed",
    },
  };
}

export function getBasicStatus(): BasicHealthStatus {
  return {
    status: "ok",
    ...getBaseHealthInfo(),
  };
}
