import { z } from 'zod';

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Valid project UUID is required'),
  parentTaskId: z.string().uuid().optional(),
  title: z.string().min(2, 'Task title must be at least 2 characters').max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  orderIndex: z.number().default(0.0),
  assigneeIds: z.array(z.string().uuid()).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  orderIndex: z.number().optional(),
  assigneeIds: z.array(z.string().uuid()).optional()
});

export const addTaskCommentSchema = z.object({
  content: z.string().min(1, 'Comment text cannot be empty').max(3000)
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AddTaskCommentInput = z.infer<typeof addTaskCommentSchema>;
