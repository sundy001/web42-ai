# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turborepo monorepo project named `web42-ai` - an AI site generator platform that creates static React sites from user prompts. The project uses TypeScript throughout and is managed with Bun as the package manager. The architecture is event-driven, utilizing Cloudflare Workers and Queues for scalable, asynchronous processing.

## Architecture

### Monorepo Structure

- **apps/** - Contains the main applications
  - `admin-web/` - Admin Next.js application (port 3000) with server-side utilities
  - `consumer-web/` - Consumer-facing Next.js application (port 3001)
  - `core-api/` - Express.js server (port 3002) for API endpoints and site operations
  - `chat-api/` - Express.js server (port 3003) for chat functionality
- **packages/** - Shared packages across apps
  - `@web42-ai/ui` - Shared React component library using Radix UI, CVA, and Tailwind
  - `@web42-ai/eslint-config` - Comprehensive ESLint configurations with security and complexity rules
  - `@web42-ai/typescript-config` - Shared TypeScript configurations with strict mode
  - `@web42-ai/migrations` - Database migration utilities and CLI
  - `@web42-ai/workers` - Cloudflare Workers for queue processing and event handling

### Key Technologies

- **Build System**: Turborepo with task orchestration and intelligent caching
- **Framework**: Next.js 15 with Turbopack for development
- **Language**: TypeScript 5.8 with strict configuration
- **Package Manager**: Bun 1.2.17
- **UI**: React 19 with modern concurrent features
- **Runtime**: Cloudflare Workers for serverless computing
- **Testing**: Vitest with Node.js environment and UI test runner
- **Code Quality**: ESLint (security, sonarjs, unicorn, import ordering, complexity), Prettier

### Event-Driven Architecture

The system uses Cloudflare Queues for asynchronous communication:

- `plan-steps-queue` - AI worker code generation tasks
- `project-builds-queue` - Build service triggers
- `step-status-to-bff-queue` - Real-time step updates to UI
- `step-status-to-db-queue` - Step status persistence
- `build-status-to-bff-queue` - Real-time build updates to UI
- `build-status-to-db-queue` - Build status persistence

## Common Commands

### Development

```bash
# Start all apps in development mode
bun dev

# Start specific app
bun dev --filter=@web42-ai/admin-web
bun dev --filter=@web42-ai/consumer-web
bun dev --filter=@web42-ai/core-api
bun dev --filter=@web42-ai/chat-api
```

### Building

```bash
# Build all apps and packages
bun build

# Build specific app
bun build --filter=@web42-ai/admin-web
bun build --filter=@web42-ai/consumer-web
bun build --filter=@web42-ai/core-api
bun build --filter=@web42-ai/chat-api
```

### Testing & Quality

```bash
# Run linting across all packages
bun lint

# Format code with Prettier
bun format

# Type checking
bun check-types

# Run tests
bun run test

# Run specific project
bun run test --filter=@web42-ai/core-api

# Run specific file
bun run test --filter=@web42-ai/core-api -- user.routes.test.ts

# Run tests with Vitest UI (if configured)

# Run all checks before committing
bun lint && bun check-types
```

### Working with Packages

```bash
# Generate new UI component in @web42-ai/ui
cd packages/ui
bun generate:component
```

## Development Workflow

1. **Filtering Tasks**: Use Turborepo's `--filter` flag to work on specific apps or packages
2. **Port Allocation**:
   - Admin web app: http://localhost:3000
   - Consumer web app: http://localhost:3001
   - Core API server: http://localhost:3002
   - Chat API server: http://localhost:3003
3. **Shared Dependencies**: Changes to packages in `packages/` will automatically be reflected in apps that depend on them
4. **Type Safety**: All packages use strict TypeScript configuration with no unchecked indexed access
5. **Testing**: Use Vitest for all testing needs - tests are located in `__tests__` directories or `.test.ts` files
6. **Code Quality**: Maximum warnings policy (--max-warnings 0) enforced across all linting
7. **Pre-commit Checks**: Always run `bun lint && bun check-types` before committing
8. **Formatting**: Run `bun format` after completing development work

## Important Configuration Files

- `turbo.json` - Defines the task pipeline and caching behavior
- Root `package.json` - Defines workspace configuration and global scripts
- Individual `package.json` files in each app/package - Define specific dependencies and scripts
- `vitest.config.ts` - Test configuration with Node environment and global setup
- `eslint.config.js` - Comprehensive linting rules including security and complexity checks

## UI System Architecture

The `@web42-ai/ui` package uses:

- **shadcn/ui** design system with Radix UI primitives
- **Tailwind CSS** with CSS variables for theming
- **Class Variance Authority (CVA)** for component variant management
- Path-based exports for individual components enabling tree-shaking
- Components located in `packages/ui/src/components/ui/`

## Worker Architecture

Cloudflare Workers in `packages/workers/` handle:

- Queue message processing for the event-driven system
- AI code generation tasks via `plan-steps-queue`
- Build orchestration via `project-builds-queue`
- Real-time status updates to UI and database persistence

## Programming Paradigm

### Functional Programming First

- **Prefer functional programming** over Object-Oriented Programming (OOP)
- Use pure functions whenever possible
- Favor immutability and avoid side effects
- Leverage function composition and higher-order functions

### When to Use Classes

Classes are acceptable in specific scenarios:

- **Extending built-in classes**: `class CustomError extends Error`
- **Framework requirements**: When libraries/frameworks expect class-based patterns

## File Organization

### One Function Per File Rule (Flexible)

**Core Principle:** Balance modularity with pragmatism

- **Prefer one function per file** for significant, standalone utilities
- **Group related functions** when they share domain logic or dependencies
- **Consider semantic cohesion** - functions that work together belong together

**When to Group Functions:**

- Utility functions that operate on the same data type (e.g., `formatDate`, `formatDateTime`)
- Functions that share private helper functions
- Small helper functions that lack standalone semantic meaning
- Functions that are always used together

**When to Separate Functions:**

- Complex functions with distinct responsibilities
- Functions that could be reused independently
- Functions that require different testing strategies

**File Size Guidelines:**

- **Soft limit**: 200 lines per file
- **Hard limit**: 300 lines per file
- **Breaking point**: Split when file becomes difficult to navigate or understand

**Example - Good Grouping:**

```typescript
// dateUtils.ts - Related date formatting functions
export const formatDate = (date: string) => {
  /* ... */
};
export const formatDateTime = (date: string) => {
  /* ... */
};
export const parseISODate = (date: string) => {
  /* ... */
};
```

## Module Structure

### Directory-Based Modules

- Group related functionality into a single directory
- Use `index.ts` to expose public APIs through named exports
- `index.ts` should only re-export resources from the module
- Keep internal implementation private within the module
- Clear separation between public interface and internal details
- Import folder with `index.ts` by using the folder name directly:

```typescript
import { userRoutes } from "users/index"; // ❌ Incorrect
import { userRoutes } from "users"; // ✅ Correct
```

**Export Guidelines:**

- Prefer named exports over wildcard exports for clarity
- Use wildcard exports (`export *`) only when re-exporting comprehensive APIs
- Type-only exports should use `export type` syntax when supported

**Example Structure:**

```
users/
├── index.ts          // Public API exports
├── userRoutes.ts     // Route implementations
├── schemas.ts        // Validation schemas
└── types.ts          // Type definitions
```
