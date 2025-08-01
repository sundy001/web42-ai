/**
 * Auth Domain Test Fixtures
 *
 * Factory functions for creating consistent mock data across auth domain tests.
 * Provides realistic test data with proper typing and customization options.
 *
 * Key Features:
 * - Consistent mock data across all tests
 * - Flexible overrides for test-specific scenarios
 * - Proper ObjectId handling for MongoDB integration
 * - Realistic token formats and timestamps
 *
 * @module domains/auth/__tests__/authTestFixtures
 */

import type { User } from "@/domains/admin/users";
import { ObjectId } from "mongodb";
import type { AuthUser, LoginInput, LoginResponse } from "../types";

// =============================================================================
// TEST CONSTANTS
// =============================================================================

/** Standard test email for consistency across tests */
const MOCK_EMAIL = "test@example.com";

/** Standard test password meeting security requirements */
const MOCK_PASSWORD = "securePassword123";

/** Standard timestamp for created/updated date fields */
const MOCK_TIMESTAMP = "2024-01-01T00:00:00.000Z";

/** Standard Supabase user ID in UUID format */
const MOCK_SUPABASE_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

/** Mock JWT access token with realistic format */
const MOCK_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token";

/** Mock refresh token for session management */
const MOCK_REFRESH_TOKEN = "refresh_token_mock_value";

// =============================================================================
// USER DATA FACTORIES
// =============================================================================

/**
 * Creates a mock AuthUser from auth provider (e.g., Supabase)
 *
 * @param overrides - Partial data to override default values
 * @returns Mock AuthUser with realistic auth provider data
 */
export const createMockAuthUser = (
  overrides: Partial<AuthUser> = {},
): AuthUser => ({
  id: MOCK_SUPABASE_USER_ID,
  email: MOCK_EMAIL,
  name: "Test User",
  avatarUrl: "https://example.com/avatar.png",
  authProvider: "supabase",
  lastSignInAt: MOCK_TIMESTAMP,
  emailConfirmedAt: MOCK_TIMESTAMP,
  ...overrides,
});

/**
 * Creates a mock User from MongoDB with proper ObjectId handling
 *
 * Converts ObjectId to string for proper schema validation in tests.
 * Includes all required User fields with realistic defaults.
 *
 * @param overrides - Partial data to override default values
 * @returns Mock User with complete MongoDB structure
 */
export const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    _id: new ObjectId().toString(), // Convert to string for schema validation
    supabaseUserId: MOCK_SUPABASE_USER_ID,
    email: MOCK_EMAIL,
    role: "user",
    status: "active",
    name: "Test User",
    avatarUrl: "https://example.com/avatar.png",
    authProvider: "supabase",
    lastSignInAt: MOCK_TIMESTAMP,
    emailConfirmedAt: MOCK_TIMESTAMP,
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
    ...overrides,
  }) as User;

// =============================================================================
// REQUEST DATA FACTORIES
// =============================================================================

/**
 * Creates a mock login request with valid credentials
 *
 * @param overrides - Partial data to override default values
 * @returns Mock LoginRequest for authentication testing
 */
export const createMockLoginRequest = (
  overrides: Partial<LoginInput> = {},
): LoginInput => ({
  email: MOCK_EMAIL,
  password: MOCK_PASSWORD,
  ...overrides,
});

// =============================================================================
// RESPONSE DATA FACTORIES
// =============================================================================

/**
 * Creates a mock login response with user data only
 *
 * @param overrides - Partial data to override default values
 * @returns Mock LoginResponse for successful authentication
 */
export const createMockLoginResponse = (
  overrides: Partial<LoginResponse> = {},
): LoginResponse => ({
  user: createMockUser(),
  ...overrides,
});

/**
 * Creates a mock auth provider sign-in response
 *
 * Simulates the response structure from external auth providers
 * like Supabase for service layer testing.
 *
 * @param overrides - Partial data to override default values
 * @returns Mock auth provider response with user and session
 */
export const createMockAuthProviderSignInResponse = (overrides = {}) => ({
  user: createMockAuthUser(),
  session: {
    access_token: MOCK_ACCESS_TOKEN,
    refresh_token: MOCK_REFRESH_TOKEN,
    expires_in: 3600,
    token_type: "bearer",
  },
  ...overrides,
});

/**
 * Creates a mock Supabase getClaims response for token validation
 *
 * @param overrides - Partial data to override claims data
 * @returns Mock Supabase claims response structure
 */
export const createMockGetClaimsResponse = (overrides = {}) => ({
  data: {
    claims: {
      sub: MOCK_SUPABASE_USER_ID,
      email: MOCK_EMAIL,
      app_metadata: {
        role: "user",
      },
      ...overrides,
    },
  },
  error: null,
});

// =============================================================================
// ERROR RESPONSE FACTORIES
// =============================================================================

/**
 * Creates a mock authentication error for failure testing
 *
 * @param message - Custom error message (defaults to generic auth failure)
 * @returns Standard Error object for auth failure scenarios
 */
export const createMockAuthError = (message = "Authentication failed") =>
  new Error(message);

/**
 * Creates a mock Supabase error response structure
 *
 * @returns Mock Supabase error response with standard format
 */
export const createMockSupabaseError = () => ({
  data: null,
  error: {
    message: "Invalid credentials",
    status: 401,
  },
});
