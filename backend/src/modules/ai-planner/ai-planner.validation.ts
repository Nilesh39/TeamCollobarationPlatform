import { z } from 'zod';
import { ProjectPriority, TaskPriority } from '@prisma/client';

export const generatePlanSchema = z.object({
  prompt: z
    .string()
    .min(5, 'Project prompt must be at least 5 characters long.')
    .max(3000, 'Project prompt cannot exceed 3000 characters.'),
  workspaceId: z.string().uuid('A valid workspace ID is required.'),
  targetDays: z.number().int().positive().max(365).optional().default(30),
  model: z.string().optional().default('gemini-1.5-flash'),
  apiKey: z.string().optional()
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

// Subtask item in structured plan
export const structuredSubtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(2),
  estimatedHours: z.number().nonnegative().default(2)
});

// Task item in structured plan
export const structuredTaskSchema = z.object({
  id: z.string(),
  phaseId: z.string(),
  milestoneId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().default(''),
  suggestedPriority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  estimatedHours: z.number().nonnegative().default(4),
  assignedRole: z.string().default('Software Engineer'),
  labels: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]), // Prerequisite task IDs
  subtasks: z.array(structuredSubtaskSchema).default([])
});

// Phase definition
export const structuredPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderIndex: z.number().int().nonnegative(),
  durationDays: z.number().positive(),
  goals: z.array(z.string()).default([])
});

// Milestone definition
export const structuredMilestoneSchema = z.object({
  id: z.string(),
  phaseId: z.string(),
  title: z.string().min(2),
  description: z.string().default(''),
  targetDay: z.number().int().positive(),
  deliverables: z.array(z.string()).default([])
});

// Dependency relation
export const structuredDependencySchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string(),
  dependencyType: z.enum(['FINISH_TO_START', 'START_TO_START']).default('FINISH_TO_START')
});

// Recommended Team Role
export const structuredTeamRoleSchema = z.object({
  role: z.string(),
  count: z.number().int().positive().default(1),
  responsibilities: z.array(z.string()).default([])
});

// Potential Risk
export const structuredRiskSchema = z.object({
  category: z.enum(['TECHNICAL', 'TIMELINE', 'SECURITY', 'RESOURCE']),
  risk: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  mitigation: z.string()
});

// Project Overview
export const structuredOverviewSchema = z.object({
  name: z.string().min(2).max(120),
  key: z.string().regex(/^[A-Z0-9]{2,6}$/, 'Project key must be 2-6 uppercase alphanumeric chars'),
  description: z.string(),
  targetAudience: z.string().default('General Users'),
  techStack: z.array(z.string()).default([]),
  estimatedTotalDays: z.number().int().positive().default(30),
  suggestedBudgetTier: z.enum(['LOW', 'MEDIUM', 'HIGH', 'ENTERPRISE']).default('MEDIUM')
});

// Complete structured project plan
export const structuredProjectPlanSchema = z.object({
  projectOverview: structuredOverviewSchema,
  phases: z.array(structuredPhaseSchema).min(1),
  milestones: z.array(structuredMilestoneSchema).min(1),
  tasks: z.array(structuredTaskSchema).min(1),
  dependencies: z.array(structuredDependencySchema).default([]),
  teamRoles: z.array(structuredTeamRoleSchema).min(1),
  risks: z.array(structuredRiskSchema).default([])
});

export type StructuredProjectPlan = z.infer<typeof structuredProjectPlanSchema>;

// Input schema for approving a plan and committing it to PostgreSQL
export const approvePlanSchema = z.object({
  workspaceId: z.string().uuid('Valid workspace ID is required.'),
  jobId: z.string().optional(),
  approvedPlan: z.object({
    project: z.object({
      name: z.string().min(2).max(120),
      key: z.string().regex(/^[A-Z0-9]{2,6}$/),
      description: z.string().optional(),
      priority: z.nativeEnum(ProjectPriority).default(ProjectPriority.MEDIUM),
      startDate: z.string().optional(),
      dueDate: z.string().optional()
    }),
    milestones: z.array(
      z.object({
        tempId: z.string(),
        title: z.string().min(2),
        description: z.string().optional(),
        dueDate: z.string().optional()
      })
    ),
    tasks: z.array(
      z.object({
        tempId: z.string(),
        milestoneTempId: z.string().optional(),
        title: z.string().min(2),
        description: z.string().optional(),
        priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
        estimatedHours: z.number().optional(),
        labels: z.array(z.string()).optional(),
        dependencies: z.array(z.string()).optional(), // tempIds of prerequisite tasks
        subtasks: z
          .array(
            z.object({
              title: z.string().min(2)
            })
          )
          .optional()
      })
    )
  })
});

export type ApprovePlanInput = z.infer<typeof approvePlanSchema>;
