import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.config';
import { redis } from '../infrastructure/redis/redis.client';
import { UnauthorizedError } from '../core/errors/AppError';
import { ErrorCode } from '../core/constants/error-codes';
import { TenantRole } from '../core/constants/permissions';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  tenantId?: string;
  role?: TenantRole;
}

export interface StoredRefreshTokenSession {
  userId: string;
  familyId: string;
  tenantId?: string;
  createdAt: number;
  revoked?: boolean;
}

/**
 * Signs a short-lived access token (default 15 minutes)
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256'
  });
}

/**
 * Verifies and decodes an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token has expired', ErrorCode.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError('Invalid access token', ErrorCode.TOKEN_INVALID);
  }
}

/**
 * Creates and persists a rotated refresh token in Redis with reuse detection family
 */
export async function createRefreshTokenSession(
  userId: string,
  tenantId?: string,
  existingFamilyId?: string
): Promise<{ refreshToken: string; familyId: string }> {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const familyId = existingFamilyId || crypto.randomUUID();

  const sessionData: StoredRefreshTokenSession = {
    userId,
    familyId,
    tenantId,
    createdAt: Date.now(),
    revoked: false
  };

  const ttlSeconds = 7 * 24 * 60 * 60;

  // Store refresh token session
  await redis.set(`refresh_token:${tokenHash}`, JSON.stringify(sessionData), ttlSeconds);

  // Maintain active token pointer for this family
  await redis.set(`refresh_family:${familyId}`, tokenHash, ttlSeconds);

  return { refreshToken: rawToken, familyId };
}

/**
 * Rotates a refresh token.
 * If token reuse is detected, revokes the entire token family!
 */
export async function rotateRefreshToken(
  rawRefreshToken: string
): Promise<{ newAccessToken: string; newRefreshToken: string; userId: string; tenantId?: string }> {
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const sessionJson = await redis.get(`refresh_token:${tokenHash}`);

  if (!sessionJson) {
    throw new UnauthorizedError('Refresh token expired or invalid', ErrorCode.TOKEN_INVALID);
  }

  const session: StoredRefreshTokenSession = JSON.parse(sessionJson);

  // Token Reuse Detection: If token presented was already marked revoked,
  // or active family token has moved forward, someone attempted replay of a consumed token!
  const currentActiveHash = await redis.get(`refresh_family:${session.familyId}`);

  if (session.revoked || currentActiveHash !== tokenHash) {
    await revokeRefreshTokenFamily(session.familyId);
    throw new UnauthorizedError(
      'Security alert: Refresh token reuse detected. All sessions revoked.',
      ErrorCode.TOKEN_REVOKED
    );
  }

  // Mark the consumed token as revoked (retain in cache for the TTL window to detect replay attacks)
  session.revoked = true;
  const ttlSeconds = 7 * 24 * 60 * 60;
  await redis.set(`refresh_token:${tokenHash}`, JSON.stringify(session), ttlSeconds);

  // Generate new refresh token in the same family
  const { refreshToken: newRefreshToken } = await createRefreshTokenSession(
    session.userId,
    session.tenantId,
    session.familyId
  );

  // Generate new short-lived access token
  const newAccessToken = signAccessToken({
    userId: session.userId,
    email: '',
    tenantId: session.tenantId
  });

  return {
    newAccessToken,
    newRefreshToken,
    userId: session.userId,
    tenantId: session.tenantId
  };
}

/**
 * Revokes all tokens in a family
 */
export async function revokeRefreshTokenFamily(familyId: string): Promise<void> {
  const activeHash = await redis.get(`refresh_family:${familyId}`);
  if (activeHash) {
    await redis.del(`refresh_token:${activeHash}`);
  }
  await redis.del(`refresh_family:${familyId}`);
}

/**
 * Revokes a single refresh token session
 */
export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const sessionJson = await redis.get(`refresh_token:${tokenHash}`);
  if (sessionJson) {
    const session: StoredRefreshTokenSession = JSON.parse(sessionJson);
    await revokeRefreshTokenFamily(session.familyId);
  }
}
