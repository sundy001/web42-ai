import { z } from "zod";

import { createBootstrapLogger } from "@web42-ai/logger";

// MongoDB connection pool schema with all-or-nothing validation
const connectionPoolSchema = z
  .object({
    MONGODB_MAX_POOL_SIZE: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(1000))
      .optional(),
    MONGODB_MIN_POOL_SIZE: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0).max(100))
      .optional(),
    MONGODB_MAX_IDLE_TIME_MS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0))
      .optional(),
    MONGODB_SOCKET_TIMEOUT_MS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0))
      .optional(),
    MONGODB_CONNECT_TIMEOUT_MS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1000))
      .optional(),
    MONGODB_MAX_CONNECTING: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(10))
      .optional(),
    MONGODB_WAIT_QUEUE_TIMEOUT_MS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0))
      .optional(),
  })
  .refine(
    (data) => {
      const poolVars = [
        data.MONGODB_MAX_POOL_SIZE,
        data.MONGODB_MIN_POOL_SIZE,
        data.MONGODB_MAX_IDLE_TIME_MS,
        data.MONGODB_SOCKET_TIMEOUT_MS,
        data.MONGODB_CONNECT_TIMEOUT_MS,
        data.MONGODB_MAX_CONNECTING,
        data.MONGODB_WAIT_QUEUE_TIMEOUT_MS,
      ];

      const definedCount = poolVars.filter((v) => v !== undefined).length;
      return definedCount === 0 || definedCount === 7;
    },
    {
      message:
        "MongoDB connection pool configuration must be either complete (all variables provided) or disabled (no variables provided). Partial configuration is not allowed.",
    },
  );

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
  SUPABASE_API_KEY: z.string().min(1),

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
    // First validate the connection pool configuration
    const poolValidation = connectionPoolSchema.parse(process.env);
    // Then validate the main environment schema
    const envValidation = envSchema.parse(process.env);

    // Merge the results
    return {
      ...envValidation,
      ...poolValidation,
    };
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
    ...(env.MONGODB_MAX_POOL_SIZE && {
      connectionPool: {
        maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
        minPoolSize: env.MONGODB_MIN_POOL_SIZE!,
        maxIdleTimeMS: env.MONGODB_MAX_IDLE_TIME_MS!,
        socketTimeoutMS: env.MONGODB_SOCKET_TIMEOUT_MS!,
        connectTimeoutMS: env.MONGODB_CONNECT_TIMEOUT_MS!,
        maxConnecting: env.MONGODB_MAX_CONNECTING!,
        waitQueueTimeoutMS: env.MONGODB_WAIT_QUEUE_TIMEOUT_MS!,
      },
    }),
  },

  // Authentication
  auth: {
    supabase: {
      url: env.SUPABASE_URL,
      apiKey: env.SUPABASE_API_KEY,
    },
    cookie: {
      domain: env.COOKIE_DOMAIN,
      accessTokenExpiryMs: env.ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000,
      refreshTokenExpiryMs: env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    },
  },
} as const;
