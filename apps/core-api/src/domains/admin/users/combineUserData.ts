import { getAuthProvider } from "@/domains/auth";
import { AuthError } from "@/domains/auth/authUtils";
import type { AuthUser } from "@/domains/auth/types";
import { ApiError, NotFoundError } from "@/utils/errors";
import type { MongoUser, User } from "./types";

// Helper function to merge MongoDB user with auth provider user data
export async function combineUserData(mongoUser: MongoUser): Promise<User>;
export async function combineUserData(
  mongoUser: MongoUser,
  authUser: AuthUser | undefined,
): Promise<User>;
export async function combineUserData(
  mongoUser: MongoUser,
  authUser?: AuthUser,
): Promise<User> {
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
        throw new NotFoundError(
          `Auth user not found (${mongoUser.supabaseUserId})`,
          { cause: error },
        );
      }
      if (error instanceof AuthError) {
        throw new ApiError(
          `Auth provider error (${mongoUser.supabaseUserId})`,
          { cause: error },
        );
      }

      throw new ApiError(
        `Auth user fetch failed (${mongoUser.supabaseUserId})`,
        { cause: error instanceof Error ? error : undefined },
      );
    }
  }

  return {
    id: mongoUser._id.toString(),
    email: mongoUser.email,
    name: mongoUser.name,
    role: mongoUser.role,
    status: mongoUser.status,
    emailVerified: Boolean(resolvedAuthUser.emailConfirmedAt),
    avatarUrl: resolvedAuthUser.avatarUrl,
    createdAt: mongoUser.createdAt,
    updatedAt: mongoUser.updatedAt,
    lastSignInAt: resolvedAuthUser.lastSignInAt || undefined,
  };
}
