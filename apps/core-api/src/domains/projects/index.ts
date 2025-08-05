// Projects Domain - Public API

// =============================================================================
// SERVICE LAYER - Core business logic
// =============================================================================

/**
 * Main service functions for external consumption
 * These provide the core project management business logic
 */
export { createProjectByPrompt } from "./project.service";

// =============================================================================
// PRESENTATION LAYER - HTTP interface
// =============================================================================

/**
 * HTTP routes for application setup
 * Handles incoming project-related HTTP requests
 */
export { projectRoutes } from "./project.routes";

// =============================================================================
// TYPE CONTRACTS - External interfaces
// =============================================================================

/**
 * Export commonly used types for external consumers
 */
export type { ProjectStatus } from "./types";
