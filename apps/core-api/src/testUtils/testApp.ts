import type { Application } from "express";
import express from "express";
import { errorHandler } from "../middleware";

/**
 * Creates a test Express application with standard middleware
 * but without database connections or external dependencies
 */
export function createTestApp(): Application {
  const app = express();

  // Standard middleware for testing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
}

/**
 * Sets up a test app with the given routes and error handling
 */
export function setupTestApp(routes: (app: Application) => void): Application {
  const app = createTestApp();

  // Apply routes
  routes(app);

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
