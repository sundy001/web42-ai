import type { AuthProvider } from "../types";
import { supabaseAuthProvider } from "./supabaseAuthProvider";

// Auth service factory - makes it easy to switch providers in the future
export function getAuthProvider(): AuthProvider {
  // In the future, we could add logic here to switch between different providers
  // based on environment variables or configuration
  return supabaseAuthProvider;
}
