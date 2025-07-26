import databaseStore from "./database.js";
import type { BasicHealthStatus, HealthStatus } from "./health/types.js";

function getBaseHealthInfo() {
  return {
    service: "site-director" as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

async function checkDatabaseHealth() {
  try {
    const isConnected = await databaseStore.ping();

    if (isConnected) {
      const config = databaseStore.getConfig();
      return {
        isConnected: true,
        databaseName: config.databaseName,
      };
    }

    return { isConnected: false };
  } catch {
    return { isConnected: false };
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const baseInfo = getBaseHealthInfo();
  const dbHealth = await checkDatabaseHealth();

  if (dbHealth.isConnected) {
    return {
      status: "ok",
      ...baseInfo,
      database: {
        status: "connected",
        name: dbHealth.databaseName,
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
