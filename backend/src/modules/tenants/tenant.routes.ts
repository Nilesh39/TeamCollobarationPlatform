import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireTenantContext } from '../../middlewares/tenant.middleware';
import { requireMinRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { TenantRole } from '../../core/constants/permissions';
import {
  createTenantSchema,
  updateTenantSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
  updateSettingsSchema
} from './tenant.validation';

const router = Router();

// Global tenant endpoints for authenticated user
router.get('/', authenticate, tenantController.getMyTenants);
router.post('/', authenticate, validate({ body: createTenantSchema }), tenantController.createTenant);
router.post('/invitations/accept', authenticate, validate({ body: acceptInvitationSchema }), tenantController.acceptInvitation);

// Tenant-scoped routes via header 'X-Tenant-ID' or '/current'
router.get(
  '/current',
  authenticate,
  requireTenantContext(),
  tenantController.getTenantDetails
);

router.patch(
  '/current',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  validate({ body: updateTenantSchema }),
  tenantController.updateTenant
);

router.get(
  '/current/members',
  authenticate,
  requireTenantContext(),
  tenantController.getMembers
);

router.post(
  '/current/invitations',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  validate({ body: inviteMemberSchema }),
  tenantController.inviteMember
);

router.get(
  '/current/invitations',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  tenantController.getInvitations
);

router.delete(
  '/current/members/:memberId',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  tenantController.removeMember
);

router.patch(
  '/current/members/:memberId/role',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.OWNER),
  validate({ body: updateMemberRoleSchema }),
  tenantController.updateMemberRole
);

router.get(
  '/current/settings',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  tenantController.getSettings
);

router.patch(
  '/current/settings',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  validate({ body: updateSettingsSchema }),
  tenantController.updateSettings
);

// Parameterized :tenantId routes
router.get(
  '/:tenantId',
  authenticate,
  requireTenantContext(),
  tenantController.getTenantDetails
);

router.patch(
  '/:tenantId',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  validate({ body: updateTenantSchema }),
  tenantController.updateTenant
);

router.get(
  '/:tenantId/members',
  authenticate,
  requireTenantContext(),
  tenantController.getMembers
);

router.post(
  '/:tenantId/invitations',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  validate({ body: inviteMemberSchema }),
  tenantController.inviteMember
);

router.get(
  '/:tenantId/invitations',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  tenantController.getInvitations
);

router.delete(
  '/:tenantId/members/:memberId',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  tenantController.removeMember
);

router.patch(
  '/:tenantId/members/:memberId/role',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.OWNER),
  validate({ body: updateMemberRoleSchema }),
  tenantController.updateMemberRole
);

router.get(
  '/:tenantId/settings',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  tenantController.getSettings
);

router.patch(
  '/:tenantId/settings',
  authenticate,
  requireTenantContext(),
  requireMinRole(TenantRole.ADMIN),
  validate({ body: updateSettingsSchema }),
  tenantController.updateSettings
);

export { router as tenantRoutes };
