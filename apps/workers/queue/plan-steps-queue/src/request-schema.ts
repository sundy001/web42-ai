import { z } from 'zod';

const versionSchema = z.object({
	versionId: z.number().int().positive(),
	r2Path: z.string().min(1),
});

const taskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().min(1).max(1000),
	dependencies: z.array(z.string()).default([]),
});

const contextSchema = z.object({
	userPrompt: z.string().min(1).max(5000),
});

export const planStepRequestSchema = z.object({
	eventId: z.string().min(1).max(100),
	eventType: z.literal('plan_step_execution'),
	timestamp: z.string().datetime(),
	projectId: z.string().min(1).max(100),
	planId: z.string().min(1).max(100),
	taskId: z.string().min(1).max(100),
	version: z.object({
		from: versionSchema,
		to: versionSchema,
	}),
	task: taskSchema,
	context: contextSchema,
	retryCount: z.number().int().min(0).max(10).default(0),
});
