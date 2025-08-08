import { z } from 'zod';

export const statusRequestSchema = z.record(z.string(), z.unknown());
