import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { NotFoundError } from '../../core/errors/AppError';
import { CreateTaskInput, UpdateTaskInput, AddTaskCommentInput } from './task.validation';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class TaskService {
  async getTasks(
    tenantId: string,
    filters: {
      projectId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      search?: string;
    }
  ) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    return tenantPrisma.task.findMany({
      where: {
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && {
          title: { contains: filters.search, mode: 'insensitive' }
        })
      },
      orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'desc' }],
      include: {
        project: {
          select: { id: true, name: true, key: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true }
            }
          }
        },
        _count: {
          select: { comments: true, subtasks: true }
        }
      }
    });
  }

  async getTaskById(tenantId: string, taskId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    const task = await tenantPrisma.task.findFirst({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, name: true, key: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true }
            }
          }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true }
            }
          }
        },
        subtasks: {
          select: { id: true, title: true, status: true, priority: true }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task not found or unauthorized.');
    }

    return task;
  }

  async createTask(tenantId: string, userId: string, input: CreateTaskInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    // Verify project belongs to tenant
    const project = await tenantPrisma.project.findFirst({
      where: { id: input.projectId }
    });

    if (!project) {
      throw new NotFoundError('Target project not found in this organization.');
    }

    const task = await tenantPrisma.task.create({
      data: {
        tenantId,
        projectId: input.projectId,
        parentTaskId: input.parentTaskId,
        title: input.title,
        description: input.description,
        status: input.status as TaskStatus,
        priority: input.priority as TaskPriority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        orderIndex: input.orderIndex || 0.0,
        assignees: {
          create: (input.assigneeIds || [userId]).map((uid) => ({
            userId: uid
          }))
        }
      },
      include: {
        project: {
          select: { id: true, name: true, key: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          }
        }
      }
    });

    return task;
  }

  async updateTask(tenantId: string, taskId: string, input: UpdateTaskInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getTaskById(tenantId, taskId);

    const data: any = {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status && { status: input.status as TaskStatus }),
      ...(input.priority && { priority: input.priority as TaskPriority }),
      ...(input.orderIndex !== undefined && { orderIndex: input.orderIndex }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null
      })
    };

    if (input.assigneeIds) {
      // Re-assign assignees
      await tenantPrisma.taskAssignee.deleteMany({
        where: { taskId }
      });
      data.assignees = {
        create: input.assigneeIds.map((uid) => ({ userId: uid }))
      };
    }

    return tenantPrisma.task.update({
      where: { id: taskId },
      data,
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignees: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        }
      }
    });
  }

  async deleteTask(tenantId: string, taskId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getTaskById(tenantId, taskId);

    await tenantPrisma.task.delete({
      where: { id: taskId }
    });

    return { id: taskId, deleted: true };
  }

  async addComment(tenantId: string, taskId: string, userId: string, input: AddTaskCommentInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getTaskById(tenantId, taskId);

    return tenantPrisma.taskComment.create({
      data: {
        taskId,
        userId,
        content: input.content
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        }
      }
    });
  }
}

export const taskService = new TaskService();
