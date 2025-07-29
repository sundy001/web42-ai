import { z } from "zod";

/**
 * Helper to test Zod schema validation success
 */
export function expectValidationSuccess<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(
      `Expected validation to succeed, but got errors: ${JSON.stringify(
        result.error.issues,
        null,
        2,
      )}`,
    );
  }

  return result.data;
}

/**
 * Helper to test Zod schema validation failure
 */
export function expectValidationFailure<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  expectedErrors?: string[],
): z.ZodError {
  const result = schema.safeParse(data);

  if (result.success) {
    throw new Error(
      `Expected validation to fail, but it succeeded with data: ${JSON.stringify(
        result.data,
        null,
        2,
      )}`,
    );
  }

  if (expectedErrors) {
    const actualErrors = result.error.issues.map((issue) => issue.message);
    expectedErrors.forEach((expectedError) => {
      expect(actualErrors).toContain(expectedError);
    });
  }

  return result.error;
}

/**
 * Helper to test ObjectId format validation
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Helper to test UUID format validation
 */
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid,
  );
}

/**
 * Helper to test email format validation
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Helper to create validation test cases
 */
export interface ValidationTestCase {
  name: string;
  data: unknown;
  shouldPass: boolean;
  expectedErrors?: string[];
}

/**
 * Helper to run multiple validation test cases
 */
export function runValidationTests<T>(
  schema: z.ZodSchema<T>,
  testCases: ValidationTestCase[],
): void {
  testCases.forEach(({ name, data, shouldPass, expectedErrors }) => {
    it(name, () => {
      if (shouldPass) {
        expectValidationSuccess(schema, data);
      } else {
        expectValidationFailure(schema, data, expectedErrors);
      }
    });
  });
}
