// Example of how to use the new Pino logging system
import { authLogger, dbLogger, logger, projectLogger } from "@/config/logger";

// Basic logging examples
export function demonstrateLogging() {
  // Main logger
  logger.info("Server starting up");
  logger.debug(
    { config: { port: 3002, env: "development" } },
    "Configuration loaded",
  );

  // Child loggers with context
  authLogger.info(
    { userId: "user_123", email: "user@example.com" },
    "User authenticated",
  );
  authLogger.warn(
    { attempt: 3, email: "hacker@example.com" },
    "Multiple failed login attempts",
  );

  projectLogger.info(
    { projectId: "proj_456", userId: "user_123" },
    "Project created",
  );
  projectLogger.error(
    { err: new Error("Validation failed"), projectName: "My Project" },
    "Project creation failed",
  );

  dbLogger.info(
    { operation: "connect", database: "web42-ai" },
    "Database connection established",
  );

  // Sensitive data redaction example
  logger.info(
    {
      user: {
        id: "user_123",
        email: "user@example.com",
        password: "secret123", // This will be redacted
        token: "jwt_token_here", // This will be redacted
      },
    },
    "User data processed",
  );

  // Error logging with context
  try {
    throw new Error("Something went wrong");
  } catch (error) {
    logger.error({ err: error, context: "demo" }, "Demonstration error caught");
  }
}

// CloudFlare-optimized logging patterns
export function cloudflareLoggingPatterns() {
  // Request ID correlation
  const requestId = "req_1234567890_abcdef123";
  const childLogger = logger.child({ requestId });

  childLogger.info(
    { method: "GET", url: "/api/users", statusCode: 200, responseTime: 45 },
    "Request processed",
  );

  // Performance monitoring
  const startTime = Date.now();
  // ... operation ...
  const duration = Date.now() - startTime;

  logger.info(
    {
      operation: "database_query",
      duration,
      collection: "users",
      query: { status: "active" },
    },
    "Database operation completed",
  );

  // Error with correlation ID
  childLogger.error(
    {
      err: new Error("Network timeout"),
      service: "external_api",
      timeout: 5000,
    },
    "External service call failed",
  );
}
