import { TenantRole } from '../constants/permissions';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        tenantId?: string;
        role?: TenantRole;
        isSuperAdmin?: boolean;
      };
      tenantContext?: {
        tenantId: string;
        role: TenantRole;
        membershipId: string;
      };
    }
  }
}

export {};
