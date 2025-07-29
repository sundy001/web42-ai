import { createClient } from "@supabase/supabase-js";

import { config } from "../../../config";

// Client for public operations (authentication)
export const supabaseClient = createClient(
  config.auth.supabase.url,
  config.auth.supabase.anonKey,
);

// Admin client for server-side operations (requires service role key)
export const supabaseAdmin = config.auth.supabase.serviceRoleKey
  ? createClient(
      config.auth.supabase.url,
      config.auth.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  : null;

// Helper to get admin client or throw error
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.",
    );
  }
  return supabaseAdmin;
}
