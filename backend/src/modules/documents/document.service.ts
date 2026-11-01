import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { NotFoundError } from '../../core/errors/AppError';
import { RegisterDocumentInput } from './document.validation';
import { DocumentStatus } from '@prisma/client';

export class DocumentService {
  async getDocuments(tenantId: string, workspaceId?: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    return tenantPrisma.document.findMany({
      where: {
        ...(workspaceId && { workspaceId })
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        _count: { select: { chunks: true } }
      }
    });
  }

  async getDocumentById(tenantId: string, documentId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    const doc = await tenantPrisma.document.findFirst({
      where: { id: documentId },
      include: {
        workspace: { select: { id: true, name: true } },
        chunks: {
          select: { id: true, chunkIndex: true, tokenCount: true, metadata: true }
        }
      }
    });

    if (!doc) {
      throw new NotFoundError('Document not found or unauthorized.');
    }

    return doc;
  }

  async registerDocument(tenantId: string, input: RegisterDocumentInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    // Verify workspace belongs to tenant
    const workspace = await tenantPrisma.workspace.findFirst({
      where: { id: input.workspaceId }
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found in this organization.');
    }

    return tenantPrisma.document.create({
      data: {
        tenantId,
        workspaceId: input.workspaceId,
        title: input.title,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        status: DocumentStatus.INDEXED
      }
    });
  }

  async deleteDocument(tenantId: string, documentId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getDocumentById(tenantId, documentId);

    await tenantPrisma.document.delete({
      where: { id: documentId }
    });

    return { id: documentId, deleted: true };
  }
}

export const documentService = new DocumentService();
