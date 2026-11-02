import { z } from 'zod';

export const TaskStatusEnum = z.enum([
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'COMPLETED',
  'BLOCKED',
  'BACKLOG',
  'DONE',
  'CANCELED'
]);

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Valid project UUID is required'),
  parentTaskId: z.string().uuid().optional(),
  title: z.string().min(2, 'Task title must be at least 2 characters').max(255),
  description: z.string().max(10000).optional(),
  status: TaskStatusEnum.default('TODO'),
  priority: TaskPriorityEnum.default('MEDIUM'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  orderIndex: z.number().default(0.0),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labels: z.array(
    z.object({
      name: z.string().min(1).max(50),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1')
    })
  ).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(10000).nullable().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  orderIndex: z.number().optional(),
  parentTaskId: z.string().uuid().nullable().optional(),
  assigneeIds: z.array(z.string().uuid()).optional()
});

export const moveTaskSchema = z.object({
  status: TaskStatusEnum,
  orderIndex: z.number()
});

export const addTaskCommentSchema = z.object({
  content: z.string().min(1, 'Comment text cannot be empty').max(5000)
});

export const addTaskLabelSchema = z.object({
  name: z.string().min(1, 'Label name cannot be empty').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code (e.g. #6366f1)').default('#6366f1')
});

export const addTaskAttachmentSchema = z.object({
  name: z.string().min(1, 'Attachment name is required').max(255),
  fileUrl: z.string().min(1, 'File URL or path is required').max(1000),
  fileSize: z.number().int().nonnegative().default(0),
  mimeType: z.string().max(100).default('application/octet-stream')
});

export const addTaskDependencySchema = z.object({
  dependsOnTaskId: z.string().uuid('Prerequisite task UUID is required'),
  type: z.enum(['BLOCKS', 'RELATES_TO']).default('BLOCKS')
});

export const createSubtaskSchema = z.object({
  title: z.string().min(2, 'Subtask title must be at least 2 characters').max(255),
  priority: TaskPriorityEnum.default('MEDIUM'),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  assigneeIds: z.array(z.string().uuid()).optional()
});

export const queryTasksSchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: TaskPriorityEnum.optional(),
  assigneeId: z.string().uuid().optional(),
  label: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'title', 'orderIndex', 'createdAt']).default('orderIndex'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  parentOnly: z.coerce.boolean().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type AddTaskCommentInput = z.infer<typeof addTaskCommentSchema>;
export type AddTaskLabelInput = z.infer<typeof addTaskLabelSchema>;
export type AddTaskAttachmentInput = z.infer<typeof addTaskAttachmentSchema>;
export type AddTaskDependencyInput = z.infer<typeof addTaskDependencySchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type QueryTasksInput = z.infer<typeof queryTasksSchema>;
