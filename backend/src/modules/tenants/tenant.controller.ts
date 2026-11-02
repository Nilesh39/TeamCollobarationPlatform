import { Request, Response, NextFunction } from 'express';
import { tenantService } from './tenant.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

export class TenantController {
  async getMyTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenants = await tenantService.getUserTenants(req.user!.userId);
      sendSuccess(res, tenants, 'Organizations retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getTenantDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.getTenantDetails(req.tenantContext!.tenantId);
      sendSuccess(res, tenant, 'Organization details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      const result = await tenantService.createTenant(req.user!.userId, name);
      sendCreated(res, result, 'Organization created successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tenantService.updateTenant(req.tenantContext!.tenantId, req.body);
      sendSuccess(res, result, 'Organization updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await tenantService.getMembers(req.tenantContext!.tenantId);
      sendSuccess(res, members, 'Organization members retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tenantService.inviteMember(
        req.tenantContext!.tenantId,
        req.user!.userId,
        req.body
      );
      sendCreated(res, result, 'Member invited successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invites = await tenantService.getInvitations(req.tenantContext!.tenantId);
      sendSuccess(res, invites, 'Pending invitations retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const result = await tenantService.acceptInvitation(req.user!.userId, token);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const result = await tenantService.removeMember(
        req.tenantContext!.tenantId,
        memberId,
        req.user!.userId
      );
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const result = await tenantService.updateMemberRole(
        req.tenantContext!.tenantId,
        memberId,
        req.body,
        req.user!.userId
      );
      sendSuccess(res, result, 'Member role updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await tenantService.getSettings(req.tenantContext!.tenantId);
      sendSuccess(res, settings, 'Organization settings retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tenantService.updateSettings(req.tenantContext!.tenantId, req.body);
      sendSuccess(res, result, 'Organization settings updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const tenantController = new TenantController();
