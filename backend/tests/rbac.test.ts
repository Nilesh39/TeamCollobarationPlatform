import { describe, it, expect } from 'vitest';
import { requireRole, requirePermission } from '../src/middlewares/rbac.middleware';
import { TenantRole, Permission, ROLE_PERMISSIONS } from '../src/core/constants/permissions';
import { ForbiddenError } from '../src/core/errors/AppError';

describe('RBAC Authorization Guard Unit Tests', () => {
  it('should grant OWNER access to all permissions', () => {
    const ownerPerms = ROLE_PERMISSIONS[TenantRole.OWNER];
    const allPerms = Object.values(Permission);
    expect(ownerPerms.length).toBe(allPerms.length);
    expect(ownerPerms).toContain(Permission.TENANT_BILLING);
    expect(ownerPerms).toContain(Permission.AI_AGENT_MANAGE);
  });

  it('should restrict GUEST from creating tasks or managing agents', () => {
    const guestPerms = ROLE_PERMISSIONS[TenantRole.GUEST];
    expect(guestPerms).not.toContain(Permission.TASK_CREATE);
    expect(guestPerms).not.toContain(Permission.AI_AGENT_MANAGE);
    expect(guestPerms).toContain(Permission.RAG_DOCUMENT_QUERY);
  });

  it('requireRole middleware should allow authorized role and call next()', () => {
    const middleware = requireRole([TenantRole.OWNER, TenantRole.ADMIN]);
    const mockReq = {
      tenantContext: {
        role: TenantRole.ADMIN
      }
    } as any;
    let nextCalled = false;
    let errorPassed: any = null;

    middleware(mockReq, {} as any, (err?: any) => {
      nextCalled = true;
      errorPassed = err;
    });

    expect(nextCalled).toBe(true);
    expect(errorPassed).toBeUndefined();
  });

  it('requireRole middleware should pass ForbiddenError when role is insufficient', () => {
    const middleware = requireRole([TenantRole.OWNER]);
    const mockReq = {
      tenantContext: {
        role: TenantRole.MEMBER
      }
    } as any;
    let errorPassed: any = null;

    middleware(mockReq, {} as any, (err?: any) => {
      errorPassed = err;
    });

    expect(errorPassed).toBeInstanceOf(ForbiddenError);
    expect(errorPassed.statusCode).toBe(403);
  });

  it('requirePermission middleware should enforce granular permissions', () => {
    const middleware = requirePermission(Permission.AI_AGENT_MANAGE);
    const mockReq = {
      tenantContext: {
        role: TenantRole.MEMBER // Members do not have AI_AGENT_MANAGE
      }
    } as any;
    let errorPassed: any = null;

    middleware(mockReq, {} as any, (err?: any) => {
      errorPassed = err;
    });

    expect(errorPassed).toBeInstanceOf(ForbiddenError);
  });
});
