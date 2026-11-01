import { TenantRole } from '../constants/permissions';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
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
