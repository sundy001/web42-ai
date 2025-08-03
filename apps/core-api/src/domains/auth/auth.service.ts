import { authLogger } from "@/config/logger";
import { getUserBySupabaseId } from "@/domains/admin/users";
import { UnauthorizedError } from "@/utils/errors";
import { LoginInput, LoginResponse } from "./auth.schemas";
import { getAuthProvider } from "./providers";
import type { AuthSession } from "./types";

export async function loginUser(loginData: LoginInput): Promise<{
  user: LoginResponse;
  session: AuthSession;
}> {
  try {
    // Authenticate with auth provider
    const authProvider = getAuthProvider();
    const result = await authProvider.signInWithPassword(
      loginData.email,
      loginData.password,
    );

    const data = {
      user: result.user,
      session: result.session,
    };

    // Get or create user in MongoDB
    const mongoUser = await getUserBySupabaseId(data.user.id);

    if (!mongoUser) {
      throw new Error("Failed to sync user data");
    }

    const session = data.session as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
    };

    return {
      user: mongoUser,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
    };
  } catch (error) {
    throw new UnauthorizedError("Invalid credentials", {
      cause: error as Error,
    });
  }
}

export async function signoutUser(): Promise<void> {
  try {
    // Sign out from auth provider
    const authProvider = getAuthProvider();
    await authProvider.signOut();
  } catch (error) {
    authLogger.warn({ err: error }, "Signout error");
  }
}

export async function refreshUserToken(
  refreshToken: string,
): Promise<AuthSession> {
  const authProvider = getAuthProvider();
  const { data, error } = await authProvider.refreshSession(refreshToken);

  if (error || !data || !data.session) {
    throw new UnauthorizedError("Invalid credentials", {
      cause: error as Error,
    });
  }

  const session = data.session as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    token_type: session.token_type,
  };
}
