export interface HealthStatus {
  status: "ok" | "error";
  service: string;
  timestamp: string;
  uptime: number;
  database: {
    status: "connected" | "disconnected";
    name?: string;
    error?: string;
    connectionPool?: {
      isHealthy: boolean;
      utilization: number;
      checkedOutConnections: number;
      totalConnections: number;
      connectionEvents: {
        created: number;
        closed: number;
        checkoutFailed: number;
      };
    };
  };
}

export interface BasicHealthStatus {
  status: "ok";
  service: string;
  timestamp: string;
  uptime: number;
}

export interface BaseHealthInfo {
  service: string;
  timestamp: string;
  uptime: number;
}
