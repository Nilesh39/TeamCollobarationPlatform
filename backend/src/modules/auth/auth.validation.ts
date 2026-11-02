import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Valid email address is required').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  tenantName: z.string().min(2, 'Organization name must be at least 2 characters').max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required')
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Valid email address is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

export const switchTenantSchema = z.object({
  tenantId: z.string().uuid('Valid tenant UUID is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SwitchTenantInput = z.infer<typeof switchTenantSchema>;
