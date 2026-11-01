import { Router } from 'express';
import { documentController } from './document.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import { registerDocumentSchema } from './document.validation';

const router = Router();

router.use(authenticate);
router.use(requireTenantContext());

router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);

router.post(
  '/',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.MEMBER]),
  validate({ body: registerDocumentSchema }),
  documentController.registerDocument
);

router.delete(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  documentController.deleteDocument
);

export { router as documentRoutes };
