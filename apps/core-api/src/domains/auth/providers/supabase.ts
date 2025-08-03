import { createClient } from "@supabase/supabase-js";

import { config } from "@/config";

// Client for public operations (authentication)
export const supabaseClient = createClient(
  config.auth.supabase.url,
  config.auth.supabase.apiKey,
);

// Admin client for server-side operations (requires service role key)
export const supabaseAdmin = createClient(
  config.auth.supabase.url,
  config.auth.supabase.apiKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
