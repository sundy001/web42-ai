// Auth Domain - Public API
// Only expose what external consumers need, hide internal implementation

// Main service functions for external consumption
export {
  loginUser,
  signoutUser,
} from "./auth.service";

// HTTP routes for application setup
export { default as authRoutes } from "./auth.routes";

// Public types that external consumers need
export type {
  LoginRequest,
  LoginResponse,
  SignoutRequest,
  SignoutResponse,
} from "./auth.types";

// Schema exports for validation and OpenAPI
export {
  LoginSchema,
  LoginResponseSchema,
  SignoutSchema,
  SignoutResponseSchema,
} from "./auth.schemas";

// Provider access for cross-domain usage (limited exposure)
export {
  getAuthProvider,
} from "./providers";

// Supabase client for middleware usage (minimal exposure)
export {
  supabaseClient,
} from "./providers/supabase";

// Note: Provider implementations, internal auth logic, and provider-specific 
// details are kept private. External consumers should use the service layer.