import { z } from 'zod';

export interface QueueFetchOptions<T extends z.ZodTypeAny> {
	queueName: string;
	schema: T;
	successMessageBuilder?: (data: z.infer<T>) => { eventId?: string; message: string };
}

export interface QueueEnv<T> {
	[key: string]: Queue<T> | unknown;
}

export interface QueueSuccessPayload {
	eventId?: string;
	message: string;
	[key: string]: unknown;
}
