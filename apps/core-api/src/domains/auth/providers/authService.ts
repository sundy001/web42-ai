import { supabaseAuthProvider } from "./supabaseAuthProvider";
import type { AuthProvider } from "./types";

// Auth service factory - makes it easy to switch providers in the future
export function getAuthProvider(): AuthProvider {
  // In the future, we could add logic here to switch between different providers
  // based on environment variables or configuration
  return supabaseAuthProvider;
}
