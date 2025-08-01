import type { Request, Response } from "express";
import pino, { Logger } from "pino";
import { pinoHttp } from "pino-http";

export interface LoggerConfig {
  nodeEnv: "development" | "production" | "test";
  logLevel?: "error" | "warn" | "info" | "debug" | "trace" | "silent";
  isProduction: boolean;
  isTest: boolean;
}

// Environment-specific log levels
const getLogLevel = (config: LoggerConfig): string => {
  // Use explicit LOG_LEVEL if provided
  if (config.logLevel) {
    return config.logLevel;
  }

  // Default based on environment
  if (config.isProduction) {
    return "info";
  }
  if (config.isTest) {
    return "silent";
  }
  return "debug";
};

// CloudFlare-optimized Pino configuration
const createPinoConfig = (config: LoggerConfig) => ({
  level: getLogLevel(config),
  // Use pino-pretty in development for better readability
  transport:
    config.nodeEnv === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
            levelFirst: true,
          },
        }
      : undefined,
  // CloudFlare Workers Logs prefers structured JSON (production)
  formatters:
    config.nodeEnv !== "development"
      ? {
          level: (label: string) => ({ level: label.toUpperCase() }),
          log: (object: Record<string, unknown>) => object,
        }
      : undefined,
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
});

// Factory function to create logger with configuration
export const createLogger = (config: LoggerConfig): Logger => {
  return pino(createPinoConfig(config));
};

// Factory function to create HTTP logger middleware
export const createHttpLogger = (logger: Logger) => {
  return pinoHttp({
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
};

// Factory function to create child loggers
export const createChildLogger = (logger: Logger, module: string): Logger => {
  return logger.child({ module });
};
