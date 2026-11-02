import { prisma } from '../../infrastructure/database/prisma';
import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../../core/errors/AppError';
import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  AddTaskCommentInput,
  AddTaskLabelInput,
  AddTaskAttachmentInput,
  AddTaskDependencyInput,
  CreateSubtaskInput,
  QueryTasksInput
} from './task.validation';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { realTimeBus, RealTimeEvents } from '../../infrastructure/realtime/realtime.emitter';

export class TaskService {
  /**
   * Retrieves tasks with multi-field filtering, sorting, and pagination
   */
  async getTasks(tenantId: string, query: QueryTasksInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    const {
      projectId,
      status,
      priority,
      assigneeId,
      label,
      search,
      sortBy = 'orderIndex',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
      dueFrom,
      dueTo,
      parentOnly
    } = query;

    const skip = (page - 1) * limit;

    // Build where filter
    const where: any = {
      tenantId,
      ...(projectId && { projectId }),
      ...(priority && { priority }),
      ...(parentOnly && { parentTaskId: null })
    };

    // Status filter (support single or comma-separated list e.g. "TODO,IN_PROGRESS")
    if (status) {
      const statuses = status.split(',').map((s) => s.trim().toUpperCase() as TaskStatus);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    // Assignee filter
    if (assigneeId) {
      where.assignees = {
        some: { userId: assigneeId }
      };
    }

    // Label filter
    if (label) {
      where.labels = {
        some: { name: { equals: label, mode: 'insensitive' } }
      };
    }

    // Date range filter
    if (dueFrom || dueTo) {
      where.dueDate = {
        ...(dueFrom && { gte: new Date(dueFrom) }),
        ...(dueTo && { lte: new Date(dueTo) })
      };
    }

    // Search query on title and description
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // Order by construction
    const orderBy: any[] = [];
    if (sortBy === 'orderIndex') {
      orderBy.push({ orderIndex: sortOrder });
      orderBy.push({ createdAt: 'desc' });
    } else {
      orderBy.push({ [sortBy]: sortOrder });
      orderBy.push({ orderIndex: 'asc' });
    }

    const [tasks, total] = await Promise.all([
      tenantPrisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
          labels: {
            select: { id: true, name: true, color: true }
          },
          _count: {
            select: {
              comments: true,
              subtasks: true,
              dependencies: true,
              blockedBy: true,
              attachments: true
            }
          }
        }
      }),
      tenantPrisma.task.count({ where })
    ]);

    return {
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Retrieves single task with complete relationships: comments, subtasks,
   * dependencies, attachments, labels, and activity history
   */
  async getTaskById(tenantId: string, taskId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    const task = await tenantPrisma.task.findFirst({
      where: { id: taskId, tenantId },
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
        labels: {
          select: { id: true, name: true, color: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true }
            }
          }
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: { id: true, fullName: true, email: true }
            }
          }
        },
        subtasks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            assignees: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
              }
            }
          }
        },
        dependencies: {
          include: {
            dependsOnTask: {
              select: {
                id: true,
                taskNumber: true,
                title: true,
                status: true,
                priority: true
              }
            }
          }
        },
        blockedBy: {
          include: {
            task: {
              select: {
                id: true,
                taskNumber: true,
                title: true,
                status: true,
                priority: true
              }
            }
          }
        },
        activities: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: { id: true, fullName: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task not found in this organization.');
    }

    return task;
  }

  /**
   * Creates a new task, assigns members, adds labels, and logs creation
   */
  async createTask(tenantId: string, actorId: string, input: CreateTaskInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    // Verify project exists in tenant
    const project = await tenantPrisma.project.findFirst({
      where: { id: input.projectId, tenantId }
    });

    if (!project) {
      throw new NotFoundError('Target project not found in this organization.');
    }

    // If parentTaskId provided, verify parent exists in same project
    if (input.parentTaskId) {
      const parentTask = await tenantPrisma.task.findFirst({
        where: { id: input.parentTaskId, projectId: input.projectId, tenantId }
      });
      if (!parentTask) {
        throw new NotFoundError('Parent task not found in this project.');
      }
    }

    // Determine orderIndex if not set
    let orderIndex = input.orderIndex;
    if (orderIndex === undefined || orderIndex === 0) {
      const highestOrder = await tenantPrisma.task.findFirst({
        where: { projectId: input.projectId, status: input.status as TaskStatus },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true }
      });
      orderIndex = (highestOrder?.orderIndex ?? 0) + 1000;
    }

    // Determine initial assignees (defaults to creator if empty)
    const initialAssignees =
      input.assigneeIds && input.assigneeIds.length > 0
        ? input.assigneeIds
        : [actorId];

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          tenantId,
          projectId: input.projectId,
          parentTaskId: input.parentTaskId,
          title: input.title.trim(),
          description: input.description,
          status: input.status as TaskStatus,
          priority: input.priority as TaskPriority,
          startDate: input.startDate ? new Date(input.startDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          orderIndex,
          assignees: {
            create: initialAssignees.map((userId) => ({ userId }))
          },
          ...(input.labels && input.labels.length > 0 && {
            labels: {
              create: input.labels.map((l) => ({
                tenantId,
                name: l.name.trim(),
                color: l.color || '#6366f1'
              }))
            }
          })
        }
      });

      // Log task created activity
      await tx.taskActivity.create({
        data: {
          taskId: created.id,
          actorId,
          action: 'TASK_CREATED',
          changes: {
            title: created.title,
            status: created.status,
            priority: created.priority
          }
        }
      });

      return created;
    });

    realTimeBus.broadcast(RealTimeEvents.TASK_CREATED, {
      tenantId,
      projectId: input.projectId,
      taskId: task.id,
      actorId,
      data: task
    });

    // Update project progress
    this.refreshProjectProgress(tenantId, input.projectId).catch(() => {});

    return this.getTaskById(tenantId, task.id);
  }

  /**
   * Updates an existing task with change tracking and audit logging
   */
  async updateTask(tenantId: string, taskId: string, actorId: string, input: UpdateTaskInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    const existing = await this.getTaskById(tenantId, taskId);

    const changes: Record<string, { from: any; to: any }> = {};

    if (input.title !== undefined && input.title.trim() !== existing.title) {
      changes.title = { from: existing.title, to: input.title.trim() };
    }
    if (input.status !== undefined && input.status !== existing.status) {
      changes.status = { from: existing.status, to: input.status };
    }
    if (input.priority !== undefined && input.priority !== existing.priority) {
      changes.priority = { from: existing.priority, to: input.priority };
    }
    if (input.dueDate !== undefined) {
      const newDue = input.dueDate ? new Date(input.dueDate).toISOString() : null;
      const oldDue = existing.dueDate ? existing.dueDate.toISOString() : null;
      if (newDue !== oldDue) {
        changes.dueDate = { from: oldDue, to: newDue };
      }
    }
    if (input.description !== undefined && input.description !== existing.description) {
      changes.description = { from: 'previous_description', to: 'updated_description' };
    }

    const updatePayload: any = {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status as TaskStatus }),
      ...(input.priority !== undefined && { priority: input.priority as TaskPriority }),
      ...(input.orderIndex !== undefined && { orderIndex: input.orderIndex }),
      ...(input.parentTaskId !== undefined && { parentTaskId: input.parentTaskId }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null
      }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null
      })
    };

    await prisma.$transaction(async (tx) => {
      // Reassign members if assigneeIds explicitly provided
      if (input.assigneeIds !== undefined) {
        await tx.taskAssignee.deleteMany({ where: { taskId } });
        if (input.assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: input.assigneeIds.map((userId) => ({ taskId, userId }))
          });
        }
        changes.assignees = {
          from: existing.assignees.map((a) => a.user.id),
          to: input.assigneeIds
        };
      }

      await tx.task.update({
        where: { id: taskId },
        data: updatePayload
      });

      // Record activity if there are tracked changes
      if (Object.keys(changes).length > 0) {
        const action = changes.status
          ? 'STATUS_CHANGED'
          : changes.priority
          ? 'PRIORITY_CHANGED'
          : changes.assignees
          ? 'MEMBERS_REASSIGNED'
          : 'TASK_UPDATED';

        await tx.taskActivity.create({
          data: {
            taskId,
            actorId,
            action,
            changes
          }
        });
      }
    });

    realTimeBus.broadcast(RealTimeEvents.TASK_UPDATED, {
      tenantId,
      projectId: existing.projectId,
      taskId,
      actorId,
      data: { taskId, changes }
    });

    if (changes.status) {
      this.refreshProjectProgress(tenantId, existing.projectId).catch(() => {});
    }

    return this.getTaskById(tenantId, taskId);
  }

  /**
   * Fast movement update for drag and drop operations in Kanban views
   */
  async moveTask(tenantId: string, taskId: string, actorId: string, input: MoveTaskInput) {
    const existing = await this.getTaskById(tenantId, taskId);

    const isStatusChanged = existing.status !== input.status;

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: input.status as TaskStatus,
          orderIndex: input.orderIndex
        }
      });

      if (isStatusChanged) {
        await tx.taskActivity.create({
          data: {
            taskId,
            actorId,
            action: 'STATUS_CHANGED',
            changes: {
              status: { from: existing.status, to: input.status }
            }
          }
        });
      }
    });

    realTimeBus.broadcast(RealTimeEvents.TASK_MOVED, {
      tenantId,
      projectId: existing.projectId,
      taskId,
      actorId,
      data: { taskId, status: input.status, orderIndex: input.orderIndex }
    });

    if (isStatusChanged) {
      this.refreshProjectProgress(tenantId, existing.projectId).catch(() => {});
    }

    return { id: taskId, status: input.status, orderIndex: input.orderIndex };
  }

  /**
   * Deletes task and dependent artifacts with cascade
   */
  async deleteTask(tenantId: string, taskId: string, actorId: string) {
    const existing = await this.getTaskById(tenantId, taskId);

    await prisma.task.delete({
      where: { id: taskId }
    });

    realTimeBus.broadcast(RealTimeEvents.TASK_DELETED, {
      tenantId,
      projectId: existing.projectId,
      taskId,
      actorId,
      data: { taskId, deleted: true }
    });

    this.refreshProjectProgress(tenantId, existing.projectId).catch(() => {});

    return { id: taskId, deleted: true };
  }

  /**
   * Adds comment and records activity
   */
  async addComment(tenantId: string, taskId: string, userId: string, input: AddTaskCommentInput) {
    const existing = await this.getTaskById(tenantId, taskId);

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.taskComment.create({
        data: {
          taskId,
          userId,
          content: input.content.trim()
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, avatarUrl: true }
          }
        }
      });

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId: userId,
          action: 'COMMENT_ADDED',
          changes: { commentId: created.id }
        }
      });

      return created;
    });

    realTimeBus.broadcast(RealTimeEvents.TASK_COMMENT_ADDED, {
      tenantId,
      projectId: existing.projectId,
      taskId,
      actorId: userId,
      data: comment
    });

    return comment;
  }

  /**
   * Deletes comment
   */
  async deleteComment(tenantId: string, taskId: string, commentId: string, userId: string) {
    await this.getTaskById(tenantId, taskId);

    const comment = await prisma.taskComment.findFirst({
      where: { id: commentId, taskId }
    });

    if (!comment) {
      throw new NotFoundError('Comment not found.');
    }

    await prisma.taskComment.delete({
      where: { id: commentId }
    });

    return { id: commentId, deleted: true };
  }

  /**
   * Adds label to task
   */
  async addLabel(tenantId: string, taskId: string, input: AddTaskLabelInput) {
    await this.getTaskById(tenantId, taskId);

    const existingLabel = await prisma.taskLabel.findFirst({
      where: { taskId, name: { equals: input.name.trim(), mode: 'insensitive' } }
    });

    if (existingLabel) {
      return existingLabel;
    }

    return prisma.taskLabel.create({
      data: {
        tenantId,
        taskId,
        name: input.name.trim(),
        color: input.color || '#6366f1'
      }
    });
  }

  /**
   * Removes label from task
   */
  async removeLabel(tenantId: string, taskId: string, labelId: string) {
    await this.getTaskById(tenantId, taskId);

    await prisma.taskLabel.deleteMany({
      where: { id: labelId, taskId }
    });

    return { id: labelId, deleted: true };
  }

  /**
   * Adds an attachment to a task
   */
  async addAttachment(tenantId: string, taskId: string, uploaderId: string, input: AddTaskAttachmentInput) {
    await this.getTaskById(tenantId, taskId);

    const attachment = await prisma.$transaction(async (tx) => {
      const created = await tx.taskAttachment.create({
        data: {
          tenantId,
          taskId,
          name: input.name,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize || 0,
          mimeType: input.mimeType || 'application/octet-stream',
          uploaderId
        },
        include: {
          uploader: {
            select: { id: true, fullName: true, email: true }
          }
        }
      });

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId: uploaderId,
          action: 'ATTACHMENT_ADDED',
          changes: { attachmentName: input.name }
        }
      });

      return created;
    });

    return attachment;
  }

  /**
   * Removes an attachment
   */
  async removeAttachment(tenantId: string, taskId: string, attachmentId: string) {
    await this.getTaskById(tenantId, taskId);

    await prisma.taskAttachment.deleteMany({
      where: { id: attachmentId, taskId }
    });

    return { id: attachmentId, deleted: true };
  }

  /**
   * Creates a subtask under a parent task
   */
  async createSubtask(tenantId: string, parentTaskId: string, actorId: string, input: CreateSubtaskInput) {
    const parentTask = await this.getTaskById(tenantId, parentTaskId);

    return this.createTask(tenantId, actorId, {
      projectId: parentTask.projectId,
      parentTaskId: parentTask.id,
      title: input.title,
      status: 'TODO',
      orderIndex: 0,
      priority: input.priority,
      dueDate: input.dueDate,
      assigneeIds: input.assigneeIds
    });
  }

  /**
   * Adds dependency with rigorous cycle detection
   * Ensures task cannot depend on itself or create circular dependency chains (DAG validation)
   */
  async addDependency(tenantId: string, taskId: string, actorId: string, input: AddTaskDependencyInput) {
    const { dependsOnTaskId, type = 'BLOCKS' } = input;

    // 1. Self dependency check
    if (taskId === dependsOnTaskId) {
      throw new BadRequestError('Invalid dependency: A task cannot depend on itself.');
    }

    // 2. Verify both tasks exist and belong to the same tenant
    const [task, prerequisite] = await Promise.all([
      this.getTaskById(tenantId, taskId),
      this.getTaskById(tenantId, dependsOnTaskId)
    ]);

    // 3. Cycle Detection Algorithm
    // If taskId depends on dependsOnTaskId, verify dependsOnTaskId does NOT already depend on taskId
    const hasCycle = await this.detectDependencyCycle(taskId, dependsOnTaskId);
    if (hasCycle) {
      throw new BadRequestError(
        'Circular dependency detected: Task cannot depend on a task that directly or indirectly depends on it.'
      );
    }

    // 4. Check for duplicate dependency
    const existing = await prisma.taskDependency.findFirst({
      where: { taskId, dependsOnTaskId }
    });

    if (existing) {
      return existing;
    }

    // 5. Create dependency record & log activity
    const dependency = await prisma.$transaction(async (tx) => {
      const created = await tx.taskDependency.create({
        data: {
          tenantId,
          taskId,
          dependsOnTaskId,
          type
        },
        include: {
          dependsOnTask: {
            select: { id: true, taskNumber: true, title: true, status: true, priority: true }
          }
        }
      });

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId,
          action: 'DEPENDENCY_ADDED',
          changes: {
            dependsOnTaskId,
            prerequisiteTitle: prerequisite.title
          }
        }
      });

      return created;
    });

    realTimeBus.broadcast(RealTimeEvents.TASK_DEPENDENCY_UPDATED, {
      tenantId,
      projectId: task.projectId,
      taskId,
      actorId,
      data: dependency
    });

    return dependency;
  }

  /**
   * Removes a task dependency
   */
  async removeDependency(tenantId: string, taskId: string, dependsOnTaskId: string, actorId: string) {
    await this.getTaskById(tenantId, taskId);

    await prisma.$transaction(async (tx) => {
      await tx.taskDependency.deleteMany({
        where: { taskId, dependsOnTaskId }
      });

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId,
          action: 'DEPENDENCY_REMOVED',
          changes: { dependsOnTaskId }
        }
      });
    });

    return { taskId, dependsOnTaskId, removed: true };
  }

  /**
   * Breadth-first graph cycle detector for task dependencies
   * Returns true if a path exists from targetId back to sourceId
   */
  async detectDependencyCycle(sourceId: string, targetId: string): Promise<boolean> {
    if (sourceId === targetId) return true;

    const visited = new Set<string>();
    const queue: string[] = [targetId];
    visited.add(targetId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === sourceId) {
        return true; // Cycle discovered!
      }

      // Query all tasks that `current` depends on
      const directDependencies = await prisma.taskDependency.findMany({
        where: { taskId: current },
        select: { dependsOnTaskId: true }
      });

      for (const dep of directDependencies) {
        if (!visited.has(dep.dependsOnTaskId)) {
          visited.add(dep.dependsOnTaskId);
          queue.push(dep.dependsOnTaskId);
        }
      }
    }

    return false;
  }

  /**
   * Recalculates and updates project progress based on completed tasks
   */
  private async refreshProjectProgress(tenantId: string, projectId: string): Promise<void> {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    const tasks = await tenantPrisma.task.findMany({
      where: { projectId, parentTaskId: null },
      select: { status: true }
    });

    if (tasks.length === 0) return;

    const doneCount = tasks.filter(
      (t) => t.status === TaskStatus.DONE || (t.status as string) === 'COMPLETED'
    ).length;

    const progress = Math.round((doneCount / tasks.length) * 100);

    await prisma.project.update({
      where: { id: projectId },
      data: { progress }
    }).catch(() => {});
  }
}

export const taskService = new TaskService();
