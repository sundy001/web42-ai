# Chat API

Express.js server for chat functionality in the web42-ai platform.

## Features

- **Chat Management**: Send messages and receive AI responses
- **Session Management**: Create, retrieve, and delete chat sessions
- **REST API**: RESTful endpoints with proper HTTP status codes
- **OpenAPI Documentation**: Swagger UI available at `/api-docs`
- **Health Checks**: Health monitoring endpoint
- **Type Safety**: Full TypeScript support with Zod validation
- **Testing**: Comprehensive test suite with Vitest

## API Endpoints

### Chat

- `POST /api/v1/chat/send` - Send a message and get AI response
- `GET /api/v1/chat/session/:sessionId` - Get specific chat session
- `GET /api/v1/chat/sessions` - Get all chat sessions
- `DELETE /api/v1/chat/session/:sessionId` - Delete chat session

### System

- `GET /health` - Health check
- `GET /api/v1/status` - API status
- `GET /api-docs` - Swagger documentation

## Development

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

# Run linting
bun lint

# Type checking
bun check-types
```

## Configuration

- **Port**: 3003 (default)
- **CORS**: Enabled for all origins
- **Security**: Helmet middleware for security headers
- **Logging**: Morgan middleware for request logging

## Example Usage

### Send a Message

```bash
curl -X POST http://localhost:3003/api/v1/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to build a portfolio website"
  }'
```

### Get Chat Session

```bash
curl http://localhost:3003/api/v1/chat/session/your-session-id
```

## Architecture

The Chat API follows a modular architecture:

- **Routes**: Express routes for handling HTTP requests
- **Middleware**: Request validation and error handling
- **Types**: TypeScript interfaces for type safety
- **Schemas**: Zod schemas for runtime validation
- **Stores**: Data management (currently in-memory, can be extended to database)
- **OpenAPI**: API documentation generation

## Production Considerations

This implementation uses in-memory storage for simplicity. For production use, consider:

- Database integration (MongoDB, PostgreSQL, etc.)
- Authentication and authorization
- Rate limiting
- Caching (Redis)
- Real AI integration
- WebSocket support for real-time chat
- Message persistence and history
- User session management
