import pino, { Logger } from "pino";

// Bootstrap logger for early initialization (no dependency on env config)
// This is used during environment validation before the main logger is available
export const createBootstrapLogger = (): Logger => {
  return pino({
    level: "error",
    // Basic security redaction even for bootstrap logger
    redact: {
      paths: [
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "authorization",
        "cookie",
      ],
      censor: "[REDACTED]",
    },
    // ISO timestamps for consistency
    timestamp: pino.stdTimeFunctions.isoTime,
  });
};