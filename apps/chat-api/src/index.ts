import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { chatRoutes } from "./chat/index.js";
import { errorHandler } from "./chat/middleware.js";
import { openApiDocument } from "./openapi/openApiConfig.js";
import { getHealthStatus } from "./stores/index.js";

const app = express();
const PORT = 3003; // Default port for Chat API

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
    customSiteTitle: "Chat API Documentation",
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
    message: "Chat API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Chat routes
app.use("/api/v1/chat", chatRoutes);

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Chat API",
    description: "Express server for chat functionality in web42-ai platform",
    endpoints: {
      health: "/health",
      api: "/api/v1/status",
      chat: "/api/v1/chat",
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
  console.log("\n🛑 Shutting down Chat API server...");
  try {
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Chat API server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
      console.log(`💬 Chat API: http://localhost:${PORT}/api/v1/chat`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
