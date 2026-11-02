import { Request, Response, NextFunction } from 'express';
import { authService, AuthContextMeta } from './auth.service';
import { env } from '../../config/env.config';
import { sendSuccess, sendCreated } from '../../utils/response.util';

const REFRESH_COOKIE_NAME = 'ai_work_os_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

function extractContextMeta(req: Request): AuthContextMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip || req.socket.remoteAddress || '127.0.0.1';

  return {
    userAgent: req.headers['user-agent'] || 'Unknown Device',
    ipAddress
  };
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = extractContextMeta(req);
      const result = await authService.register(req.body, meta);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

      sendCreated(
        res,
        {
          user: result.user,
          tenant: result.tenant,
          accessToken: result.accessToken,
          verificationToken: result.verificationToken
        },
        'Account registered successfully. Please verify your email.'
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = extractContextMeta(req);
      const result = await authService.login(req.body, meta);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

      sendSuccess(
        res,
        {
          user: result.user,
          activeTenant: result.activeTenant,
          availableTenants: result.availableTenants,
          accessToken: result.accessToken
        },
        'Authenticated successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.body.email || req.user?.email;
      const result = await authService.resendVerification(email);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!rawRefreshToken) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Unauthorized',
          detail: 'Refresh token cookie is missing.'
        });
        return;
      }

      const meta = extractContextMeta(req);
      const result = await authService.refreshSession(rawRefreshToken, meta);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          tenantId: result.tenantId
        },
        'Session refreshed successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  async switchTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = extractContextMeta(req);
      const { tenantId } = req.body;
      const result = await authService.switchTenant(req.user!.userId, tenantId, meta);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

      sendSuccess(
        res,
        {
          activeTenant: result.activeTenant,
          accessToken: result.accessToken
        },
        'Switched organization successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const sessions = await authService.getSessions(req.user!.userId, currentToken);
      sendSuccess(res, sessions, 'Active sessions retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const result = await authService.revokeSession(req.user!.userId, sessionId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.revokeAllSessions(req.user!.userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await authService.logout(rawRefreshToken);

      res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
      sendSuccess(res, { loggedOut: true }, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, user, 'Current user profile retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
