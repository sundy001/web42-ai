// Messages Domain - Public API

// =============================================================================
// ROUTES - HTTP endpoints
// =============================================================================

/**
 * Express router for message-related endpoints
 */
export { default as messageRoutes } from "./message.routes";

// =============================================================================
// SERVICE LAYER - Core business logic
// =============================================================================

/**
 * Main service functions for external consumption
 * These provide the core message management business logic
 */
export { createMessage, getMessagesForUser } from "./message.service";

// =============================================================================
// TYPE CONTRACTS - External interfaces
// =============================================================================

/**
 * Export commonly used types for external consumers
 */
export type { ContentType, MessageRole } from "./types";
