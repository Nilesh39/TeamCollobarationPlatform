import { Request, Response, NextFunction } from 'express';
import { prisma } from '../infrastructure/database/prisma';
import { ForbiddenError, BadRequestError } from '../core/errors/AppError';
import { TenantRole } from '../core/constants/permissions';

export function requireTenantContext() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new ForbiddenError('User context required for tenant resolution.');
      }

      const tenantId = (req.headers['x-tenant-id'] as string) || req.params.tenantId;

      if (!tenantId) {
        throw new BadRequestError('Tenant identifier is required via X-Tenant-ID header or route parameter.');
      }

      // Query membership from database
      const membership = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: req.user.userId
          }
        }
      });

      if (!membership || membership.status !== 'ACTIVE') {
        throw new ForbiddenError('You do not have access to this organization or tenant.');
      }

      req.tenantContext = {
        tenantId,
        role: membership.role as TenantRole,
        membershipId: membership.id
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
