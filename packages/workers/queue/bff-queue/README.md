# Cloudflare Worker - BFF Queue

This worker handles incoming plan step execution requests for the AI site generator. It validates requests and queues them for asynchronous processing.

## API Endpoint

- **Method**: `POST` only
- **Content-Type**: `application/json`
- **Response**: 201 Created on success, appropriate error codes on failure

## Request Schema

```json
{}
```

## Response Examples

### Success Response (201)

```json
{}
```

### Error Responses

- **405 Method Not Allowed**: When using methods other than POST
- **415 Unsupported Media Type**: When Content-Type is not application/json
- **400 Bad Request**: For invalid JSON or validation errors
- **503 Service Unavailable**: When queue operations fail

## Features

- **Comprehensive validation** using Zod schema
- **Graceful error handling** with detailed error messages
- **Security considerations**: Input validation, type safety, error sanitization
- **Test mode support**: Use `x-test-mode: true` header to skip queue operations
- **Retry limiting**: Maximum 2 retries per request

## Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Deploy
wrangler deploy
```
