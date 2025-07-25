import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import { createQueueFetch } from './createQueueFetch';
import { planStepRequestSchema } from '../../queue/plan-steps-queue/src/request-schema';

const TEST_URL = 'https://example.com';

type TestEnv = {
	TEST_QUEUE: { send: ReturnType<typeof vi.fn> };
	SIMPLE_QUEUE: { send: ReturnType<typeof vi.fn> };
	EVENT_QUEUE: { send: ReturnType<typeof vi.fn> };
	PLAN_STEPS_QUEUE: { send: ReturnType<typeof vi.fn> };
};

describe('createQueueFetch', () => {
	let env: TestEnv;
	let fetchHandler: ReturnType<typeof createQueueFetch>;
	let originalConsoleLog: typeof console.log;
	let originalConsoleError: typeof console.error;

	beforeAll(() => {
		// Mute console messages during tests
		originalConsoleLog = console.log;
		originalConsoleError = console.error;
		console.log = vi.fn();
		console.error = vi.fn();
	});

	afterAll(() => {
		// Restore console messages after tests
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
	});

	beforeEach(() => {
		// Reset the mocked console functions before each test
		vi.clearAllMocks();

		env = {
			TEST_QUEUE: {
				send: vi.fn().mockResolvedValue(undefined),
			},
		};
	});

	const validPayload = {
		eventId: 'evt_abc123',
		eventType: 'plan_step_execution' as const,
		timestamp: '2023-10-27T10:15:00Z',
		projectId: 'project_123',
		planId: 'plan_abc',
		taskId: 'task_001',
		version: {
			from: {
				versionId: 1,
				r2Path: '/projects/project_123/v1/',
			},
			to: {
				versionId: 2,
				r2Path: '/projects/project_123/v2/',
			},
		},
		task: {
			title: 'Editing PlanSelector component',
			description: 'Add dropdown functionality to allow users to select different math difficulty levels',
			dependencies: ['src/components/Header.tsx', 'src/types/difficulty.ts'],
		},
		context: {
			userPrompt: 'Add difficulty selection to the math test',
		},
		retryCount: 0,
	};

	describe('with plan step schema', () => {
		beforeEach(() => {
			fetchHandler = createQueueFetch('TEST_QUEUE', planStepRequestSchema);
		});

		describe('HTTP Method Validation', () => {
			it('should accept POST requests', async () => {
				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(201);
				expect(response.headers.get('Content-Type')).toBe('application/json');
				expect(env.TEST_QUEUE.send).toHaveBeenCalledWith(validPayload);
			});

			it('should reject GET requests with 405', async () => {
				const request = new Request(TEST_URL, {
					method: 'GET',
				});

				const response = await fetchHandler(request, env);
				const body = await response.json();

				expect(response.status).toBe(405);
				expect(body.error).toBe('Method not allowed');
				expect(body.details.allowedMethods).toEqual(['POST']);
				expect(env.TEST_QUEUE.send).not.toHaveBeenCalled();
			});

			it('should reject PUT requests with 405', async () => {
				const request = new Request(TEST_URL, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(405);
				expect(env.TEST_QUEUE.send).not.toHaveBeenCalled();
			});
		});

		describe('Content-Type Validation', () => {
			it('should reject requests without Content-Type header', async () => {
				const request = new Request(TEST_URL, {
					method: 'POST',
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, env);
				const body = await response.json();

				expect(response.status).toBe(415);
				expect(body.error).toBe('Unsupported Media Type');
				expect(body.details.expected).toBe('application/json');
			});

			it('should reject requests with incorrect Content-Type', async () => {
				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'text/plain' },
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(415);
			});
		});

		describe('JSON Parsing', () => {
			it('should reject invalid JSON with 400', async () => {
				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: 'invalid json',
				});

				const response = await fetchHandler(request, env);
				const body = await response.json();

				expect(response.status).toBe(400);
				expect(body.error).toBe('Invalid JSON in request body');
				expect(body.details.parseError).toBeDefined();
			});

			it('should handle empty body', async () => {
				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: '',
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(400);
			});
		});

		describe('Payload Validation', () => {
			it('should accept valid payload', async () => {
				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, env);
				const body = await response.json();

				expect(response.status).toBe(201);
				expect(body.message).toContain('queued successfully');
			});

			it('should reject payload with missing required fields', async () => {
				const invalidPayload = {
					eventId: 'evt_123',
					eventType: 'plan_step_execution',
				};

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(invalidPayload),
				});

				const response = await fetchHandler(request, env);
				const body = await response.json();

				expect(response.status).toBe(400);
				expect(body.error).toBe('Validation error');
				expect(body.details.issues).toBeDefined();
				expect(body.details.issues.length).toBeGreaterThan(0);
			});

			it('should reject invalid eventType', async () => {
				const invalidPayload = {
					...validPayload,
					eventType: 'invalid_type',
				};

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(invalidPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(400);
			});

			it('should reject invalid timestamp format', async () => {
				const invalidPayload = {
					...validPayload,
					timestamp: 'not-a-date',
				};

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(invalidPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(400);
			});

			it('should reject negative version IDs', async () => {
				const invalidPayload = {
					...validPayload,
					version: {
						from: { versionId: -1, r2Path: '/path' },
						to: { versionId: 2, r2Path: '/path' },
					},
				};

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(invalidPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(400);
			});

			it('should enforce string length limits', async () => {
				const invalidPayload = {
					...validPayload,
					task: {
						...validPayload.task,
						title: 'a'.repeat(256),
					},
				};

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(invalidPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(400);
			});

			it('should set default retryCount to 0 if not provided', async () => {
				const payloadWithoutRetry = { ...validPayload };
				delete (payloadWithoutRetry as Record<string, unknown>).retryCount;

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payloadWithoutRetry),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(201);
				expect(env.TEST_QUEUE.send).toHaveBeenCalledWith(expect.objectContaining({ retryCount: 0 }));
			});
		});

		describe('Queue Operations', () => {
			it('should handle queue send failures', async () => {
				env.TEST_QUEUE.send = vi.fn().mockRejectedValue(new Error('Queue error'));

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, env);
				const body = await response.json();

				expect(response.status).toBe(503);
				expect(body.error).toBe('Service temporarily unavailable');
				expect(body.details.reason).toBe('Queue operation failed');
				// Verify that console.error was called for the queue failure
				expect(console.error).toHaveBeenCalledWith('Failed to send message to TEST_QUEUE:', expect.any(Error));
			});

			it('should skip queue send in test mode', async () => {
				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-test-mode': 'true',
					},
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, env);

				expect(response.status).toBe(201);
				expect(env.TEST_QUEUE.send).not.toHaveBeenCalled();
				// Verify that console.log was called for test mode logging
				expect(console.log).toHaveBeenCalledWith('Test mode: Skipping TEST_QUEUE send', validPayload);
			});

			it('should handle missing queue configuration', async () => {
				const envWithoutQueue = {};

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, envWithoutQueue);
				const body = await response.json();

				expect(response.status).toBe(500);
				expect(body.error).toBe('Queue not configured');
			});
		});

		describe('Error Handling', () => {
			it('should handle unexpected errors gracefully', async () => {
				const brokenEnv = {
					TEST_QUEUE: {
						send: vi.fn().mockImplementation(() => {
							throw new Error('Unexpected internal error');
						}),
					},
				};

				const request = new Request(TEST_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(validPayload),
				});

				const response = await fetchHandler(request, brokenEnv);
				const body = await response.json();

				expect(response.status).toBe(503);
				expect(body.error).toBe('Service temporarily unavailable');
			});
		});
	});

	describe('with different schemas', () => {
		it('should work with a simple schema', async () => {
			const simpleSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const simpleFetch = createQueueFetch('SIMPLE_QUEUE', simpleSchema);
			env.SIMPLE_QUEUE = { send: vi.fn().mockResolvedValue(undefined) };

			const request = new Request(TEST_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '123', name: 'Test' }),
			});

			const response = await simpleFetch(request, env);
			const body = await response.json();

			expect(response.status).toBe(201);
			expect(body.message).toBe('Request queued successfully to SIMPLE_QUEUE');
			expect(env.SIMPLE_QUEUE.send).toHaveBeenCalledWith({ id: '123', name: 'Test' });
		});

		it('should handle eventId in response for schemas with eventId field', async () => {
			const schemaWithEventId = z.object({
				eventId: z.string(),
				data: z.string(),
			});

			const fetchWithEventId = createQueueFetch('EVENT_QUEUE', schemaWithEventId);
			env.EVENT_QUEUE = { send: vi.fn().mockResolvedValue(undefined) };

			const request = new Request(TEST_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId: 'evt_123', data: 'test data' }),
			});

			const response = await fetchWithEventId(request, env);
			const body = await response.json();

			expect(response.status).toBe(201);
			expect(body.eventId).toBe('evt_123');
			expect(body.message).toContain('queued successfully');
		});
	});
});
