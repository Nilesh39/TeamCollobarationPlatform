import { Request, Response, NextFunction } from 'express';
import { workspaceService } from './workspace.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

export class WorkspaceController {
  async getWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const workspaces = await workspaceService.getWorkspaces(tenantId);
      sendSuccess(res, workspaces, 'Workspaces retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const workspace = await workspaceService.getWorkspaceById(tenantId, id);
      sendSuccess(res, workspace, 'Workspace details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const userId = req.user!.userId;
      const workspace = await workspaceService.createWorkspace(tenantId, userId, req.body);
      sendCreated(res, workspace, 'Workspace provisioned successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const updated = await workspaceService.updateWorkspace(tenantId, id, req.body);
      sendSuccess(res, updated, 'Workspace updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const result = await workspaceService.deleteWorkspace(tenantId, id);
      sendSuccess(res, result, 'Workspace deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const workspaceController = new WorkspaceController();
