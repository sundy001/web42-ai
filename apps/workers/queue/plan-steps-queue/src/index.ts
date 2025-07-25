import { z } from 'zod';
import { WorkerError } from './WorkerError';
import { createErrorResponse, createSuccessResponse } from './response';
import { sanitizeError } from './zod-utils';
import { planStepRequestSchema } from './request-schema';

export type PlanStepRequest = z.infer<typeof planStepRequestSchema>;

export interface Env {
	PLAN_STEPS_QUEUE: Queue<PlanStepRequest>;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

			const validationResult = planStepRequestSchema.safeParse(requestBody);
			if (!validationResult.success) {
				throw new WorkerError('Validation error', 400, sanitizeError(validationResult.error));
			}

			const planStepRequest = validationResult.data;

			const isTestRequest = request.headers.get('x-test-mode') === 'true';
			if (isTestRequest) {
				console.log('Test mode: Skipping queue send', planStepRequest);
			} else {
				try {
					await env.PLAN_STEPS_QUEUE.send(planStepRequest);
				} catch (queueError) {
					console.error('Failed to send message to queue:', queueError);
					throw new WorkerError('Service temporarily unavailable', 503, { reason: 'Queue operation failed' });
				}
			}

			return createSuccessResponse({
				eventId: planStepRequest.eventId,
				message: 'Plan step execution request queued successfully',
			});
		} catch (error) {
			console.error('Unexpected error in worker:', error);
			if (error instanceof WorkerError) {
				return createErrorResponse(error.status, error.message, error.details);
			}
			return createErrorResponse(500, 'Internal server error', process.env.NODE_ENV === 'development' ? sanitizeError(error) : undefined);
		}
	},
} satisfies ExportedHandler<Env>;
