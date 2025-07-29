import { createAuthError, withErrorHandling } from "../authUtils";
import type { AuthProvider, AuthUser } from "../types";
import { getSupabaseAdmin, supabaseClient } from "./supabase";

// Convert Supabase user to our AuthUser interface
function mapSupabaseUser(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  phone?: string;
}): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || null,
    name:
      (supabaseUser.user_metadata?.name as string) ||
      (supabaseUser.user_metadata?.full_name as string),
    avatarUrl: supabaseUser.user_metadata?.avatar_url as string,
    authProvider: supabaseUser.app_metadata?.provider as string,
    lastSignInAt: supabaseUser.last_sign_in_at,
    emailConfirmedAt: supabaseUser.email_confirmed_at,
    phoneConfirmedAt: supabaseUser.phone_confirmed_at,
    phone: supabaseUser.phone,
    userMetadata: supabaseUser.user_metadata,
    appMetadata: supabaseUser.app_metadata,
  };
}

export const supabaseAuthProvider = {
  createUser: withErrorHandling("Failed to create user", async (input) => {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: supabaseUser, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        user_metadata: {
          name: input.name,
        },
        app_metadata: {
          role: input.role,
        },
        email_confirm: input.emailConfirm ?? true,
      });

    if (error || !supabaseUser.user) {
      throw createAuthError(
        `Failed to create user: ${error?.message}`,
        error?.code,
      );
    }

    return mapSupabaseUser(supabaseUser.user);
  }),

  getUserById: withErrorHandling("Failed to get user", async (id) => {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: supabaseUser, error } =
      await supabaseAdmin.auth.admin.getUserById(id);

    if (error) {
      throw createAuthError(`Failed to get user: ${error.message}`, error.code);
    }

    if (!supabaseUser.user) {
      return null;
    }

    return mapSupabaseUser(supabaseUser.user);
  }),

  updateUser: withErrorHandling("Failed to update user", async (id, input) => {
    const supabaseAdmin = getSupabaseAdmin();

    const updateData: {
      email?: string;
      password?: string;
      user_metadata?: Record<string, unknown>;
      app_metadata?: Record<string, unknown>;
    } = {};

    if (input.email) {
      updateData.email = input.email;
    }

    if (input.password) {
      updateData.password = input.password;
    }

    if (input.userMetadata) {
      updateData.user_metadata = input.userMetadata;
    }

    if (input.appMetadata) {
      updateData.app_metadata = input.appMetadata;
    }

    const { data: supabaseUser, error } =
      await supabaseAdmin.auth.admin.updateUserById(id, updateData);

    if (error || !supabaseUser.user) {
      throw createAuthError(
        `Failed to update user: ${error?.message}`,
        error?.code,
      );
    }

    return mapSupabaseUser(supabaseUser.user);
  }),

  deleteUser: withErrorHandling("Failed to delete user", async (id) => {
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      throw createAuthError(
        `Failed to delete user: ${error.message}`,
        error.code,
      );
    }
  }),

  signInWithPassword: withErrorHandling(
    "Login failed",
    async (email, password) => {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user || !data.session) {
        throw createAuthError(
          `Login failed: ${error?.message || "Invalid credentials"}`,
          error?.code,
        );
      }

      return {
        user: mapSupabaseUser(data.user),
        session: data.session,
      };
    },
  ),

  signOut: withErrorHandling("Sign out failed", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw createAuthError(`Sign out failed: ${error.message}`, error.code);
    }
  }),
} as AuthProvider;
