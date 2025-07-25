# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turborepo monorepo project named `web42-ai` that contains multiple Next.js applications and shared packages. The project uses TypeScript throughout and is managed with Bun as the package manager.

## Architecture

### Monorepo Structure

- **apps/** - Contains the main applications
  - `web/` - Main Next.js application (port 3000)
  - `docs/` - Documentation Next.js application (port 3001)
- **packages/** - Shared packages across apps
  - `@web42-ai/ui` - Shared React component library
  - `@web42-ai/eslint-config` - Shared ESLint configurations
  - `@web42-ai/typescript-config` - Shared TypeScript configurations

### Key Technologies

- **Build System**: Turborepo with task orchestration
- **Framework**: Next.js 15 with Turbopack
- **Language**: TypeScript 5.8
- **Package Manager**: Bun 1.2.17
- **UI**: React 19
- **Code Quality**: ESLint (with plugins for security, promises, imports, code complexity), Prettier

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
4. **Type Safety**: All packages use strict TypeScript configuration inherited from `@web42-ai/typescript-config`

## Important Configuration Files

- `turbo.json` - Defines the task pipeline and caching behavior
- Root `package.json` - Defines workspace configuration and global scripts
- Individual `package.json` files in each app/package - Define specific dependencies and scripts
