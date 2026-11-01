import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

export class ProjectController {
  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const workspaceId = req.query.workspaceId as string | undefined;
      const projects = await projectService.getProjects(tenantId, workspaceId);
      sendSuccess(res, projects, 'Projects retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const project = await projectService.getProjectById(tenantId, id);
      sendSuccess(res, project, 'Project details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const project = await projectService.createProject(tenantId, req.body);
      sendCreated(res, project, 'Project provisioned successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const updated = await projectService.updateProject(tenantId, id, req.body);
      sendSuccess(res, updated, 'Project updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const result = await projectService.deleteProject(tenantId, id);
      sendSuccess(res, result, 'Project deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
