import { getAuthProvider } from "../auth/providers";
import type { CombinedUser, User } from "./user.types";

// Helper function to merge MongoDB user with auth provider user data
export async function combineUserData(mongoUser: User): Promise<CombinedUser> {
  try {
    const authProvider = getAuthProvider();
    const authUser = await authProvider.getUserById(mongoUser.supabaseUserId);

    if (!authUser) {
      console.warn(
        `Failed to fetch auth user ${mongoUser.supabaseUserId}: User not found`,
      );
      return mongoUser as CombinedUser;
    }

    return {
      ...mongoUser,
      name: authUser.name,
      avatarUrl: authUser.avatarUrl,
      authProvider: authUser.authProvider,
      lastSignInAt: authUser.lastSignInAt || undefined,
      emailConfirmedAt: authUser.emailConfirmedAt || undefined,
      phoneConfirmedAt: authUser.phoneConfirmedAt || undefined,
      phone: authUser.phone || undefined,
    };
  } catch (error) {
    console.warn(
      `Error combining user data for ${mongoUser.supabaseUserId}:`,
      error,
    );
    return mongoUser as CombinedUser;
  }
}
