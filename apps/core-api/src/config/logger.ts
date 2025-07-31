import {
  createChildLogger,
  createHttpLogger,
  createLogger,
  type Logger,
} from "@web42-ai/logger";

import { config } from "./env";

// Create the main logger instance with configuration
export const logger: Logger = createLogger({
  nodeEnv: config.server.nodeEnv,
  logLevel: config.server.logLevel,
  isProduction: config.server.isProduction,
  isTest: config.server.isTest,
});

// HTTP request logger middleware
export const httpLogger = createHttpLogger(logger);

// Specific child loggers for common modules
export const authLogger = createChildLogger(logger, "auth");
export const userLogger = createChildLogger(logger, "user");
export const projectLogger = createChildLogger(logger, "project");
export const dbLogger = createChildLogger(logger, "database");

export default logger;
