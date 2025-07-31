import { createAuthError } from "../authUtils";
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
  createUser: async (input) => {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
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

    if (error) {
      throw createAuthError(error);
    }

    return mapSupabaseUser(data.user);
  },

  getUserById: async (id) => {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error) {
      throw createAuthError(error);
    }

    return mapSupabaseUser(data.user);
  },

  updateUser: async (id, input) => {
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

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      updateData,
    );

    if (error) {
      throw createAuthError(error);
    }

    return mapSupabaseUser(data.user);
  },

  deleteUser: async (id, softDelete) => {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(
      id,
      softDelete,
    );

    if (error) {
      throw createAuthError(error!);
    }

    return mapSupabaseUser(data.user);
  },

  signInWithPassword: async (email, password) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw createAuthError(error!);
    }

    return {
      user: mapSupabaseUser(data.user),
      session: data.session,
    };
  },

  signOut: async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw createAuthError(error!);
    }
  },
} as AuthProvider;
