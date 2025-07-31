# CLAUDE.md - Core API Development Guide

Claude Code guidance for the `@web42-ai/core-api` Express.js application.

## Core API Overview

This is the main Express.js API server providing backend services for the web42-ai platform. Built with TypeScript, it follows domain-driven design patterns with a functional programming approach.

**Key Technologies**:

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with native driver
- **Authentication**: Supabase Auth integration
- **Validation**: Zod schemas with OpenAPI integration
- **Testing**: Vitest with supertest for integration testing
- **Logging**: Centralized logging with domain-specific child loggers

**Architecture Philosophy**:

- **Functional Programming First**: Pure functions, immutability, composition over inheritance
- **Domain-Driven Design**: Clear separation of concerns with domain-specific modules
- **Centralized Error Handling**: All errors flow through unified handler
- **Schema-First API**: Zod schemas define API contracts with OpenAPI documentation

## Error Handling Architecture

### Central Error Handler Strategy

**All errors flow through** `src/middleware/index.ts#errorHandler`:

```typescript
// ✅ Correct - Let errors bubble up to central handler
export async function getUserById(id: string): Promise<User> {
  const user = await userRepository.getUserById(id);
  if (!user) {
    throw new NotFoundError(`User not found by ID ${id}`);
  }
  return combineUserData(user);
}
```

### Error Disclosure Rules

- **4xx Errors**: Show `error.name` and `error.message` to client (safe for users)
- **5xx Errors**: Hide details, show generic "Internal Server Error" (protect internals)
- **Security-Critical**: Always use same error message to prevent information disclosure

### Hybrid Error Handling Pattern

**Security-Critical Operations** (Authentication/Authorization):

```typescript
// Use error throwing - prevents information disclosure
export async function authenticateUser(req, res, next) {
  if (!validToken) {
    throw new UnauthorizedError("Invalid credentials"); // Always same message
  }
}
```

**Performance-Sensitive Operations** (Validation):

```typescript
// Use direct response - high frequency, less security risk
export function validateBody(schema: ZodSchema) {
  if (!validationResult.success) {
    res.status(400).json({ error: "Validation Failed", details: [...] });
    return;
  }
}
```

### Custom Error Classes

Use the predefined error classes from `@/utils/errors`:

```typescript
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from "@/utils/errors";

// ✅ Service layer - throw specific errors
if (!user) {
  throw new NotFoundError(`User not found by ID ${id}`);
}

if (existingUser) {
  throw new ConflictError(`Email already registered (${email})`);
}

// ✅ Auth middleware - prevent information disclosure
throw new UnauthorizedError("Invalid credentials"); // Always same message
```

## Domain Architecture Patterns

### Layer Structure

Follow the established pattern from `domains/admin/users`:

```
domain/
├── index.ts              # Public API exports
├── types.ts              # Domain-specific types
├── domain.routes.ts      # Express routes with middleware
├── domain.service.ts     # Business logic coordination
├── domain.repository.ts  # Database operations only
├── domain.schemas.ts     # Zod validation schemas
└── __tests__/
    ├── domain.routes.test.ts     # Integration tests
    ├── domain.service.test.ts    # Service unit tests
    ├── domainTestFixtures.ts     # Mock data factories
    └── ...
```

### Route Layer Pattern

**Always use these middleware in order**:

1. **Validation**: `validateBody()`, `validateQuery()`, `validateObjectId()`
2. **Error Handling**: `asyncHandler()` wraps all async route handlers
3. **Business Logic**: Call service functions, let errors bubble up

```typescript
// ✅ Follow this exact pattern
router.post(
  "/",
  validateBody(CreateUserSchema), // 1. Validate input
  asyncHandler(async (req: Request, res: Response) => {
    // 2. Handle async errors
    const userData: CreateUserRequest = res.locals.validatedBody;

    const user = await createUser(userData); // 3. Business logic in service

    res.status(201).json(user); // 4. Return response
  }),
);
```

### Service Layer Pattern

**Business logic coordination** - Handle auth providers, external services, error throwing:

```typescript
export async function createUser(userData: CreateUserRequest): Promise<User> {
  // 1. Business validation
  const existingUser = await getMongoUserByEmail(userData.email, true);
  if (existingUser) {
    throw new ConflictError(`Email already registered (${userData.email})`);
  }

  // 2. External service coordination
  const authProvider = getAuthProvider();
  const authUser = await authProvider.createUser({...});

  // 3. Database operations
  const mongoUser = await userRepository.createUser({...});

  // 4. Data transformation
  return combineUserData(mongoUser, authUser);
}
```

### Repository Layer Pattern

**Pure database operations** - No business logic, no error throwing except technical errors:

```typescript
export async function getUserById(
  id: string,
  includeDeleted = false,
): Promise<MongoUser | null> {
  const collection = getCollection();

  if (!ObjectId.isValid(id)) {
    return null; // ✅ Return null, don't throw
  }

  const filter: Record<string, unknown> = { _id: new ObjectId(id) };

  if (!includeDeleted) {
    filter.status = { $ne: "deleted" };
  }

  return collection.findOne(filter); // ✅ Let service handle null checks
}
```

## Schema & Validation Patterns

### Zod Schema Organization

**Request/Response schemas with OpenAPI integration**:

```typescript
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// ✅ Add OpenAPI metadata for documentation
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format").openapi({
    example: "user@example.com",
    description: "User email address",
  }),
  name: z.string().min(2, "Name must be at least 2 characters").openapi({
    example: "Jane Doe",
    description: "User full name",
  }),
});
```

### Query Parameter Transformation

**Convert string queries to proper types**:

```typescript
export const ListUsersQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number) // ✅ Transform string to number
    .refine((n) => n >= 1, "Page must be at least 1")
    .optional(),
  includeDeleted: z
    .string()
    .transform((val) => val === "true") // ✅ Transform string to boolean
    .optional(),
});
```

### Schema-Type Integration

**Export inferred types for consistency**:

```typescript
// ✅ Export types from schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// ✅ Use in function signatures
export async function createUser(userData: CreateUserInput): Promise<User> {
  // Implementation
}
```

## Testing Architecture

### Integration Test Structure

**Test routes end-to-end with mocked services**:

```typescript
import { vi } from "vitest";
import { errorHandler } from "@/middleware";
import { expectError, expectSuccess, expectValidationError } from "@/testUtils/apiTestHelpers";

// ✅ Mock service layer, test routes + middleware integration
const mockUserService = vi.hoisted(() => ({
  createUser: vi.fn(),
  getUserById: vi.fn(),
  // ... other service methods
}));

vi.mock("../user.service", () => mockUserService);

describe("User Routes Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/users", userRoutes);
    app.use(errorHandler);  // ✅ Include error handler in tests
  });
```

### Test Helper Usage

**Use consistent assertion helpers**:

```typescript
// ✅ Success responses
const body = expectSuccess(response, 201);
expectUserStructure(body);

// ✅ Error responses with specific details
expectError(response, 404, "NotFoundError", "User not found by ID abc123");

// ✅ Validation errors
expectValidationError(response, ["email", "name", "role"]);

// ✅ Paginated responses
expectPaginatedResponse(response, 2, 5); // page 2, limit 5
```

### Test Fixture Pattern

**Factory functions for consistent mock data**:

```typescript
// ✅ Flexible mock factories with overrides
export const createMockUser = (
  overrides: Partial<User> = {},
): WithId<User> => ({
  _id: new ObjectId(),
  supabaseUserId: "supabase-123",
  email: "test@example.com",
  role: "user",
  status: "active",
  name: "Test User",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides, // ✅ Allow test-specific customization
});

export const createMockCreateUserRequest = (
  overrides: Partial<CreateUserRequest> = {},
): CreateUserRequest => ({
  email: "newuser@example.com",
  password: "securePassword123",
  name: "New User",
  role: "user",
  ...overrides,
});
```

### Error Testing Patterns

**Test both success and error scenarios**:

```typescript
describe("POST /users", () => {
  it("should create new user successfully", async () => {
    const createUserData = createMockCreateUserRequest();
    const mockUser = createMockUser({ email: createUserData.email });

    mockUserService.createUser.mockResolvedValue(mockUser);

    const response = await postRequest(app, "/users", createUserData);

    expectSuccess(response, 201);
    expect(mockUserService.createUser).toHaveBeenCalledWith(createUserData);
  });

  it("should return 409 for duplicate email", async () => {
    const createUserData = createMockCreateUserRequest({
      email: "existing@example.com",
    });
    const error = new ConflictError(
      "Email already registered (existing@example.com)",
    );

    mockUserService.createUser.mockRejectedValue(error);

    const response = await postRequest(app, "/users", createUserData);

    expectError(
      response,
      409,
      "ConflictError",
      "Email already registered (existing@example.com)",
    );
  });
});
```

## Service Layer Patterns

### External Service Coordination

**Coordinate between auth provider and database**:

```typescript
export async function updateUser(
  id: string,
  updateData: UpdateUserRequest,
): Promise<User> {
  const authProvider = getAuthProvider();

  // 1. Update MongoDB first
  const mongoUser = await userRepository.updateUser(id, updateData);
  if (!mongoUser) {
    throw new NotFoundError(`User not found for update ${id}`);
  }

  // 2. Update external service if needed
  let authUser: AuthUser | undefined;
  if (updateData.role) {
    authUser = await authProvider.updateUser(mongoUser.supabaseUserId, {
      appMetadata: { role: updateData.role },
    });
  }

  // 3. Return combined data
  return combineUserData(mongoUser, authUser);
}
```

### Data Transformation Pattern

**Use combining functions for external data integration**:

```typescript
// ✅ Combine MongoDB and auth provider data
export async function getUserById(id: string): Promise<User> {
  const mongoUser = await userRepository.getUserById(id);

  if (!mongoUser) {
    throw new NotFoundError(`User not found by ID ${id}`);
  }

  return combineUserData(mongoUser); // ✅ Fetches auth data internally
}
```

### Consistent Error Messages

**Use descriptive, actionable error messages**:

```typescript
// ✅ Include context in error messages
throw new NotFoundError(`User not found by ID ${id}`);
throw new NotFoundError(`User not found for update ${id}`);
throw new NotFoundError(`User not found for deletion ${id}`);
throw new ConflictError(`Email already registered (${userData.email})`);
```

## Development Guidelines

### Module Structure Pattern

**Consistent exports and organization**:

```typescript
// index.ts - Public API only
export { userRoutes } from "./user.routes";
export {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  listUsers,
} from "./user.service";
export type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "./types";
```

### Import Organization

**Follow consistent import patterns**:

```typescript
// 1. External libraries
import express from "express";
import { ObjectId } from "mongodb";

// 2. Internal utilities (@ paths)
import { asyncHandler, validateBody, validateObjectId } from "@/middleware";
import { NotFoundError, ConflictError } from "@/utils/errors";

// 3. Domain imports (relative paths)
import type { CreateUserRequest, UpdateUserRequest } from "./types";
import { CreateUserSchema, UpdateUserSchema } from "./user.schemas";
import { createUser, updateUser, deleteUser } from "./user.service";
```

### Logging Strategy

**Use domain-specific child loggers**:

```typescript
import { userLogger } from "@/config/logger";

export async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    // Business logic
    const user = await userRepository.createUser(mongoData);

    userLogger.info(
      { userId: user._id, email: userData.email },
      "User created successfully",
    );
    return combineUserData(user, authUser);
  } catch (error) {
    userLogger.error(
      { err: error, email: userData.email },
      "User creation failed",
    );
    throw error; // ✅ Re-throw for error handler
  }
}
```

### Type Organization

**Separate request/response/domain types**:

```typescript
// types.ts
export interface MongoUser {
  _id?: ObjectId;
  supabaseUserId: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface User extends MongoUser {
  // Combined with auth provider data
  name?: string;
  avatarUrl?: string;
  authProvider?: string;
  lastSignInAt?: string;
  emailConfirmedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  name: string;
  role: "admin" | "user";
}
```

## Commands Reference

### Development Commands

```bash
# Run API server in development
bun dev --filter=@web42-ai/core-api

# Build the API
bun build --filter=@web42-ai/core-api

# Run tests
bun run test --filter=@web42-ai/core-api

# Run specific test file
bun run test --filter=@web42-ai/core-api -- user.routes.test.ts

# Linting and type checking
bun lint --filter=@web42-ai/core-api
bun check-types --filter=@web42-ai/core-api
```

### Development Workflow

1. **Create domain module**: Follow the established layer structure
2. **Write schemas first**: Define API contracts with Zod + OpenAPI
3. **Implement repository**: Pure database operations, return null for not found
4. **Implement service**: Business logic, error throwing, external coordination
5. **Implement routes**: Validation middleware + asyncHandler + service calls
6. **Write tests**: Integration tests with mocked services
7. **Run quality checks**: `bun lint && bun check-types` before committing

## Best Practices Summary

### ✅ Do

- Use `asyncHandler` for all async route handlers
- Throw specific error classes from service layer
- Let errors bubble up to central error handler
- Use validation middleware for all input validation
- Write integration tests with mocked services
- Use factory functions for test fixtures
- Follow the established layer separation
- Use domain-specific child loggers
- Include descriptive context in error messages

### ❌ Don't

- Handle errors in route handlers (let them bubble up)
- Throw errors from repository layer (return null instead)
- Skip input validation middleware
- Test external services directly (mock them)
- Use different error response formats
- Mix business logic in repository layer
- Skip error scenario testing
- Use generic error messages for security-critical operations

This guide ensures consistency with the established patterns in the `domains/admin/users` module and maintains the architectural principles throughout the core-api codebase.
