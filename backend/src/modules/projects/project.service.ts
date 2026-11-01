import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { NotFoundError, ConflictError } from '../../core/errors/AppError';
import { CreateProjectInput, UpdateProjectInput } from './project.validation';

export class ProjectService {
  async getProjects(tenantId: string, workspaceId?: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    return tenantPrisma.project.findMany({
      where: {
        ...(workspaceId && { workspaceId })
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });
  }

  async getProjectById(tenantId: string, projectId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    const project = await tenantPrisma.project.findFirst({
      where: { id: projectId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true }
        },
        tasks: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            orderIndex: true
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or unauthorized.');
    }

    return project;
  }

  async createProject(tenantId: string, input: CreateProjectInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    // Verify key uniqueness within tenant
    const existing = await tenantPrisma.project.findFirst({
      where: { key: input.key }
    });

    if (existing) {
      throw new ConflictError(`Project with key [${input.key}] already exists in this tenant.`);
    }

    // Verify workspace exists in tenant
    const workspace = await tenantPrisma.workspace.findFirst({
      where: { id: input.workspaceId }
    });

    if (!workspace) {
      throw new NotFoundError('Target workspace not found in this organization.');
    }

    return tenantPrisma.project.create({
      data: {
        tenantId,
        workspaceId: input.workspaceId,
        name: input.name,
        key: input.key,
        description: input.description,
        status: 'ACTIVE'
      }
    });
  }

  async updateProject(tenantId: string, projectId: string, input: UpdateProjectInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getProjectById(tenantId, projectId);

    return tenantPrisma.project.update({
      where: { id: projectId },
      data: input
    });
  }

  async deleteProject(tenantId: string, projectId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getProjectById(tenantId, projectId);

    await tenantPrisma.project.delete({
      where: { id: projectId }
    });

    return { id: projectId, deleted: true };
  }
}

export const projectService = new ProjectService();
