// Messages Domain - Public API

// =============================================================================
// SERVICE LAYER - Core business logic
// =============================================================================

/**
 * Main service functions for external consumption
 * These provide the core message management business logic
 */
export { createMessage, getMessages } from "./message.service";

// =============================================================================
// TYPE CONTRACTS - External interfaces
// =============================================================================

/**
 * Export commonly used types for external consumers
 */
export type { ContentType, MessageRole } from "./types";
