import { describe, it, expect, vi } from 'vitest';
import { createTenantPrismaClient } from '../src/infrastructure/database/tenant-prisma';

describe('Multi-Tenant Database Isolation Tests', () => {
  it('should require tenantId to create tenant client', () => {
    expect(() => createTenantPrismaClient('')).toThrow(/Tenant ID is required/i);
  });

  it('should automatically inject tenantId into findMany query where-clause', async () => {
    const tenantA = 'tenant-aaa-111';
    let interceptedArgs: any = null;

    // Create a mock base prisma client
    const mockBasePrisma = {
      $extends: (extension: any) => {
        const handler = extension.query.$allModels.$allOperations;
        return {
          workspace: {
            findMany: async (args: any) => {
              return handler({
                model: 'Workspace',
                operation: 'findMany',
                args,
                query: (finalArgs: any) => {
                  interceptedArgs = finalArgs;
                  return [{ id: 'ws-1', name: 'General', tenantId: tenantA }];
                }
              });
            }
          }
        };
      }
    } as any;

    const tenantPrisma = createTenantPrismaClient(tenantA, mockBasePrisma);

    // Call findMany with no where clause
    await (tenantPrisma as any).workspace.findMany({});

    expect(interceptedArgs).toBeDefined();
    expect(interceptedArgs.where).toBeDefined();
    expect(interceptedArgs.where.tenantId).toBe(tenantA);
  });

  it('should override hostile tenantId injection attempt by malicious actor', async () => {
    const tenantA = 'tenant-legitimate-a';
    const tenantB = 'tenant-victim-b';
    let interceptedArgs: any = null;

    const mockBasePrisma = {
      $extends: (extension: any) => {
        const handler = extension.query.$allModels.$allOperations;
        return {
          task: {
            findMany: async (args: any) => {
              return handler({
                model: 'Task',
                operation: 'findMany',
                args,
                query: (finalArgs: any) => {
                  interceptedArgs = finalArgs;
                  return [];
                }
              });
            }
          }
        };
      }
    } as any;

    const tenantPrisma = createTenantPrismaClient(tenantA, mockBasePrisma);

    // Malicious request attempts to read Victim Tenant B's tasks
    await (tenantPrisma as any).task.findMany({
      where: {
        tenantId: tenantB
      }
    });

    // The tenant-isolation extension MUST overwrite tenantId with tenantA
    expect(interceptedArgs.where.tenantId).toBe(tenantA);
    expect(interceptedArgs.where.tenantId).not.toBe(tenantB);
  });

  it('should enforce tenantId on create mutations', async () => {
    const tenantA = 'tenant-aaa-111';
    let interceptedArgs: any = null;

    const mockBasePrisma = {
      $extends: (extension: any) => {
        const handler = extension.query.$allModels.$allOperations;
        return {
          task: {
            create: async (args: any) => {
              return handler({
                model: 'Task',
                operation: 'create',
                args,
                query: (finalArgs: any) => {
                  interceptedArgs = finalArgs;
                  return { id: 'new-task-id', ...finalArgs.data };
                }
              });
            }
          }
        };
      }
    } as any;

    const tenantPrisma = createTenantPrismaClient(tenantA, mockBasePrisma);

    await (tenantPrisma as any).task.create({
      data: {
        title: 'New Task Without Explicit Tenant'
      }
    });

    expect(interceptedArgs.data.tenantId).toBe(tenantA);
  });
});
