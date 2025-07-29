import { getAuthProvider } from "./authService";

export async function login(email: string, password: string) {
  // Authenticate with auth provider
  const authProvider = getAuthProvider();
  const result = await authProvider.signInWithPassword(email, password);

  return {
    user: result.user,
    session: result.session,
  };
}

export async function signout() {
  // Sign out from auth provider
  const authProvider = getAuthProvider();
  await authProvider.signOut();
}
