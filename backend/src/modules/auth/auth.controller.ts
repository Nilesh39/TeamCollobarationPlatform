import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env.config';
import { sendSuccess, sendCreated } from '../../utils/response.util';

const REFRESH_COOKIE_NAME = 'ai_work_os_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

      sendCreated(
        res,
        {
          user: result.user,
          tenant: result.tenant,
          accessToken: result.accessToken
        },
        'Account registered successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

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

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!rawRefreshToken) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          title: 'Unauthorized',
          detail: 'Refresh token cookie is missing.'
        });
        return;
      }

      const result = await authService.refreshSession(rawRefreshToken);

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

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, user, 'Current user profile retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
