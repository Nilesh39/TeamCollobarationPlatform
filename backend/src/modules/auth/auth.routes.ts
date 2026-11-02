import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { authRateLimiter, passwordResetRateLimiter } from '../../middlewares/rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  switchTenantSchema
} from './auth.validation';

const router = Router();

// Registration & Login (Rate-limited)
router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);

// Email Verification
router.post('/verify-email', authRateLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post('/resend-verification', authRateLimiter, validate({ body: resendVerificationSchema }), authController.resendVerification);

// Password Management (Strict Rate-limited)
router.post('/forgot-password', passwordResetRateLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);

// Token & Session Lifecycle
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected Auth Routes
router.get('/me', authenticate, authController.getMe);
router.post('/switch-tenant', authenticate, validate({ body: switchTenantSchema }), authController.switchTenant);

// Session Management
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.post('/sessions/revoke-all', authenticate, authController.revokeAllSessions);

export { router as authRoutes };
