import { Router } from 'express';
import { projectController } from './project.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireMinRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import {
  createProjectSchema,
  updateProjectSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  addProjectMemberSchema
} from './project.validation';

const router = Router();

router.use(authenticate);
router.use(requireTenantContext());

// Project Collection Endpoints
router.get('/', projectController.getProjects);
router.post(
  '/',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  validate({ body: createProjectSchema }),
  projectController.createProject
);

// Single Project Endpoints
router.get('/:id', projectController.getProjectById);
router.patch(
  '/:id',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  validate({ body: updateProjectSchema }),
  projectController.updateProject
);
router.patch(
  '/:id/archive',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  projectController.archiveProject
);
router.delete(
  '/:id',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  projectController.deleteProject
);

// Project Member Management
router.post(
  '/:id/members',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  validate({ body: addProjectMemberSchema }),
  projectController.addMember
);
router.delete(
  '/:id/members/:memberUserId',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  projectController.removeMember
);

// Milestone Management
router.post(
  '/:id/milestones',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  validate({ body: createMilestoneSchema }),
  projectController.createMilestone
);
router.patch(
  '/:id/milestones/:milestoneId',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  validate({ body: updateMilestoneSchema }),
  projectController.updateMilestone
);
router.delete(
  '/:id/milestones/:milestoneId',
  requireMinRole(TenantRole.PROJECT_MANAGER),
  projectController.deleteMilestone
);

// Project Activity Stream
router.get('/:id/activities', projectController.getActivities);

export { router as projectRoutes };
