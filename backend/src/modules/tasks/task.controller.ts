import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class TaskController {
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { projectId, status, priority, search } = req.query;

      const tasks = await taskService.getTasks(tenantId, {
        projectId: projectId as string,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        search: search as string
      });

      sendSuccess(res, tasks, 'Tasks retrieved successfully.', 200, {
        total: tasks.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const task = await taskService.getTaskById(tenantId, id);
      sendSuccess(res, task, 'Task details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const userId = req.user!.userId;
      const task = await taskService.createTask(tenantId, userId, req.body);
      sendCreated(res, task, 'Task created successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const updated = await taskService.updateTask(tenantId, id, req.body);
      sendSuccess(res, updated, 'Task updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const result = await taskService.deleteTask(tenantId, id);
      sendSuccess(res, result, 'Task deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const userId = req.user!.userId;
      const { id } = req.params;
      const comment = await taskService.addComment(tenantId, id, userId, req.body);
      sendCreated(res, comment, 'Comment added to task.');
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
