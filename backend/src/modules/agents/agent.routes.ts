import { Router } from 'express';
import { agentController } from './agent.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import { createAgentSchema, updateAgentSchema } from './agent.validation';

const router = Router();

router.use(authenticate);
router.use(requireTenantContext());

router.get('/', agentController.getAgents);
router.get('/:id', agentController.getAgentById);

router.post(
  '/',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  validate({ body: createAgentSchema }),
  agentController.createAgent
);

router.patch(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  validate({ body: updateAgentSchema }),
  agentController.updateAgent
);

router.delete(
  '/:id',
  requireRole([TenantRole.OWNER, TenantRole.ADMIN]),
  agentController.deleteAgent
);

export { router as agentRoutes };
