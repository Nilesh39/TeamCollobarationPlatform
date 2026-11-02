import { z } from 'zod';
import { TenantRole } from '@prisma/client';

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100)
});

export const updateTenantSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100).optional(),
  settings: z.record(z.any()).optional()
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email address is required').max(255),
  role: z.nativeEnum(TenantRole, {
    errorMap: () => ({ message: 'Invalid tenant role specified.' })
  }).default(TenantRole.MEMBER)
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required')
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(TenantRole, {
    errorMap: () => ({ message: 'Invalid tenant role specified.' })
  })
});

export const updateSettingsSchema = z.object({
  settings: z.record(z.any())
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
