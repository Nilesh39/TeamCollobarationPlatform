"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const tenant_prisma_1 = require("../src/infrastructure/database/tenant-prisma");
(0, vitest_1.describe)('Multi-Tenant Database Isolation Tests', () => {
    (0, vitest_1.it)('should require tenantId to create tenant client', () => {
        (0, vitest_1.expect)(() => (0, tenant_prisma_1.createTenantPrismaClient)('')).toThrow(/Tenant ID is required/i);
    });
    (0, vitest_1.it)('should automatically inject tenantId into findMany query where-clause', async () => {
        const tenantA = 'tenant-aaa-111';
        let interceptedArgs = null;
        // Create a mock base prisma client
        const mockBasePrisma = {
            $extends: (extension) => {
                const handler = extension.query.$allModels.$allOperations;
                return {
                    workspace: {
                        findMany: async (args) => {
                            return handler({
                                model: 'Workspace',
                                operation: 'findMany',
                                args,
                                query: (finalArgs) => {
                                    interceptedArgs = finalArgs;
                                    return [{ id: 'ws-1', name: 'General', tenantId: tenantA }];
                                }
                            });
                        }
                    }
                };
            }
        };
        const tenantPrisma = (0, tenant_prisma_1.createTenantPrismaClient)(tenantA, mockBasePrisma);
        // Call findMany with no where clause
        await tenantPrisma.workspace.findMany({});
        (0, vitest_1.expect)(interceptedArgs).toBeDefined();
        (0, vitest_1.expect)(interceptedArgs.where).toBeDefined();
        (0, vitest_1.expect)(interceptedArgs.where.tenantId).toBe(tenantA);
    });
    (0, vitest_1.it)('should override hostile tenantId injection attempt by malicious actor', async () => {
        const tenantA = 'tenant-legitimate-a';
        const tenantB = 'tenant-victim-b';
        let interceptedArgs = null;
        const mockBasePrisma = {
            $extends: (extension) => {
                const handler = extension.query.$allModels.$allOperations;
                return {
                    task: {
                        findMany: async (args) => {
                            return handler({
                                model: 'Task',
                                operation: 'findMany',
                                args,
                                query: (finalArgs) => {
                                    interceptedArgs = finalArgs;
                                    return [];
                                }
                            });
                        }
                    }
                };
            }
        };
        const tenantPrisma = (0, tenant_prisma_1.createTenantPrismaClient)(tenantA, mockBasePrisma);
        // Malicious request attempts to read Victim Tenant B's tasks
        await tenantPrisma.task.findMany({
            where: {
                tenantId: tenantB
            }
        });
        // The tenant-isolation extension MUST overwrite tenantId with tenantA
        (0, vitest_1.expect)(interceptedArgs.where.tenantId).toBe(tenantA);
        (0, vitest_1.expect)(interceptedArgs.where.tenantId).not.toBe(tenantB);
    });
    (0, vitest_1.it)('should enforce tenantId on create mutations', async () => {
        const tenantA = 'tenant-aaa-111';
        let interceptedArgs = null;
        const mockBasePrisma = {
            $extends: (extension) => {
                const handler = extension.query.$allModels.$allOperations;
                return {
                    task: {
                        create: async (args) => {
                            return handler({
                                model: 'Task',
                                operation: 'create',
                                args,
                                query: (finalArgs) => {
                                    interceptedArgs = finalArgs;
                                    return { id: 'new-task-id', ...finalArgs.data };
                                }
                            });
                        }
                    }
                };
            }
        };
        const tenantPrisma = (0, tenant_prisma_1.createTenantPrismaClient)(tenantA, mockBasePrisma);
        await tenantPrisma.task.create({
            data: {
                title: 'New Task Without Explicit Tenant'
            }
        });
        (0, vitest_1.expect)(interceptedArgs.data.tenantId).toBe(tenantA);
    });
});
//# sourceMappingURL=tenant-isolation.test.js.map