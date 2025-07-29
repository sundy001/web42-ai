// Auth provider abstraction interface
export interface AuthUser {
  id: string;
  email: string | null;
  name?: string;
  avatarUrl?: string;
  authProvider?: string;
  lastSignInAt?: string | null;
  emailConfirmedAt?: string | null;
  phoneConfirmedAt?: string | null;
  phone?: string | null;
  userMetadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
}

export interface CreateAuthUserInput {
  email: string;
  password?: string;
  name?: string;
  role?: string;
  emailConfirm?: boolean;
}

export interface UpdateAuthUserInput {
  email?: string;
  password?: string;
  userMetadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
}

export interface AuthProvider {
  // User management operations
  createUser(input: CreateAuthUserInput): Promise<AuthUser>;
  getUserById(id: string): Promise<AuthUser | null>;
  updateUser(id: string, input: UpdateAuthUserInput): Promise<AuthUser>;
  deleteUser(id: string): Promise<void>;

  // Authentication operations
  signInWithPassword(
    email: string,
    password: string,
  ): Promise<{
    user: AuthUser;
    session: unknown;
  }>;
  signOut(): Promise<void>;
}

export interface AuthError extends Error {
  code?: string;
}
