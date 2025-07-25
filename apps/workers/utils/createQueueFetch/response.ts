import type { QueueSuccessPayload } from './type';

export function createErrorResponse(status: number, error: string, details?: unknown): Response {
	return new Response(
		JSON.stringify({
			error,
			details,
		}),
		{
			status,
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
}

export function createSuccessResponse(payload: QueueSuccessPayload): Response {
	return new Response(JSON.stringify(payload), {
		status: 201,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
