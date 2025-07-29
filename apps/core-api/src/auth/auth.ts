import { login, signout } from "../lib/authProvider";
import { getUserBySupabaseId } from "../users/userService";
import type { LoginRequest, LoginResponse } from "./types";

// Login with email and password
export async function loginUser(
  loginData: LoginRequest,
): Promise<LoginResponse> {
  try {
    const data = await login(loginData.email, loginData.password);

    // Get or create user in MongoDB
    const mongoUser = await getUserBySupabaseId(data.user.id);

    if (!mongoUser) {
      throw new Error("Failed to sync user data");
    }

    const session = data.session as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    } | null;

    return {
      user: mongoUser,
      session: {
        access_token: session?.access_token,
        refresh_token: session?.refresh_token,
        expires_in: session?.expires_in,
        token_type: session?.token_type,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Signout user
export async function signoutUser(): Promise<void> {
  try {
    await signout();
  } catch (error) {
    console.warn("Signout error:", error);
  }
}
