# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turborepo monorepo project named `web42-ai` - an AI site generator platform that creates static React sites from user prompts. The project uses TypeScript throughout and is managed with Bun as the package manager. The architecture is event-driven, utilizing Cloudflare Workers and Queues for scalable, asynchronous processing.

## Architecture

### Monorepo Structure

- **apps/** - Contains the main applications
  - `web/` - Main Next.js application (port 3000) with server-side utilities
  - `docs/` - Documentation Next.js application (port 3001)
  - `workers/` - Cloudflare Workers for queue processing and event handling
- **packages/** - Shared packages across apps
  - `@web42-ai/ui` - Shared React component library using Radix UI, CVA, and Tailwind
  - `@web42-ai/eslint-config` - Comprehensive ESLint configurations with security and complexity rules
  - `@web42-ai/typescript-config` - Shared TypeScript configurations with strict mode

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
bun dev --filter=web
bun dev --filter=docs
```

### Building

```bash
# Build all apps and packages
bun build

# Build specific app
bun build --filter=web
bun build --filter=docs
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
bun test

# Run specific test file
bun test stringUtils

# Run tests with UI
bun test:ui

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
   - Web app: http://localhost:3000
   - Docs app: http://localhost:3001
3. **Shared Dependencies**: Changes to packages in `packages/` will automatically be reflected in apps that depend on them
4. **Type Safety**: All packages use strict TypeScript configuration with no unchecked indexed access
5. **Testing**: Use Vitest for all testing needs - tests are located in `__tests__` directories or `.test.ts` files
6. **Code Quality**: Maximum warnings policy (--max-warnings 0) enforced across all linting

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

Cloudflare Workers in `apps/workers/` handle:

- Queue message processing for the event-driven system
- AI code generation tasks via `plan-steps-queue`
- Build orchestration via `project-builds-queue`
- Real-time status updates to UI and database persistence
