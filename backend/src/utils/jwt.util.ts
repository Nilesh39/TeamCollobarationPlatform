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
  isSuperAdmin?: boolean;
}

export interface StoredRefreshTokenSession {
  userId: string;
  familyId: string;
  tenantId?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  lastActiveAt?: number;
  revoked?: boolean;
}

export interface SessionInfo {
  id: string;
  userId: string;
  tenantId?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  lastActiveAt: number;
  isCurrent?: boolean;
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
  existingFamilyId?: string,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<{ refreshToken: string; familyId: string }> {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const familyId = existingFamilyId || crypto.randomUUID();

  const sessionData: StoredRefreshTokenSession = {
    userId,
    familyId,
    tenantId,
    userAgent: metadata?.userAgent,
    ipAddress: metadata?.ipAddress,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    revoked: false
  };

  const ttlSeconds = 7 * 24 * 60 * 60;

  // Store refresh token session
  await redis.set(`refresh_token:${tokenHash}`, JSON.stringify(sessionData), ttlSeconds);

  // Maintain active token pointer for this family
  await redis.set(`refresh_family:${familyId}`, tokenHash, ttlSeconds);

  // Track session metadata for family and user
  await redis.set(`session_meta:${familyId}`, JSON.stringify(sessionData), ttlSeconds);
  await redis.sadd(`user_families:${userId}`, familyId);

  return { refreshToken: rawToken, familyId };
}

/**
 * Rotates a refresh token.
 * If token reuse is detected, revokes the entire token family!
 */
export async function rotateRefreshToken(
  rawRefreshToken: string,
  metadata?: { userAgent?: string; ipAddress?: string }
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
    session.familyId,
    metadata || { userAgent: session.userAgent, ipAddress: session.ipAddress }
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
  const metaJson = await redis.get(`session_meta:${familyId}`);
  if (metaJson) {
    try {
      const meta = JSON.parse(metaJson);
      if (meta.userId) {
        await redis.srem(`user_families:${meta.userId}`, familyId);
      }
    } catch {
      // ignore parsing error
    }
  }
  await redis.del(`session_meta:${familyId}`);
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

/**
 * Lists active sessions for a user
 */
export async function getUserActiveSessions(userId: string, currentRefreshToken?: string): Promise<SessionInfo[]> {
  const familyIds = await redis.smembers(`user_families:${userId}`);
  const sessions: SessionInfo[] = [];

  let currentFamilyId: string | undefined;
  if (currentRefreshToken) {
    const tokenHash = crypto.createHash('sha256').update(currentRefreshToken).digest('hex');
    const sess = await redis.get(`refresh_token:${tokenHash}`);
    if (sess) {
      try {
        currentFamilyId = JSON.parse(sess).familyId;
      } catch {
        // ignore
      }
    }
  }

  for (const familyId of familyIds) {
    const metaJson = await redis.get(`session_meta:${familyId}`);
    if (metaJson) {
      try {
        const meta = JSON.parse(metaJson);
        sessions.push({
          id: familyId,
          userId: meta.userId,
          tenantId: meta.tenantId,
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress,
          createdAt: meta.createdAt,
          lastActiveAt: meta.lastActiveAt || meta.createdAt,
          isCurrent: currentFamilyId ? currentFamilyId === familyId : false
        });
      } catch {
        // ignore
      }
    } else {
      await redis.srem(`user_families:${userId}`, familyId);
    }
  }

  return sessions.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

/**
 * Revokes a specific session by familyId
 */
export async function revokeSessionById(userId: string, familyId: string): Promise<void> {
  const metaJson = await redis.get(`session_meta:${familyId}`);
  if (metaJson) {
    try {
      const meta = JSON.parse(metaJson);
      if (meta.userId === userId) {
        await revokeRefreshTokenFamily(familyId);
        return;
      }
    } catch {
      // ignore
    }
  }
  await redis.srem(`user_families:${userId}`, familyId);
}

/**
 * Revokes all sessions for a user, optionally preserving current family
 */
export async function revokeAllUserSessions(userId: string, preserveFamilyId?: string): Promise<void> {
  const familyIds = await redis.smembers(`user_families:${userId}`);
  for (const fid of familyIds) {
    if (preserveFamilyId && fid === preserveFamilyId) continue;
    await revokeRefreshTokenFamily(fid);
  }
}
