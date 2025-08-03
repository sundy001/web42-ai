import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { config } from "@/config";
import { httpLogger, logger } from "@/config/logger";
import adminRoutes from "@/domains/admin";
import { authRoutes } from "@/domains/auth";
import { asyncHandler, errorHandler } from "@/middleware";
import { openApiDocument } from "@/openapi/openApiConfig";
import { databaseStore, getHealthStatus } from "@/stores";

const app = express();
const PORT = config.server.port;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.server.isProduction
      ? ["https://web42.ai", "https://www.web42.ai"]
      : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);
app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const healthStatus = await getHealthStatus();
    const statusCode = healthStatus.status === "ok" ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  }),
);

// Swagger documentation (development only)
if (!config.server.isProduction) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customCss: ".swagger-ui .top-bar { display: none }",
      customSiteTitle: "Core API Documentation",
    }),
  );

  // API documentation JSON
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openApiDocument);
  });
}

// API routes
app.get("/api/v1/status", (_req, res) => {
  res.json({
    message: "Core API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use("/api/v1/auth", authRoutes);

// Admin routes
app.use("/api/v1/admin", adminRoutes);

// Welcome endpoint
app.get("/", (_req, res) => {
  const endpoints: Record<string, string> = {
    health: "/health",
    api: "/api/v1/status",
    auth: "/api/v1/auth",
    admin: "/api/v1/admin",
  };

  // Add documentation endpoints only in development
  if (!config.server.isProduction) {
    endpoints.documentation = "/api-docs";
    endpoints.openapi = "/api-docs.json";
  }

  res.json({
    message: "Welcome to Core API",
    description: "Express server for web42-ai platform",
    endpoints,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(
    `🛑 Received ${signal}. Shutting down Core API server gracefully...`,
  );

  try {
    // Close database connection pool
    await databaseStore.disconnect();
    logger.info("✅ Database connection pool closed");

    logger.info("✅ Server shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "❌ Error during shutdown");
    process.exit(1);
  }
};

// Handle various shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // nodemon restart

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "❌ Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ err: reason, promise }, "❌ Unhandled rejection");
  process.exit(1);
});

// Start server with database initialization
async function startServer() {
  try {
    logger.info("🚀 Starting Core API server...");

    // Initialize database connection with pool
    await databaseStore.connect();

    app.listen(PORT, () => {
      const databaseConfig = databaseStore.getConfig();
      const poolConfig = databaseConfig.connectionPool;

      logger.info(
        {
          port: PORT,
          environment: config.server.nodeEnv,
          database: databaseConfig.name,
          uri: databaseConfig.uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
          connectionPool: {
            maxPoolSize: poolConfig?.maxPoolSize,
            minPoolSize: poolConfig?.minPoolSize,
            maxIdleTimeMS: poolConfig?.maxIdleTimeMS,
            socketTimeoutMS: poolConfig?.socketTimeoutMS,
          },
        },
        "🚀 Core API server started with MongoDB connection pool",
      );

      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
      if (!config.server.isProduction) {
        logger.info(`📖 API docs: http://localhost:${PORT}/api-docs`);
      }
    });

    // Server is now running - graceful shutdown handlers are already set up
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to start server");
    process.exit(1);
  }
}

startServer();

export default app;
