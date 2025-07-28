import { z } from "zod";

type ExampleValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

interface OpenApiDef {
  openapi?: {
    example?: unknown;
  };
}

function getOpenApiExample(schema: z.ZodTypeAny): unknown | undefined {
  const def = (schema as unknown as { _def: OpenApiDef })._def;
  return def.openapi?.example;
}

function generateObjectExample(
  schema: z.ZodObject<z.ZodRawShape>,
): Record<string, unknown> {
  const shape = schema.shape;
  const example: Record<string, unknown> = {};

  Object.entries(shape).forEach(([key, value]) => {
    // eslint-disable-next-line security/detect-object-injection -- Safe: key comes from Object.entries of known schema shape
    example[key] = generateExample(value as z.ZodTypeAny);
  });

  return example;
}

function generateStringExample(schema: z.ZodString): string {
  const openApiExample = getOpenApiExample(schema);
  if (openApiExample) return openApiExample as string;

  if (schema._def.checks) {
    for (const check of schema._def.checks) {
      if (check.kind === "email") return "user@example.com";
      if (check.kind === "datetime") return "2024-01-26T12:00:00.000Z";
    }
  }

  return "string";
}

// Helper function to generate example from Zod schema
export function generateExample(schema: z.ZodTypeAny): ExampleValue {
  // Handle optional types
  if (schema instanceof z.ZodOptional) {
    return generateExample(schema._def.innerType);
  }

  // Handle object types
  if (schema instanceof z.ZodObject) {
    return generateObjectExample(schema);
  }

  // Handle array types
  if (schema instanceof z.ZodArray) {
    const itemExample = generateExample(schema._def.type);
    return [itemExample];
  }

  // Handle string types
  if (schema instanceof z.ZodString) {
    return generateStringExample(schema);
  }

  // Handle number types
  if (schema instanceof z.ZodNumber) {
    const openApiExample = getOpenApiExample(schema);
    return (openApiExample as number) ?? 1;
  }

  // Handle boolean types
  if (schema instanceof z.ZodBoolean) {
    const openApiExample = getOpenApiExample(schema);
    return (openApiExample as boolean) ?? true;
  }

  // Handle enum types
  if (schema instanceof z.ZodEnum) {
    const openApiExample = getOpenApiExample(schema);
    if (openApiExample) return openApiExample as string;
    const values = schema._def.values;
    return values[0];
  }

  // Handle record types
  if (schema instanceof z.ZodRecord) {
    const openApiExample = getOpenApiExample(schema);
    return (openApiExample as Record<string, unknown>) ?? { key: "value" };
  }

  return null;
}
