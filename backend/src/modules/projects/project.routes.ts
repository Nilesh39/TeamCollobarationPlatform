import { Router } from 'express';
import { projectController } from './project.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import { createProjectSchema, updateProjectSchema } from './project.validation';

const router = Router();

router.use(authenticate);
router.use(requireTenantContext());

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

router.post(
  '/',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  validate({ body: createProjectSchema }),
  projectController.createProject
);

router.patch(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  validate({ body: updateProjectSchema }),
  projectController.updateProject
);

router.delete(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  projectController.deleteProject
);

export { router as projectRoutes };
