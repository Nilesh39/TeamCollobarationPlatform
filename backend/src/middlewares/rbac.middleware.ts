import { Request, Response, NextFunction } from 'express';
import { TenantRole, Permission, ROLE_PERMISSIONS, hasMinimumRole } from '../core/constants/permissions';
import { ForbiddenError } from '../core/errors/AppError';

export function requireRole(allowedRoles: TenantRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.tenantContext?.role;

    if (!userRole || (!allowedRoles.includes(userRole) && userRole !== TenantRole.SUPER_ADMIN)) {
      return next(
        new ForbiddenError(
          `Insufficient role privileges. Required: [${allowedRoles.join(', ')}], Current: ${userRole || 'NONE'}`
        )
      );
    }

    next();
  };
}

export function requireMinRole(minRole: TenantRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.tenantContext?.role;

    if (!userRole || (!hasMinimumRole(userRole, minRole) && userRole !== TenantRole.SUPER_ADMIN)) {
      return next(
        new ForbiddenError(
          `Insufficient role privileges. Minimum required: ${minRole}, Current: ${userRole || 'NONE'}`
        )
      );
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.tenantContext?.role;

    if (!userRole) {
      return next(new ForbiddenError('No active tenant role assigned to session.'));
    }

    if (userRole === TenantRole.SUPER_ADMIN) {
      return next();
    }

    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    if (!rolePerms.includes(permission)) {
      return next(new ForbiddenError(`Missing required permission: ${permission}`));
    }

    next();
  };
}
