import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { NotFoundError } from '../../core/errors/AppError';
import { CreateWorkspaceInput, UpdateWorkspaceInput } from './workspace.validation';

export class WorkspaceService {
  async getWorkspaces(tenantId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    return tenantPrisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            projects: true,
            documents: true,
            members: true
          }
        }
      }
    });
  }

  async getWorkspaceById(tenantId: string, workspaceId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    const workspace = await tenantPrisma.workspace.findFirst({
      where: { id: workspaceId },
      include: {
        projects: {
          select: { id: true, name: true, key: true, status: true, updatedAt: true }
        },
        documents: {
          select: { id: true, title: true, mimeType: true, fileSize: true, status: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found or unauthorized.');
    }

    return workspace;
  }

  async createWorkspace(tenantId: string, userId: string, input: CreateWorkspaceInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    const workspace = await tenantPrisma.workspace.create({
      data: {
        tenantId,
        name: input.name,
        slug,
        description: input.description,
        isPrivate: input.isPrivate || false,
        members: {
          create: {
            userId,
            role: 'ADMIN'
          }
        }
      }
    });

    return workspace;
  }

  async updateWorkspace(tenantId: string, workspaceId: string, input: UpdateWorkspaceInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getWorkspaceById(tenantId, workspaceId);

    return tenantPrisma.workspace.update({
      where: { id: workspaceId },
      data: input
    });
  }

  async deleteWorkspace(tenantId: string, workspaceId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getWorkspaceById(tenantId, workspaceId);

    await tenantPrisma.workspace.delete({
      where: { id: workspaceId }
    });

    return { id: workspaceId, deleted: true };
  }
}

export const workspaceService = new WorkspaceService();
