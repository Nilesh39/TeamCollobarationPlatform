import { Request, Response, NextFunction } from 'express';
import { tenantService } from './tenant.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

export class TenantController {
  async getMyTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenants = await tenantService.getUserTenants(req.user!.userId);
      sendSuccess(res, tenants, 'Tenants retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getTenantDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.getTenantDetails(req.tenantContext!.tenantId);
      sendSuccess(res, tenant, 'Tenant details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      const result = await tenantService.createTenant(req.user!.userId, name);
      sendCreated(res, result, 'Tenant created successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const tenantController = new TenantController();
