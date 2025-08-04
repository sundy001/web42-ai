import { createClient } from "@supabase/supabase-js";

import { config } from "@/config";

// Client for public operations (authentication)
export const supabaseClient = createClient(
  config.auth.supabase.url,
  config.auth.supabase.apiKey,
);
