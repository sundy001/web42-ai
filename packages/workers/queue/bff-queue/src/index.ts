import { z } from 'zod';
import { createQueueFetch } from '@/utils/createQueueFetch';
import { statusRequestSchema } from './request-schema';

export type PlanStepRequest = z.infer<typeof statusRequestSchema>;

export interface Env {
	PLAN_STEPS_QUEUE: Queue<PlanStepRequest>;
}

const fetchHandler = createQueueFetch('BFF_QUEUE', statusRequestSchema);

export default {
	fetch: fetchHandler,
} satisfies ExportedHandler<Env>;
