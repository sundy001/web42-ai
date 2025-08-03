# CLAUDE.md - Core API

Claude Code guidance for the Core API Express server in the web42-ai platform.

## Project Overview

Core API is an Express.js server that provides authentication, user management, and administrative functionality for the web42-ai platform. It serves as the primary backend API handling business logic, data persistence, and integration with Supabase authentication.

## Architecture Overview

### Domain-Driven Design

The application follows domain-driven design principles with clear separation of concerns:

```
src/
├── config/          # Application configuration and logging
├── domains/         # Business domains (users, auth, admin)
├── middleware/      # Express middleware
├── openapi/         # API documentation
├── stores/          # Data access layer
├── testUtils/       # Testing utilities
└── utils/           # Shared utilities
```

### Domain Structure

Each domain follows a consistent layered architecture:

- **Service Layer**: Core business logic (`*.service.ts`)
- **Repository Layer**: Data access patterns (`*.repository.ts`)
- **Presentation Layer**: HTTP routes (`*.routes.ts`)
- **Validation Layer**: Input schemas (`*.schemas.ts`)
- **Type Contracts**: Domain types (`types.ts`, `*.schemas.ts`)
- **Public API**: Exported interfaces (`index.ts`)

### Key Technologies

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with strict configuration
- **Authentication**: Supabase Auth integration
- **Database**: MongoDB with native driver
- **Validation**: Zod schemas with OpenAPI integration
- **Logging**: Pino structured logging with HTTP middleware
- **Testing**: Vitest with Supertest for API testing
- **Documentation**: OpenAPI 3.1 with Swagger UI

## Core Features

### Authentication & Authorization

- Supabase authentication integration
- JWT token management with refresh functionality
- Role-based access control (admin, user)
- Cookie-based session management
- Protected route middleware

### User Management

- Full CRUD operations for user entities
- Soft delete functionality with restore capability
- Email uniqueness validation
- User status management (active, inactive, suspended)
- Administrative user oversight

### API Documentation

- OpenAPI 3.1 specification
- Swagger UI interface at `/api-docs`
- Schema validation with automatic documentation
- Example generation for all endpoints

### Health & Monitoring

- Health check endpoint with database connectivity
- Structured logging with request correlation
- Graceful shutdown handling
- Environment-based configuration

## Development Commands

```bash
# Development with hot reload
bun dev

# Build TypeScript
bun build

# Start production server
bun start

# Run tests
bun run test

# Lint code
bun lint

# Type checking
bun check-types

# Database migrations
bun run migrate
bun run migrate:down
bun run migrate:status
```

## API Endpoints

### Core Endpoints

- `GET /health` - Health check with database status
- `GET /api/v1/status` - API status and version
- `GET /api-docs` - Swagger UI documentation
- `GET /api-docs.json` - OpenAPI specification

### Authentication

- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/refresh/api` - API token refresh
- `POST /api/v1/auth/signout` - User logout
- `GET /api/v1/auth/me` - Current user profile

### User Management (Admin)

- `GET /api/v1/admin/users` - List users with pagination
- `POST /api/v1/admin/users` - Create new user
- `GET /api/v1/admin/users/:id` - Get user by ID
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Soft delete user
- `POST /api/v1/admin/users/:id/restore` - Restore deleted user

## Configuration

### Environment Variables

- `NODE_ENV` - Environment (development, production)
- `PORT` - Server port (default: 3002)
- `DATABASE_URI` - MongoDB connection string
- `DATABASE_NAME` - MongoDB database name
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Security Configuration

- Helmet.js for security headers
- CORS with environment-specific origins
- Cookie parsing with security options
- Input validation with Zod schemas

## Testing Strategy

### Test Organization

- Unit tests: `*.test.ts` files alongside source
- Integration tests: API endpoint testing with Supertest
- Test fixtures: Reusable test data in `*TestFixtures.ts`
- Test utilities: Shared helpers in `testUtils/`

### Test Categories

- **Service Tests**: Business logic validation
- **Route Tests**: HTTP endpoint integration
- **Schema Tests**: Input validation testing
- **Repository Tests**: Data access layer testing

## Database Integration

### MongoDB Connection

- Native MongoDB driver integration
- Connection pooling and health monitoring
- Graceful connection handling
- Migration support via `@web42-ai/migrations`

### Data Access Patterns

- Repository pattern for data access
- Type-safe database operations
- Consistent error handling
- Transaction support where needed

## Code Organization Guidelines

### Domain Boundaries

- Clear separation between domains
- Minimal cross-domain dependencies
- Shared utilities in dedicated modules
- Public APIs through `index.ts` exports

### File Naming Conventions

- `*.service.ts` - Business logic layer
- `*.repository.ts` - Data access layer
- `*.routes.ts` - HTTP presentation layer
- `*.schemas.ts` - Validation and type schemas
- `*.test.ts` - Test files
- `types.ts` - Domain-specific types
- `index.ts` - Public API exports

### Import Patterns

- Use path aliases (`@/config`, `@/domains`)
- Prefer named imports over default imports
- Import from domain public APIs (`index.ts`)
- Group imports: external, internal, relative

## Integration Points

### Supabase Integration

- Authentication provider abstraction
- User profile synchronization
- JWT token validation
- Session management

### Monorepo Integration

- Shared ESLint and TypeScript configurations
- Workspace dependencies for shared packages
- Turborepo build pipeline integration
- Consistent development workflows

## Quality Standards

### Code Quality

- Maximum warnings policy (`--max-warnings 0`)
- Strict TypeScript configuration
- Comprehensive ESLint rules
- Consistent code formatting with Prettier

### Testing Requirements

- Unit test coverage for business logic
- Integration tests for all API endpoints
- Error case validation
- Mock external dependencies appropriately

### Documentation Standards

- OpenAPI documentation for all endpoints
- Inline code documentation for complex logic
- README maintenance for setup instructions
- Type definitions for all public APIs

## Common Patterns

### Error Handling

- Centralized error middleware
- Consistent error response format
- Proper HTTP status codes
- Structured error logging

### Validation

- Zod schema validation at route level
- Input sanitization and type coercion
- Comprehensive error messages
- OpenAPI integration for documentation

### Async Operations

- Promise-based patterns throughout
- Proper error propagation
- Resource cleanup in finally blocks
- Graceful degradation for external dependencies
