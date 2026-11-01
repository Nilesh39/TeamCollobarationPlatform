import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Creates a tenant-isolated Prisma Client instance.
 * Automatically injects `tenantId` into where clauses and mutation payloads,
 * preventing cross-tenant data leaks at the ORM layer.
 */
export function createTenantPrismaClient(tenantId: string, baseClient: PrismaClient = prisma) {
  if (!tenantId) {
    throw new Error('Tenant ID is required to create a tenant-scoped Prisma client.');
  }

  return baseClient.$extends({
    name: 'tenant-isolation-extension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Models that belong strictly to a tenant
          const tenantScopedModels = [
            'Workspace',
            'Project',
            'Task',
            'Document',
            'DocumentChunk',
            'AiAgent',
            'ChatSession',
            'AutomationWorkflow',
            'AuditLog',
            'TenantMembership'
          ];

          if (tenantScopedModels.includes(model)) {
            const typedArgs = (args || {}) as any;

            if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
              typedArgs.where = { ...(typedArgs.where || {}), tenantId };
            }

            if (operation === 'create') {
              typedArgs.data = { ...(typedArgs.data || {}), tenantId };
            }

            if (operation === 'createMany') {
              if (Array.isArray(typedArgs.data)) {
                typedArgs.data = typedArgs.data.map((item: any) => ({ ...item, tenantId }));
              }
            }

            if (['updateMany', 'deleteMany'].includes(operation)) {
              typedArgs.where = { ...(typedArgs.where || {}), tenantId };
            }

            // For findUnique, wrap into findFirst with tenantId to guarantee tenant isolation
            if (operation === 'findUnique') {
              return (baseClient as any)[model.toLowerCase()].findFirst({
                where: { ...typedArgs.where, tenantId }
              });
            }

            // For update, enforce tenantId in the where clause
            if (operation === 'update') {
              return (baseClient as any)[model.toLowerCase()].updateMany({
                where: { ...typedArgs.where, tenantId },
                data: typedArgs.data
              });
            }

            // For delete, enforce tenantId in the where clause
            if (operation === 'delete') {
              return (baseClient as any)[model.toLowerCase()].deleteMany({
                where: { ...typedArgs.where, tenantId }
              });
            }

            return query(typedArgs);
          }

          return query(args);
        }
      }
    }
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantPrismaClient>;
