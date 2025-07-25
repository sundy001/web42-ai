import { z } from 'zod';
import { createQueueFetch } from '@/utils/createQueueFetch';
import { planStepRequestSchema } from '../../../utils/createQueueFetch/request-schema';

export type PlanStepRequest = z.infer<typeof planStepRequestSchema>;

export interface Env {
	PLAN_STEPS_QUEUE: Queue<PlanStepRequest>;
}

const fetchHandler = createQueueFetch('PLAN_STEPS_QUEUE', planStepRequestSchema);

export default {
	fetch: fetchHandler,
} satisfies ExportedHandler<Env>;
