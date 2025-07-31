import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { config } from "@/config";
import { httpLogger, logger } from "@/config/logger";
import adminRoutes from "@/domains/admin";
import { authRoutes } from "@/domains/auth";
import { errorHandler } from "@/middleware";
import { openApiDocument } from "@/openapi/openApiConfig";
import { databaseStore, getHealthStatus } from "@/stores";

const app = express();
const PORT = config.server.port;

// Middleware
app.use(helmet());
app.use(cors());
app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req, res) => {
  const healthStatus = await getHealthStatus();
  const statusCode = healthStatus.status === "ok" ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Core API Documentation",
  }),
);

// API documentation JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDocument);
});

// API routes
app.get("/api/v1/status", (req, res) => {
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
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Core API",
    description: "Express server for web42-ai platform",
    endpoints: {
      health: "/health",
      api: "/api/v1/status",
      auth: "/api/v1/auth",
      admin: "/api/v1/admin",
      documentation: "/api-docs",
    },
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

// Graceful shutdown handler
process.on("SIGINT", async () => {
  logger.info("🛑 Shutting down Core API server...");
  try {
    await databaseStore.disconnect();
    logger.info("✅ Server shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "❌ Error during shutdown");
    process.exit(1);
  }
});

// Start server with database initialization
async function startServer() {
  try {
    await databaseStore.connect();

    app.listen(PORT, () => {
      const databaseConfig = databaseStore.getConfig();
      logger.info(
        {
          port: PORT,
          environment: config.server.nodeEnv,
          database: databaseConfig.databaseName,
          uri: databaseConfig.uri,
        },
        "🚀 Core API server started",
      );

      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
      logger.info(`📖 API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to start server");
    process.exit(1);
  }
}

startServer();

// Export database access for other modules
export function getDatabase() {
  return databaseStore.getDatabase();
}

export default app;
