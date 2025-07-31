import { getAuthProvider } from "@/domains/auth";
import { AuthError } from "@/domains/auth/authUtils";
import type { AuthUser } from "@/domains/auth/types";
import { ApiError, NotFoundError } from "@/utils/errors";
import type { CombinedUser, User } from "./types";

// Helper function to merge MongoDB user with auth provider user data
export async function combineUserData(mongoUser: User): Promise<CombinedUser>;
export async function combineUserData(
  mongoUser: User,
  authUser: AuthUser | undefined,
): Promise<CombinedUser>;
export async function combineUserData(
  mongoUser: User,
  authUser?: AuthUser,
): Promise<CombinedUser> {
  let resolvedAuthUser = authUser;

  // If authUser not provided, fetch from auth provider
  if (!resolvedAuthUser) {
    const authProvider = getAuthProvider();
    try {
      resolvedAuthUser = await authProvider.getUserById(
        mongoUser.supabaseUserId,
      );
    } catch (error) {
      if (error instanceof AuthError && error.code === "user_not_found") {
        throw new NotFoundError(error.message);
      }
      if (error instanceof AuthError) {
        throw new ApiError(error.message);
      }

      throw new ApiError("Failed to fetch auth user");
    }
  }

  return {
    ...mongoUser,
    name: resolvedAuthUser.name,
    avatarUrl: resolvedAuthUser.avatarUrl,
    authProvider: resolvedAuthUser.authProvider,
    lastSignInAt: resolvedAuthUser.lastSignInAt || undefined,
    emailConfirmedAt: resolvedAuthUser.emailConfirmedAt || undefined,
    phoneConfirmedAt: resolvedAuthUser.phoneConfirmedAt || undefined,
    phone: resolvedAuthUser.phone || undefined,
    userMetadata: resolvedAuthUser.userMetadata,
    appMetadata: resolvedAuthUser.appMetadata,
  };
}
