import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  addTaskCommentSchema,
  addTaskLabelSchema,
  addTaskAttachmentSchema,
  addTaskDependencySchema,
  createSubtaskSchema,
  queryTasksSchema
} from './task.validation';

const router = Router();

// Guard all task endpoints with authentication & tenant resolution
router.use(authenticate);
router.use(requireTenantContext());

const StandardRoles = [
  TenantRole.OWNER,
  TenantRole.ADMIN,
  TenantRole.PROJECT_MANAGER,
  TenantRole.MEMBER
];

// Query and Details
router.get('/', validate({ query: queryTasksSchema }), taskController.getTasks);
router.get('/:id', taskController.getTaskById);

// Task Mutation Endpoints
router.post(
  '/',
  requireRole(StandardRoles),
  validate({ body: createTaskSchema }),
  taskController.createTask
);

router.patch(
  '/:id',
  requireRole(StandardRoles),
  validate({ body: updateTaskSchema }),
  taskController.updateTask
);

router.post(
  '/:id/move',
  requireRole(StandardRoles),
  validate({ body: moveTaskSchema }),
  taskController.moveTask
);

router.delete(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER]),
  taskController.deleteTask
);

// Comments
router.post(
  '/:id/comments',
  requireRole(StandardRoles),
  validate({ body: addTaskCommentSchema }),
  taskController.addComment
);

router.delete(
  '/:id/comments/:commentId',
  requireRole(StandardRoles),
  taskController.deleteComment
);

// Labels
router.post(
  '/:id/labels',
  requireRole(StandardRoles),
  validate({ body: addTaskLabelSchema }),
  taskController.addLabel
);

router.delete(
  '/:id/labels/:labelId',
  requireRole(StandardRoles),
  taskController.removeLabel
);

// Attachments
router.post(
  '/:id/attachments',
  requireRole(StandardRoles),
  validate({ body: addTaskAttachmentSchema }),
  taskController.addAttachment
);

router.delete(
  '/:id/attachments/:attachmentId',
  requireRole(StandardRoles),
  taskController.removeAttachment
);

// Subtasks
router.post(
  '/:id/subtasks',
  requireRole(StandardRoles),
  validate({ body: createSubtaskSchema }),
  taskController.createSubtask
);

// Dependencies (with Circular Dependency Cycle Prevention)
router.post(
  '/:id/dependencies',
  requireRole(StandardRoles),
  validate({ body: addTaskDependencySchema }),
  taskController.addDependency
);

router.delete(
  '/:id/dependencies/:dependsOnTaskId',
  requireRole(StandardRoles),
  taskController.removeDependency
);

export { router as taskRoutes };
