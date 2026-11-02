import { z } from 'zod';
import { ProjectStatus, ProjectPriority, MilestoneStatus } from '@prisma/client';

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid('Valid workspace UUID is required'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(120),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Key must be alphanumeric uppercase (e.g. CORE, AI)'),
  description: z.string().max(3000).optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  priority: z.nativeEnum(ProjectPriority).default(ProjectPriority.MEDIUM),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  managerId: z.string().uuid('Valid manager user UUID is required').optional(),
  memberIds: z.array(z.string().uuid()).optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(3000).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.nativeEnum(ProjectPriority).optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  isArchived: z.boolean().optional()
});

export const createMilestoneSchema = z.object({
  title: z.string().min(2, 'Milestone title must be at least 2 characters').max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.nativeEnum(MilestoneStatus).default(MilestoneStatus.OPEN),
  orderIndex: z.number().int().optional()
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  status: z.nativeEnum(MilestoneStatus).optional(),
  orderIndex: z.number().int().optional()
});

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid('Valid user UUID is required'),
  role: z.enum(['MANAGER', 'CONTRIBUTOR', 'VIEWER']).default('CONTRIBUTOR')
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
