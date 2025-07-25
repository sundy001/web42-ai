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

export function createSuccessResponse(data: { eventId?: string; message: string; [key: string]: any }): Response {
	return new Response(JSON.stringify(data), {
		status: 201,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
