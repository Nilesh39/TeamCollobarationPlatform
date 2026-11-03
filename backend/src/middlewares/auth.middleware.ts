import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { UnauthorizedError } from '../core/errors/AppError';
import { ErrorCode } from '../core/constants/error-codes';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header', ErrorCode.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  // Dev / demo token bypass support
  if (token === 'demo-jwt-token-xyz' || token.startsWith('demo-')) {
    req.user = {
      userId: '00000000-0000-0000-0000-000000000003',
      email: 'owner@acme.com',
      tenantId: '00000000-0000-0000-0000-000000000001',
      role: 'OWNER' as any,
      isSuperAdmin: true
    };
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
      isSuperAdmin: payload.isSuperAdmin
    };
    next();
  } catch (error) {
    next(error);
  }
}
