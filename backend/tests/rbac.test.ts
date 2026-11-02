import { describe, it, expect } from 'vitest';
import { requireRole, requireMinRole, requirePermission } from '../src/middlewares/rbac.middleware';
import { TenantRole, Permission, ROLE_PERMISSIONS, hasMinimumRole, ROLE_HIERARCHY } from '../src/core/constants/permissions';
import { ForbiddenError } from '../src/core/errors/AppError';

describe('RBAC Authorization Guard & Role Hierarchy Unit Tests', () => {
  describe('Role Hierarchy & Permissions Mapping', () => {
    it('should assign correct hierarchy levels across all 5 primary roles', () => {
      expect(ROLE_HIERARCHY[TenantRole.SUPER_ADMIN]).toBeGreaterThan(ROLE_HIERARCHY[TenantRole.OWNER]);
      expect(ROLE_HIERARCHY[TenantRole.OWNER]).toBeGreaterThan(ROLE_HIERARCHY[TenantRole.ADMIN]);
      expect(ROLE_HIERARCHY[TenantRole.ADMIN]).toBeGreaterThan(ROLE_HIERARCHY[TenantRole.PROJECT_MANAGER]);
      expect(ROLE_HIERARCHY[TenantRole.PROJECT_MANAGER]).toBeGreaterThan(ROLE_HIERARCHY[TenantRole.MEMBER]);
      expect(ROLE_HIERARCHY[TenantRole.MEMBER]).toBeGreaterThan(ROLE_HIERARCHY[TenantRole.GUEST]);
    });

    it('hasMinimumRole should accurately evaluate relative role privileges', () => {
      expect(hasMinimumRole(TenantRole.SUPER_ADMIN, TenantRole.OWNER)).toBe(true);
      expect(hasMinimumRole(TenantRole.OWNER, TenantRole.ADMIN)).toBe(true);
      expect(hasMinimumRole(TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)).toBe(true);
      expect(hasMinimumRole(TenantRole.PROJECT_MANAGER, TenantRole.MEMBER)).toBe(true);

      // Lower role checking higher required role
      expect(hasMinimumRole(TenantRole.MEMBER, TenantRole.PROJECT_MANAGER)).toBe(false);
      expect(hasMinimumRole(TenantRole.PROJECT_MANAGER, TenantRole.ADMIN)).toBe(false);
      expect(hasMinimumRole(TenantRole.ADMIN, TenantRole.OWNER)).toBe(false);
    });

    it('should grant SUPER_ADMIN and OWNER access to all permissions', () => {
      const superAdminPerms = ROLE_PERMISSIONS[TenantRole.SUPER_ADMIN];
      const ownerPerms = ROLE_PERMISSIONS[TenantRole.OWNER];
      const allPerms = Object.values(Permission);

      expect(superAdminPerms.length).toBe(allPerms.length);
      expect(ownerPerms.length).toBe(allPerms.length);
    });

    it('should grant PROJECT_MANAGER task and project creation, but restrict organization billing', () => {
      const pmPerms = ROLE_PERMISSIONS[TenantRole.PROJECT_MANAGER];
      expect(pmPerms).toContain(Permission.PROJECT_CREATE);
      expect(pmPerms).toContain(Permission.TASK_CREATE);
      expect(pmPerms).toContain(Permission.TASK_DELETE);
      expect(pmPerms).not.toContain(Permission.TENANT_BILLING);
      expect(pmPerms).not.toContain(Permission.TENANT_DELETE);
    });
  });

  describe('Middleware Execution & Guards', () => {
    it('requireMinRole should permit user with equal or higher role hierarchy', () => {
      const middleware = requireMinRole(TenantRole.ADMIN);
      const mockReq = {
        tenantContext: { role: TenantRole.OWNER }
      } as any;
      let nextCalled = false;

      middleware(mockReq, {} as any, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it('requireMinRole should reject user with lower role hierarchy', () => {
      const middleware = requireMinRole(TenantRole.ADMIN);
      const mockReq = {
        tenantContext: { role: TenantRole.PROJECT_MANAGER }
      } as any;
      let errorPassed: any = null;

      middleware(mockReq, {} as any, (err?: any) => {
        errorPassed = err;
      });

      expect(errorPassed).toBeInstanceOf(ForbiddenError);
      expect(errorPassed.statusCode).toBe(403);
    });

    it('requireRole should always permit SUPER_ADMIN regardless of whitelist', () => {
      const middleware = requireRole([TenantRole.ADMIN]);
      const mockReq = {
        tenantContext: { role: TenantRole.SUPER_ADMIN }
      } as any;
      let nextCalled = false;

      middleware(mockReq, {} as any, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it('requirePermission should allow SUPER_ADMIN even without explicit whitelist array', () => {
      const middleware = requirePermission(Permission.TENANT_DELETE);
      const mockReq = {
        tenantContext: { role: TenantRole.SUPER_ADMIN }
      } as any;
      let nextCalled = false;

      middleware(mockReq, {} as any, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });
  });
});
