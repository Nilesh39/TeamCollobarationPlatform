import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { TenantRole } from '../../core/constants/permissions';

const router = Router();

// List user's tenants
router.get('/', authenticate, tenantController.getMyTenants);

// Create new tenant
router.post('/', authenticate, tenantController.createTenant);

// Get current tenant details (requires active tenant context + OWNER or ADMIN role)
router.get(
  '/current',
  authenticate,
  requireTenantContext(),
  requireRole([TenantRole.OWNER, TenantRole.ADMIN, TenantRole.MEMBER]),
  tenantController.getTenantDetails
);

export { router as tenantRoutes };
