import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';
import { ProjectStatus, ProjectPriority } from '@prisma/client';

export class ProjectController {
  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId, status, priority, search, includeArchived } = req.query;

      const projects = await projectService.getProjects(req.tenantContext!.tenantId, {
        workspaceId: workspaceId as string | undefined,
        status: status as ProjectStatus | undefined,
        priority: priority as ProjectPriority | undefined,
        search: search as string | undefined,
        includeArchived: includeArchived === 'true'
      });

      sendSuccess(res, projects, 'Projects retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.getProjectById(req.tenantContext!.tenantId, req.params.id);
      sendSuccess(res, project, 'Project details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.createProject(
        req.tenantContext!.tenantId,
        req.user!.userId,
        req.body
      );
      sendCreated(res, project, 'Project created successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.updateProject(
        req.tenantContext!.tenantId,
        req.params.id,
        req.user!.userId,
        req.body
      );
      sendSuccess(res, project, 'Project updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async archiveProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const archive = req.body?.archive !== false; // default true
      const project = await projectService.archiveProject(
        req.tenantContext!.tenantId,
        req.params.id,
        req.user!.userId,
        archive
      );
      sendSuccess(res, project, archive ? 'Project archived successfully.' : 'Project unarchived successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectService.deleteProject(
        req.tenantContext!.tenantId,
        req.params.id,
        req.user!.userId,
        req.tenantContext!.role
      );
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectService.addMember(
        req.tenantContext!.tenantId,
        req.params.id,
        req.user!.userId,
        req.body
      );
      sendCreated(res, result, 'Member assigned to project.');
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectService.removeMember(
        req.tenantContext!.tenantId,
        req.params.id,
        req.user!.userId,
        req.params.memberUserId
      );
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectService.createMilestone(
        req.tenantContext!.tenantId,
        req.params.id,
        req.user!.userId,
        req.body
      );
      sendCreated(res, result, 'Milestone created successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectService.updateMilestone(
        req.tenantContext!.tenantId,
        req.params.id,
        req.params.milestoneId,
        req.user!.userId,
        req.body
      );
      sendSuccess(res, result, 'Milestone updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectService.deleteMilestone(
        req.tenantContext!.tenantId,
        req.params.id,
        req.params.milestoneId,
        req.user!.userId
      );
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activities = await projectService.getProjectActivities(
        req.tenantContext!.tenantId,
        req.params.id
      );
      sendSuccess(res, activities, 'Project activity history retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
