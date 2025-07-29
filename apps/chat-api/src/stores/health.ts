export interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  services: {
    api: {
      status: "healthy" | "unhealthy";
      uptime: number;
    };
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  try {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: "healthy",
          uptime: process.uptime(),
        },
      },
    };
  } catch (_error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: "unhealthy",
          uptime: process.uptime(),
        },
      },
    };
  }
}
