import { z } from 'zod';
import { WorkerError } from './workerError';
import { createErrorResponse, createSuccessResponse } from './response';
import { sanitizeError } from './zod-utils';

export interface QueueEnv<T> {
	[key: string]: Queue<T> | unknown;
}

export interface QueueFetchOptions<T extends z.ZodTypeAny> {
	queueName: string;
	schema: T;
	successMessageBuilder?: (data: z.infer<T>) => { eventId?: string; message: string };
}

function validateRequest(request: Request): void {
	if (request.method !== 'POST') {
		throw new WorkerError('Method not allowed', 405, { allowedMethods: ['POST'] });
	}

	const contentType = request.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new WorkerError('Unsupported Media Type', 415, { expected: 'application/json' });
	}
}

async function parseRequestBody(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch (e) {
		throw new WorkerError('Invalid JSON in request body', 400, { parseError: String(e) });
	}
}

async function sendToQueue<T>(
	queue: Queue<T> | undefined,
	queueName: string,
	data: T,
	isTestRequest: boolean
): Promise<void> {
	if (!queue) {
		throw new WorkerError('Queue not configured', 500, { queueName });
	}

	if (isTestRequest) {
		console.log(`Test mode: Skipping ${queueName} send`, data);
		return;
	}

	try {
		await queue.send(data);
	} catch (queueError) {
		console.error(`Failed to send message to ${queueName}:`, queueError);
		throw new WorkerError('Service temporarily unavailable', 503, { reason: 'Queue operation failed' });
	}
}

function buildSuccessResponse<T>(queueName: string, validatedData: T): { eventId?: string; message: string } {
	const hasEventId = validatedData && typeof validatedData === 'object' && 'eventId' in validatedData;

	if (queueName === 'PLAN_STEPS_QUEUE' && hasEventId) {
		return {
			eventId: (validatedData as { eventId: string }).eventId,
			message: 'Plan step execution request queued successfully',
		};
	}

	const responseData: { eventId?: string; message: string } = {
		message: `Request queued successfully to ${queueName}`,
	};

	if (hasEventId) {
		responseData.eventId = (validatedData as { eventId: string }).eventId;
	}

	return responseData;
}

export function createQueueFetch<T extends z.ZodTypeAny>(queueName: string, schema: T) {
	return async function fetch(request: Request, env: QueueEnv<z.infer<T>>): Promise<Response> {
		try {
			validateRequest(request);
			const requestBody = await parseRequestBody(request);

			const validationResult = schema.safeParse(requestBody);
			if (!validationResult.success) {
				throw new WorkerError('Validation error', 400, sanitizeError(validationResult.error));
			}

			const validatedData = validationResult.data;
			const queue = env[queueName as keyof typeof env] as Queue<z.infer<T>>;
			const isTestRequest = request.headers.get('x-test-mode') === 'true';

			await sendToQueue(queue, queueName, validatedData, isTestRequest);
			const responseData = buildSuccessResponse(queueName, validatedData);

			return createSuccessResponse(responseData);
		} catch (error) {
			console.error(`Unexpected error in ${queueName} worker:`, error);
			if (error instanceof WorkerError) {
				return createErrorResponse(error.status, error.message, error.details);
			}
			const isDevelopment = false; // Disable detailed errors in production
			return createErrorResponse(500, 'Internal server error', isDevelopment ? sanitizeError(error) : undefined);
		}
	};
}
