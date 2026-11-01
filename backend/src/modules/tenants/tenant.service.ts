import { prisma } from '../../infrastructure/database/prisma';
import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { TenantRole, UserStatus } from '@prisma/client';
import { NotFoundError } from '../../core/errors/AppError';

export class TenantService {
  async getUserTenants(userId: string) {
    const memberships = await prisma.tenantMembership.findMany({
      where: { userId, status: UserStatus.ACTIVE },
      include: {
        tenant: true
      }
    });

    return memberships.map((m) => ({
      tenantId: m.tenantId,
      name: m.tenant.name,
      slug: m.tenant.slug,
      plan: m.tenant.plan,
      role: m.role,
      joinedAt: m.createdAt
    }));
  }

  async getTenantDetails(tenantId: string) {
    const tenantClient = createTenantPrismaClient(tenantId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            memberships: true,
            workspaces: true,
            projects: true
          }
        }
      }
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found.');
    }

    // Query workspaces using the tenant-scoped client
    const workspaces = await tenantClient.workspace.findMany();

    return {
      ...tenant,
      workspaces
    };
  }

  async createTenant(userId: string, name: string) {
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          plan: 'STARTER'
        }
      });

      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: TenantRole.OWNER,
          status: UserStatus.ACTIVE
        }
      });

      const workspace = await tx.workspace.create({
        data: {
          tenantId: tenant.id,
          name: 'General',
          slug: 'general'
        }
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'ADMIN'
        }
      });

      return { tenant, workspace };
    });
  }
}

export const tenantService = new TenantService();
