import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./auth/authRoutes.js";
import { openApiDocument } from "./openapi/openApiConfig.js";
import { databaseStore, getHealthStatus } from "./stores/index.js";
import { userRoutes } from "./users/index.js";
import { errorHandler } from "./users/middleware.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
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

// User routes
app.use("/api/v1/users", userRoutes);

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Core API",
    description: "Express server for web42-ai platform",
    endpoints: {
      health: "/health",
      api: "/api/v1/status",
      auth: "/api/v1/auth",
      users: "/api/v1/users",
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
  console.log("\n🛑 Shutting down Core API server...");
  try {
    await databaseStore.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

// Start server with database initialization
async function startServer() {
  try {
    await databaseStore.connect();

    app.listen(PORT, () => {
      const config = databaseStore.getConfig();
      console.log(`🚀 Core API server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
      console.log(`💾 Database: ${config.databaseName} on ${config.uri}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Export database access for other modules
export function getDatabase() {
  return databaseStore.getDatabase();
}

export default app;
