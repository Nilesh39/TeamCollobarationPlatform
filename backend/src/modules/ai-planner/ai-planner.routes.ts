import { Router } from 'express';
import { aiPlannerController } from './ai-planner.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import { generatePlanSchema, approvePlanSchema } from './ai-planner.validation';

const router = Router();

router.use(authenticate);
router.use(requireTenantContext());

// Generate structured project plan from natural language
router.post(
  '/generate',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER, TenantRole.MEMBER]),
  validate({ body: generatePlanSchema }),
  (req, res, next) => aiPlannerController.generatePlan(req, res, next)
);

// Check background generation job status
router.get(
  '/jobs/:jobId',
  (req, res, next) => aiPlannerController.getJobStatus(req, res, next)
);

// Approve and persist plan into production PostgreSQL tables
router.post(
  '/approve',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER]),
  validate({ body: approvePlanSchema }),
  (req, res, next) => aiPlannerController.approvePlan(req, res, next)
);

export { router as aiPlannerRoutes };
