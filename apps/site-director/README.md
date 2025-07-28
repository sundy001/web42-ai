# Core API

Express server for the web42-ai platform.

## Overview

Core API is a Node.js Express server that serves as part of the web42-ai ecosystem. It provides API endpoints and manages site-related operations.

## Features

- ✅ Express.js with TypeScript
- ✅ Security middleware (Helmet)
- ✅ CORS support
- ✅ Request logging (Morgan)
- ✅ Health check endpoint
- ✅ Error handling
- ✅ Development with hot reload

## Development

### Prerequisites

- Node.js 18+
- Bun (package manager)

### Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun build

# Start production server
bun start

# Run tests
bun test

# Lint code
bun lint

# Type check
bun check-types
```

### Server Information

- **Port**: 3002 (default)
- **Package**: `@web42-ai/core-api`

## API Endpoints

### Health Check

```
GET /health
```

Returns server health status and uptime information.

### API Status

```
GET /api/v1/status
```

Returns API status and version information.

### Welcome

```
GET /
```

Returns welcome message and available endpoints.

## Project Structure

```
apps/core-api/
├── src/
│   ├── index.ts        # Main server file
│   └── index.test.ts   # Tests
├── dist/               # Compiled output
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── eslint.config.js    # ESLint configuration
└── vitest.config.ts    # Test configuration
```

## Scripts

- `bun dev` - Start development server with hot reload
- `bun build` - Build TypeScript to dist/
- `bun start` - Start production server
- `bun test` - Run tests with Vitest
- `bun lint` - Lint code with ESLint
- `bun check-types` - Type check with TypeScript

## Dependencies

### Production

- `express` - Web framework
- `cors` - CORS middleware
- `helmet` - Security middleware
- `morgan` - HTTP request logger

### Development

- `tsx` - TypeScript execution
- `typescript` - TypeScript compiler
- `vitest` - Testing framework
- `eslint` - Code linting
- Various type definitions

## Integration

This server is part of the web42-ai Turborepo monorepo and follows the shared configuration:

- Uses `@web42-ai/eslint-config` for linting
- Uses `@web42-ai/typescript-config` for TypeScript
- Integrated with Turborepo build pipeline
