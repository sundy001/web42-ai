import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client for public operations (authentication)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (requires service role key)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
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
