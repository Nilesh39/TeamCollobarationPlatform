import { Request, Response, NextFunction } from 'express';
import { documentService } from './document.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

export class DocumentController {
  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const workspaceId = req.query.workspaceId as string | undefined;
      const docs = await documentService.getDocuments(tenantId, workspaceId);
      sendSuccess(res, docs, 'Documents retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const doc = await documentService.getDocumentById(tenantId, id);
      sendSuccess(res, doc, 'Document details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async registerDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const doc = await documentService.registerDocument(tenantId, req.body);
      sendCreated(res, doc, 'Document registered and indexed.');
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const result = await documentService.deleteDocument(tenantId, id);
      sendSuccess(res, result, 'Document purged from knowledge base.');
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
