import { z } from "zod";

/**
 * Zod schema for validating ConsumerOptions with comprehensive validation rules
 */
export const ConsumerOptionsSchema = z.object({
  // Required fields
  accountId: z.string().min(1, "accountId is required"),
  queueId: z.string().min(1, "queueId is required"),

  // Handler functions
  handleMessageBatch: z.function().args(z.any()).returns(z.promise(z.any())),

  // Numeric options with validation and explicit defaults
  batchSize: z.number().int().min(1).max(100).optional().default(10),
  visibilityTimeoutMs: z
    .number()
    .int()
    .min(0)
    .max(43200000)
    .optional()
    .default(1000),
  pollingWaitTimeMs: z.number().int().min(0).optional().default(1000),
  retryMessageDelay: z.number().int().min(0).max(42300).optional().default(10),

  // Boolean options with explicit defaults
  retryMessagesOnError: z.boolean().optional().default(false),
  alwaysAcknowledge: z.boolean().optional().default(false),
});

/**
 * Type for validated ConsumerOptions with all defaults applied
 */
export type ConsumerOptions = z.infer<typeof ConsumerOptionsSchema>;

/**
 * Validate consumer options using Zod schema
 * @param options The options to validate
 * @returns Validated and transformed options with defaults applied
 */
export function validateConsumerOptions(
  options: ConsumerOptions,
): ConsumerOptions {
  try {
    return ConsumerOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => {
          const path = err.path.join(".");
          return `${path}: ${err.message}`;
        })
        .join(", ");
      throw new Error(`Consumer validation failed: ${errorMessages}`);
    }
    throw error;
  }
}
