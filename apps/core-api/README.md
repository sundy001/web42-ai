# Core API

Express server for the web42-ai platform providing authentication, user management, and administrative functionality.

## Overview

Core API is a Node.js Express server that serves as the primary backend API for the web42-ai ecosystem. It handles authentication, user management, administrative operations, and provides comprehensive API documentation with OpenAPI integration.

## Features

- ✅ **Authentication & Authorization**: Supabase integration with JWT tokens and role-based access
- ✅ **User Management**: Full CRUD operations with soft delete and administrative oversight
- ✅ **API Documentation**: OpenAPI 3.1 specification with Swagger UI interface
- ✅ **Database Integration**: MongoDB with native driver and migration support
- ✅ **Security**: Helmet.js, CORS, input validation, and structured logging
- ✅ **Testing**: Comprehensive test suite with Vitest and Supertest
- ✅ **Development**: Hot reload, type checking, and quality gates

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
bun run test

# Lint code
bun lint

# Type check
bun check-types

# Database migrations
bun run migrate
bun run migrate:down
bun run migrate:status
```

### Server Information

- **Port**: 3002 (default)
- **Package**: `@web42-ai/core-api`

## API Endpoints

### Core Endpoints

```
GET /health               # Health check with database status
GET /api/v1/status       # API status and version information
GET /                    # Welcome message and available endpoints
GET /api-docs            # Swagger UI documentation (development only)
GET /api-docs.json       # OpenAPI specification (development only)
```

### Authentication

```
POST /api/v1/auth/login         # User authentication
POST /api/v1/auth/refresh       # Token refresh
POST /api/v1/auth/refresh/api   # API token refresh
POST /api/v1/auth/signout       # User logout
GET  /api/v1/auth/me           # Current user profile
```

### User Management (Admin)

```
GET    /api/v1/admin/users           # List users with pagination
POST   /api/v1/admin/users           # Create new user
GET    /api/v1/admin/users/:id       # Get user by ID
PUT    /api/v1/admin/users/:id       # Update user
DELETE /api/v1/admin/users/:id       # Soft delete user
POST   /api/v1/admin/users/:id/restore  # Restore deleted user
```

### Projects

```
POST /api/v1/projects/from-prompt    # Create project from user prompt
```

## Project Structure

```
apps/core-api/
├── src/
│   ├── config/          # Application configuration and logging
│   ├── domains/         # Business domains (auth, admin/users, messages, projects)
│   ├── middleware/      # Express middleware
│   ├── openapi/         # API documentation
│   ├── stores/          # Data access layer
│   ├── testUtils/       # Testing utilities
│   ├── utils/           # Shared utilities
│   └── index.ts         # Main server file
├── migrations/          # Database migration files
├── dist/               # Compiled output
├── CLAUDE.md           # Claude Code guidance
├── README.md           # Project documentation
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── eslint.config.ts    # ESLint configuration
├── vitest.config.ts    # Test configuration
└── vitest.setup.ts     # Test setup
```

## Scripts

- `bun dev` - Start development server with hot reload
- `bun build` - Build TypeScript to dist/
- `bun start` - Start production server
- `bun run test` - Run tests with Vitest
- `bun lint` - Lint code with ESLint
- `bun check-types` - Type check with TypeScript
- `bun run migrate` - Run database migrations
- `bun run migrate:down` - Rollback database migrations
- `bun run migrate:status` - Check migration status

## Dependencies

### Production

- `express` - Web framework for HTTP server
- `cors` - Cross-origin resource sharing middleware
- `helmet` - Security headers middleware
- `zod` - Schema validation and type inference
- `mongodb` - Native MongoDB driver
- `@supabase/supabase-js` - Supabase authentication client
- `pino` - Structured logging with HTTP middleware
- `swagger-ui-express` - API documentation interface
- `@anatine/zod-openapi` - OpenAPI schema generation
- `@web42-ai/types` - Shared type definitions and validation schemas

### Development

- `typescript` - TypeScript compiler and language server
- `vitest` - Testing framework with TypeScript support
- `supertest` - HTTP assertion testing
- `eslint` - Code linting with security and complexity rules
- `tsx` - TypeScript execution for development
- Various type definitions for development dependencies

## Architecture

### Domain-Driven Design

The application follows domain-driven design with clear separation of concerns:

- **Service Layer**: Core business logic (`*.service.ts`)
- **Repository Layer**: Data access patterns (`*.repository.ts`)
- **Presentation Layer**: HTTP routes (`*.routes.ts`)
- **Type Contracts**: Shared types from `@web42-ai/types` and domain-specific types

### Key Domains

- **Authentication**: User login, token management, session handling
- **User Management**: CRUD operations, soft delete, administrative oversight
- **Messages**: Message storage and retrieval with cursor-based pagination
- **Projects**: Project creation and management
- **Health Monitoring**: Database connectivity, system status

## Configuration

### Environment Variables

- `NODE_ENV` - Environment (development, production)
- `PORT` - Server port (default: 3002)
- `DATABASE_URI` - MongoDB connection string
- `DATABASE_NAME` - MongoDB database name
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_API_KEY` - Supabase API key

## Integration

This server is part of the web42-ai Turbopack monorepo and follows the shared configuration:

- Uses `@web42-ai/eslint-config` for linting rules
- Uses `@web42-ai/typescript-config` for TypeScript configuration
- Uses `@web42-ai/types` for shared type definitions and validation schemas
- Uses `@web42-ai/migrations` for database migration management
- Integrated with Turbopack build pipeline and task orchestration
