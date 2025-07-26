export interface HealthStatus {
  status: "ok" | "error";
  service: string;
  timestamp: string;
  uptime: number;
  database: {
    status: "connected" | "disconnected";
    name?: string;
    error?: string;
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
