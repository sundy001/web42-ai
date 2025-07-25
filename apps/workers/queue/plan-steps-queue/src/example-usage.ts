/**
 * Example usage of createQueueFetch for different queue workers
 */

import { z } from 'zod';
import { createQueueFetch } from './createQueueFetch';

// Example 1: Build Status Queue
const buildStatusSchema = z.object({
  buildId: z.string(),
  projectId: z.string(),
  status: z.enum(['started', 'in_progress', 'completed', 'failed']),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export interface BuildStatusEnv {
  BUILD_STATUS_QUEUE: Queue<z.infer<typeof buildStatusSchema>>;
}

const buildStatusFetch = createQueueFetch('BUILD_STATUS_QUEUE', buildStatusSchema);

export const buildStatusWorker = {
  fetch: buildStatusFetch,
} satisfies ExportedHandler<BuildStatusEnv>;

// Example 2: Step Status Queue
const stepStatusSchema = z.object({
  stepId: z.string(),
  planId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  timestamp: z.string().datetime(),
});

export interface StepStatusEnv {
  STEP_STATUS_QUEUE: Queue<z.infer<typeof stepStatusSchema>>;
}

const stepStatusFetch = createQueueFetch('STEP_STATUS_QUEUE', stepStatusSchema);

export const stepStatusWorker = {
  fetch: stepStatusFetch,
} satisfies ExportedHandler<StepStatusEnv>;

// Example 3: Project Builds Queue
const projectBuildSchema = z.object({
  projectId: z.string(),
  buildConfig: z.object({
    environment: z.enum(['development', 'staging', 'production']),
    branch: z.string(),
    commitHash: z.string(),
  }),
  triggeredBy: z.string(),
  timestamp: z.string().datetime(),
});

export interface ProjectBuildsEnv {
  PROJECT_BUILDS_QUEUE: Queue<z.infer<typeof projectBuildSchema>>;
}

const projectBuildsFetch = createQueueFetch('PROJECT_BUILDS_QUEUE', projectBuildSchema);

export const projectBuildsWorker = {
  fetch: projectBuildsFetch,
} satisfies ExportedHandler<ProjectBuildsEnv>;