import { z } from 'zod';

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid('Valid workspace UUID is required'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(120),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Key must be alphanumeric uppercase (e.g. CORE, AI)'),
  description: z.string().max(1000).optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['ACTIVE', 'PLANNING', 'COMPLETED', 'PAUSED']).optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
