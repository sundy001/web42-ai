import type { Request, Response } from "express";
import pino, { Logger } from "pino";
import { pinoHttp } from "pino-http";

import { config } from "./env";

// Environment-specific log levels
const getLogLevel = (): string => {
  // Use explicit LOG_LEVEL if provided
  if (config.server.logLevel) {
    return config.server.logLevel;
  }

  // Default based on environment
  if (config.server.isProduction) {
    return "info";
  }
  if (config.server.isTest) {
    return "silent";
  }
  return "debug";
};

// CloudFlare-optimized Pino configuration
const pinoConfig = {
  level: getLogLevel(),
  // CloudFlare Workers Logs prefers structured JSON
  formatters: {
    level: (label: string) => ({ level: label.toUpperCase() }),
    log: (object: Record<string, unknown>) => object,
  },
  // Use ISO timestamps for CloudFlare compatibility
  timestamp: pino.stdTimeFunctions.isoTime,
  // Optimize for CloudFlare container environment
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    req: (req: Request) => ({
      method: req.method,
      url: req.url,
      headers: {
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"],
        accept: req.headers.accept,
      },
      remoteAddress: req.ip,
      remotePort: req.socket?.remotePort,
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode,
      headers: {
        "content-type": res.getHeader("content-type"),
        "content-length": res.getHeader("content-length"),
      },
    }),
    err: pino.stdSerializers.err,
  },
};

// Main logger instance
export const logger: Logger = pino(pinoConfig);

// HTTP request logger middleware
export const httpLogger = pinoHttp({
  logger,
  // Generate unique request IDs for tracing
  genReqId: (req: Request) => {
    return (
      req.headers["x-request-id"] ||
      req.headers["cf-ray"] ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    );
  },
  // Custom message for HTTP logs
  customLogLevel: (_req: Request, res: Response, err?: Error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    }
    if (res.statusCode >= 500 || err) {
      return "error";
    }
    return "info";
  },
  // Include response time in logs
  customSuccessMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req: Request, res: Response, err: Error) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
});

// Create child loggers for different modules
const createChildLogger = (module: string): Logger => {
  return logger.child({ module });
};

// Specific child loggers for common modules
export const authLogger = createChildLogger("auth");
export const userLogger = createChildLogger("user");
export const projectLogger = createChildLogger("project");
export const dbLogger = createChildLogger("database");

export default logger;
