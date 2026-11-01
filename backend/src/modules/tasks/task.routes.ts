import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import { createTaskSchema, updateTaskSchema, addTaskCommentSchema } from './task.validation';

const router = Router();

router.use(authenticate);
router.use(requireTenantContext());

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);

router.post(
  '/',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.MEMBER]),
  validate({ body: createTaskSchema }),
  taskController.createTask
);

router.patch(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.MEMBER]),
  validate({ body: updateTaskSchema }),
  taskController.updateTask
);

router.delete(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  taskController.deleteTask
);

router.post(
  '/:id/comments',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.MEMBER]),
  validate({ body: addTaskCommentSchema }),
  taskController.addComment
);

export { router as taskRoutes };
