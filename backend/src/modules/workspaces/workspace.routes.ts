import { Router } from 'express';
import { workspaceController } from './workspace.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import { createWorkspaceSchema, updateWorkspaceSchema } from './workspace.validation';

const router = Router();

router.use(authenticate);
router.use(requireTenantContext());

router.get('/', workspaceController.getWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);

router.post(
  '/',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  validate({ body: createWorkspaceSchema }),
  workspaceController.createWorkspace
);

router.patch(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  validate({ body: updateWorkspaceSchema }),
  workspaceController.updateWorkspace
);

router.delete(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  workspaceController.deleteWorkspace
);

export { router as workspaceRoutes };
