# Cloudflare Worker - Plan Steps Queue

This worker handles incoming plan step execution requests for the AI site generator. It validates requests and queues them for asynchronous processing.

## API Endpoint

- **Method**: `POST` only
- **Content-Type**: `application/json`
- **Response**: 201 Created on success, appropriate error codes on failure

## Request Schema

```json
{
  "eventId": "string (required, max 100 chars)",
  "eventType": "plan_step_execution" (literal, required),
  "timestamp": "ISO 8601 datetime string (required)",
  "projectId": "string (required, max 100 chars)",
  "planId": "string (required, max 100 chars)",
  "taskId": "string (required, max 100 chars)",
  "version": {
    "from": {
      "versionId": "positive integer (required)",
      "r2Path": "string (required)"
    },
    "to": {
      "versionId": "positive integer (required)",
      "r2Path": "string (required)"
    }
  },
  "task": {
    "title": "string (required, max 255 chars)",
    "description": "string (required, max 1000 chars)",
    "dependencies": ["array of strings (optional, defaults to empty array)"]
  },
  "context": {
    "userPrompt": "string (required, max 5000 chars)"
  },
  "retryCount": "integer 0-10 (optional, defaults to 0)"
}
```

## Response Examples

### Success Response (201)

```json
{
	"eventId": "evt_abc123",
	"message": "Plan step execution request queued successfully"
}
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
