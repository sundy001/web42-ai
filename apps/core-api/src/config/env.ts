import { z } from "zod";

import { createBootstrapLogger } from "@web42-ai/logger";

// Environment validation schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535))
    .default("3002"),
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug", "trace", "silent"])
    .optional(),

  // Database configuration
  MONGODB_URI: z.string().url().default("mongodb://localhost:27017"),
  DATABASE_NAME: z.string().min(1).default("web42-ai"),

  // Supabase authentication
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Cookie configuration
  COOKIE_DOMAIN: z.string().optional(),
  // Access token expires in 1 hour by default
  ACCESS_TOKEN_EXPIRY_MINUTES: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default("60"),
  // Refresh token expires in 7 days by default
  REFRESH_TOKEN_EXPIRY_DAYS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default("7"),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // Use bootstrap logger for env validation errors since main logger isn't available yet
    const bootstrapLogger = createBootstrapLogger();
    bootstrapLogger.error({ err: error }, "❌ Invalid environment variables");

    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        bootstrapLogger.error(
          `Environment validation error: ${err.path.join(".")} - ${err.message}`,
        );
      });
    }
    process.exit(1);
  }
}

// Validated environment configuration
const env = validateEnv();

// Derived configuration objects
export const config = {
  // Server
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
  },

  // Database
  database: {
    uri: env.MONGODB_URI,
    name: env.DATABASE_NAME,
  },

  // Authentication
  auth: {
    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    cookie: {
      domain: env.COOKIE_DOMAIN,
      accessTokenExpiryMs: env.ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000,
      refreshTokenExpiryMs: env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    },
  },
} as const;
