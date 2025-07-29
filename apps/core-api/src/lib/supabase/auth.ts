import { supabaseClient } from "./supabase";

export async function login(email: string, password: string) {
  // Authenticate with Supabase
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    throw new Error(
      `Supabase login failed: ${error?.message || "Invalid credentials"}`,
    );
  }

  return data;
}

export async function signout() {
  // Sign out from Supabase - this signs out the current session
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    throw new Error(
      `Supabase signout failed: ${error?.message || "Unknown error"}`,
    );
  }
}
