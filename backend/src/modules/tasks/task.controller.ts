import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';
import { QueryTasksInput } from './task.validation';

export class TaskController {
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const query = req.query as unknown as QueryTasksInput;
      const result = await taskService.getTasks(tenantId, query);
      sendSuccess(res, result.tasks, 'Tasks retrieved successfully.', 200, result.pagination);
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
      const actorId = req.user!.userId;
      const task = await taskService.createTask(tenantId, actorId, req.body);
      sendCreated(res, task, 'Task created successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id } = req.params;
      const updated = await taskService.updateTask(tenantId, id, actorId, req.body);
      sendSuccess(res, updated, 'Task updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async moveTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id } = req.params;
      const moved = await taskService.moveTask(tenantId, id, actorId, req.body);
      sendSuccess(res, moved, 'Task position and status updated.');
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id } = req.params;
      const result = await taskService.deleteTask(tenantId, id, actorId);
      sendSuccess(res, result, 'Task deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id } = req.params;
      const comment = await taskService.addComment(tenantId, id, actorId, req.body);
      sendCreated(res, comment, 'Comment added to task.');
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id, commentId } = req.params;
      const result = await taskService.deleteComment(tenantId, id, commentId, actorId);
      sendSuccess(res, result, 'Comment deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  async addLabel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const label = await taskService.addLabel(tenantId, id, req.body);
      sendCreated(res, label, 'Label attached to task.');
    } catch (error) {
      next(error);
    }
  }

  async removeLabel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id, labelId } = req.params;
      const result = await taskService.removeLabel(tenantId, id, labelId);
      sendSuccess(res, result, 'Label removed from task.');
    } catch (error) {
      next(error);
    }
  }

  async addAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id } = req.params;
      const attachment = await taskService.addAttachment(tenantId, id, actorId, req.body);
      sendCreated(res, attachment, 'Attachment added to task.');
    } catch (error) {
      next(error);
    }
  }

  async removeAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id, attachmentId } = req.params;
      const result = await taskService.removeAttachment(tenantId, id, attachmentId);
      sendSuccess(res, result, 'Attachment removed.');
    } catch (error) {
      next(error);
    }
  }

  async createSubtask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id } = req.params;
      const subtask = await taskService.createSubtask(tenantId, id, actorId, req.body);
      sendCreated(res, subtask, 'Subtask created successfully.');
    } catch (error) {
      next(error);
    }
  }

  async addDependency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id } = req.params;
      const dependency = await taskService.addDependency(tenantId, id, actorId, req.body);
      sendCreated(res, dependency, 'Task dependency established.');
    } catch (error) {
      next(error);
    }
  }

  async removeDependency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const { id, dependsOnTaskId } = req.params;
      const result = await taskService.removeDependency(tenantId, id, dependsOnTaskId, actorId);
      sendSuccess(res, result, 'Dependency link removed.');
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
