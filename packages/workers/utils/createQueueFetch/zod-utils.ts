import { z } from 'zod';

export function sanitizeError(error: unknown): unknown {
	if (error instanceof z.ZodError) {
		return {
			issues: error.issues.map((issue) => ({
				path: issue.path.join('.'),
				message: issue.message,
				code: issue.code,
			})),
		};
	}
	return String(error);
}
