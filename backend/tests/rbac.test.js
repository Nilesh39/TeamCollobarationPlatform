"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rbac_middleware_1 = require("../src/middlewares/rbac.middleware");
const permissions_1 = require("../src/core/constants/permissions");
const AppError_1 = require("../src/core/errors/AppError");
(0, vitest_1.describe)('RBAC Authorization Guard Unit Tests', () => {
    (0, vitest_1.it)('should grant OWNER access to all permissions', () => {
        const ownerPerms = permissions_1.ROLE_PERMISSIONS[permissions_1.TenantRole.OWNER];
        const allPerms = Object.values(permissions_1.Permission);
        (0, vitest_1.expect)(ownerPerms.length).toBe(allPerms.length);
        (0, vitest_1.expect)(ownerPerms).toContain(permissions_1.Permission.TENANT_BILLING);
        (0, vitest_1.expect)(ownerPerms).toContain(permissions_1.Permission.AI_AGENT_MANAGE);
    });
    (0, vitest_1.it)('should restrict GUEST from creating tasks or managing agents', () => {
        const guestPerms = permissions_1.ROLE_PERMISSIONS[permissions_1.TenantRole.GUEST];
        (0, vitest_1.expect)(guestPerms).not.toContain(permissions_1.Permission.TASK_CREATE);
        (0, vitest_1.expect)(guestPerms).not.toContain(permissions_1.Permission.AI_AGENT_MANAGE);
        (0, vitest_1.expect)(guestPerms).toContain(permissions_1.Permission.RAG_DOCUMENT_QUERY);
    });
    (0, vitest_1.it)('requireRole middleware should allow authorized role and call next()', () => {
        const middleware = (0, rbac_middleware_1.requireRole)([permissions_1.TenantRole.OWNER, permissions_1.TenantRole.ADMIN]);
        const mockReq = {
            tenantContext: {
                role: permissions_1.TenantRole.ADMIN
            }
        };
        let nextCalled = false;
        let errorPassed = null;
        middleware(mockReq, {}, (err) => {
            nextCalled = true;
            errorPassed = err;
        });
        (0, vitest_1.expect)(nextCalled).toBe(true);
        (0, vitest_1.expect)(errorPassed).toBeUndefined();
    });
    (0, vitest_1.it)('requireRole middleware should pass ForbiddenError when role is insufficient', () => {
        const middleware = (0, rbac_middleware_1.requireRole)([permissions_1.TenantRole.OWNER]);
        const mockReq = {
            tenantContext: {
                role: permissions_1.TenantRole.MEMBER
            }
        };
        let errorPassed = null;
        middleware(mockReq, {}, (err) => {
            errorPassed = err;
        });
        (0, vitest_1.expect)(errorPassed).toBeInstanceOf(AppError_1.ForbiddenError);
        (0, vitest_1.expect)(errorPassed.statusCode).toBe(403);
    });
    (0, vitest_1.it)('requirePermission middleware should enforce granular permissions', () => {
        const middleware = (0, rbac_middleware_1.requirePermission)(permissions_1.Permission.AI_AGENT_MANAGE);
        const mockReq = {
            tenantContext: {
                role: permissions_1.TenantRole.MEMBER // Members do not have AI_AGENT_MANAGE
            }
        };
        let errorPassed = null;
        middleware(mockReq, {}, (err) => {
            errorPassed = err;
        });
        (0, vitest_1.expect)(errorPassed).toBeInstanceOf(AppError_1.ForbiddenError);
    });
});
//# sourceMappingURL=rbac.test.js.map