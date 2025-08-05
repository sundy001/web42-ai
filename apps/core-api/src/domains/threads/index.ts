// Threads Domain - Public API

// =============================================================================
// SERVICE LAYER - Core business logic
// =============================================================================

/**
 * Main service functions for external consumption
 * These provide the core thread management business logic
 */
export { createThread } from "./thread.service";

// =============================================================================
// TYPE CONTRACTS - External interfaces
// =============================================================================

/**
 * Export commonly used types for external consumers
 */
export type { ContentType, MessageRole } from "./types";
