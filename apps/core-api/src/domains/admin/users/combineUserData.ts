import { getAuthProvider } from "../../auth";
import type { AuthUser } from "../../auth/types";
import type { CombinedUser, User } from "./types";

// Helper function to merge MongoDB user with auth provider user data
export async function combineUserData(mongoUser: User): Promise<CombinedUser>;
export async function combineUserData(
  mongoUser: User,
  authUser: AuthUser,
): Promise<CombinedUser>;
export async function combineUserData(
  mongoUser: User,
  authUser?: AuthUser,
): Promise<CombinedUser> {
  try {
    let resolvedAuthUser = authUser;

    // If authUser not provided, fetch from auth provider
    if (!resolvedAuthUser) {
      const authProvider = getAuthProvider();
      const fetchedAuthUser = await authProvider.getUserById(
        mongoUser.supabaseUserId,
      );
      resolvedAuthUser = fetchedAuthUser || undefined;
    }

    if (!resolvedAuthUser) {
      console.warn(
        `Failed to fetch auth user ${mongoUser.supabaseUserId}: User not found`,
      );
      return mongoUser as CombinedUser;
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
    };
  } catch (error) {
    console.warn(
      `Error combining user data for ${mongoUser.supabaseUserId}:`,
      error,
    );
    return mongoUser as CombinedUser;
  }
}
