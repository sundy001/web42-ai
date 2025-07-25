import { z } from 'zod';
import { WorkerError } from './workerError';
import { createErrorResponse, createSuccessResponse } from './response';
import { sanitizeError } from './zod-utils';

export interface QueueEnv<T> {
	[key: string]: Queue<T> | any;
}

export interface QueueFetchOptions<T extends z.ZodTypeAny> {
	queueName: string;
	schema: T;
	successMessageBuilder?: (data: z.infer<T>) => { eventId?: string; message: string };
}

export function createQueueFetch<T extends z.ZodTypeAny>(queueName: string, schema: T) {
	return async function fetch(request: Request, env: QueueEnv<z.infer<T>>, ctx: ExecutionContext): Promise<Response> {
		try {
			if (request.method !== 'POST') {
				throw new WorkerError('Method not allowed', 405, { allowedMethods: ['POST'] });
			}

			const contentType = request.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				throw new WorkerError('Unsupported Media Type', 415, { expected: 'application/json' });
			}

			let requestBody: unknown;
			try {
				requestBody = await request.json();
			} catch (e) {
				throw new WorkerError('Invalid JSON in request body', 400, { parseError: String(e) });
			}

			const validationResult = schema.safeParse(requestBody);
			if (!validationResult.success) {
				throw new WorkerError('Validation error', 400, sanitizeError(validationResult.error));
			}

			const validatedData = validationResult.data;
			const queue = env[queueName] as Queue<z.infer<T>>;

			if (!queue) {
				throw new WorkerError('Queue not configured', 500, { queueName });
			}

			const isTestRequest = request.headers.get('x-test-mode') === 'true';
			if (isTestRequest) {
				console.log(`Test mode: Skipping ${queueName} send`, validatedData);
			} else {
				try {
					await queue.send(validatedData);
				} catch (queueError) {
					console.error(`Failed to send message to ${queueName}:`, queueError);
					throw new WorkerError('Service temporarily unavailable', 503, { reason: 'Queue operation failed' });
				}
			}

			// Build success response
			let responseData: any;

			// For plan-steps-queue, use the specific message format
			if (queueName === 'PLAN_STEPS_QUEUE' && validatedData && typeof validatedData === 'object' && 'eventId' in validatedData) {
				responseData = {
					eventId: validatedData.eventId,
					message: 'Plan step execution request queued successfully',
				};
			} else {
				// Generic response for other queues
				responseData = {
					message: `Request queued successfully to ${queueName}`,
				};

				// If the data has an eventId field, include it in the response
				if (validatedData && typeof validatedData === 'object' && 'eventId' in validatedData) {
					responseData.eventId = validatedData.eventId;
				}
			}

			return createSuccessResponse(responseData);
		} catch (error) {
			console.error(`Unexpected error in ${queueName} worker:`, error);
			if (error instanceof WorkerError) {
				return createErrorResponse(error.status, error.message, error.details);
			}
			return createErrorResponse(500, 'Internal server error', process.env.NODE_ENV === 'development' ? sanitizeError(error) : undefined);
		}
	};
}
