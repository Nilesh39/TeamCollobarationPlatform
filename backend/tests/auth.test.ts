import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password.util';
import {
  signAccessToken,
  verifyAccessToken,
  createRefreshTokenSession,
  rotateRefreshToken,
  revokeRefreshTokenFamily,
  getUserActiveSessions,
  revokeSessionById,
  revokeAllUserSessions
} from '../src/utils/jwt.util';
import { redis } from '../src/infrastructure/redis/redis.client';
import { TenantRole } from '../src/core/constants/permissions';
import { rateLimiter } from '../src/middlewares/rate-limit.middleware';
import { TooManyRequestsError } from '../src/core/errors/AppError';

describe('Authentication, Security & Session Management Tests', () => {
  beforeEach(async () => {
    await redis.flushAll();
  });

  describe('Argon2id Password Hashing', () => {
    it('should securely hash password with Argon2id and verify correctly', async () => {
      const password = 'SecretPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.startsWith('$argon2id$')).toBe(true);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword123!', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Access Token Lifecycle & Claims', () => {
    it('should sign and verify short-lived access tokens with proper claims', () => {
      const payload = {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'user@example.com',
        tenantId: '22222222-2222-2222-2222-222222222222',
        role: TenantRole.ADMIN,
        isSuperAdmin: false
      };

      const token = signAccessToken(payload);
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.tenantId).toBe(payload.tenantId);
      expect(decoded.role).toBe(TenantRole.ADMIN);
      expect(decoded.isSuperAdmin).toBe(false);
    });

    it('should throw an error when an invalid token is provided', () => {
      expect(() => verifyAccessToken('invalid.jwt.token')).toThrow();
    });
  });

  describe('Redis-Backed Refresh Token Rotation & Family Reuse Detection', () => {
    it('should issue refresh token, rotate it, and allow valid continuation', async () => {
      const userId = 'user-abc-123';
      const tenantId = 'tenant-xyz-789';

      // 1. Initial session creation
      const { refreshToken: token1, familyId } = await createRefreshTokenSession(userId, tenantId);
      expect(token1).toBeDefined();
      expect(familyId).toBeDefined();

      // 2. Rotate token
      const rotation1 = await rotateRefreshToken(token1);
      expect(rotation1.userId).toBe(userId);
      expect(rotation1.newRefreshToken).toBeDefined();
      expect(rotation1.newRefreshToken).not.toBe(token1);

      // 3. Rotate new token again
      const rotation2 = await rotateRefreshToken(rotation1.newRefreshToken);
      expect(rotation2.userId).toBe(userId);
      expect(rotation2.newRefreshToken).toBeDefined();
    });

    it('should detect token replay/reuse and revoke entire token family', async () => {
      const userId = 'user-replay-target';
      const { refreshToken: token1 } = await createRefreshTokenSession(userId);

      // Legitimate client rotates token1 -> gets token2
      const rotation = await rotateRefreshToken(token1);
      const token2 = rotation.newRefreshToken;

      // Malicious actor attempts to replay already-consumed token1!
      await expect(rotateRefreshToken(token1)).rejects.toThrow(/reuse detected/i);

      // Legitimate client with token2 should now also be locked out because the family was revoked
      await expect(rotateRefreshToken(token2)).rejects.toThrow();
    });
  });

  describe('Session Management & Device Tracking', () => {
    it('should record session metadata and list active sessions for user', async () => {
      const userId = 'user-session-test';
      const tenantId = 'tenant-session-1';

      const s1 = await createRefreshTokenSession(userId, tenantId, undefined, {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '192.168.1.50'
      });

      const s2 = await createRefreshTokenSession(userId, tenantId, undefined, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        ipAddress: '10.0.0.12'
      });

      const sessions = await getUserActiveSessions(userId, s1.refreshToken);
      expect(sessions.length).toBe(2);

      const current = sessions.find((s) => s.id === s1.familyId);
      expect(current).toBeDefined();
      expect(current?.isCurrent).toBe(true);
      expect(current?.userAgent).toContain('Macintosh');
      expect(current?.ipAddress).toBe('192.168.1.50');

      const other = sessions.find((s) => s.id === s2.familyId);
      expect(other?.isCurrent).toBe(false);
      expect(other?.userAgent).toContain('iPhone');
    });

    it('should revoke a specific session and leave other sessions active', async () => {
      const userId = 'user-selective-revoke';

      const s1 = await createRefreshTokenSession(userId, undefined, undefined, { userAgent: 'Chrome' });
      const s2 = await createRefreshTokenSession(userId, undefined, undefined, { userAgent: 'Firefox' });

      // Revoke s2
      await revokeSessionById(userId, s2.familyId);

      const sessions = await getUserActiveSessions(userId);
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe(s1.familyId);

      // s2's refresh token cannot rotate
      await expect(rotateRefreshToken(s2.refreshToken)).rejects.toThrow();
    });

    it('should revoke all sessions for a user', async () => {
      const userId = 'user-revoke-all';

      await createRefreshTokenSession(userId);
      await createRefreshTokenSession(userId);

      await revokeAllUserSessions(userId);

      const sessions = await getUserActiveSessions(userId);
      expect(sessions.length).toBe(0);
    });
  });

  describe('Authentication Rate Limiting Guard', () => {
    it('should allow requests below limit and block with 429 when exceeded', async () => {
      const limiter = rateLimiter({
        windowSeconds: 60,
        maxRequests: 3,
        prefix: 'test_rl',
        keyGenerator: () => 'test-ip-123'
      });

      const mockRes = {
        setHeader: () => {}
      } as any;

      // Requests 1, 2, 3 should succeed
      for (let i = 0; i < 3; i++) {
        let nextCalled = false;
        await limiter({ ip: 'test-ip-123' } as any, mockRes, () => {
          nextCalled = true;
        });
        expect(nextCalled).toBe(true);
      }

      // Request 4 should be rejected with TooManyRequestsError
      let errorPassed: any = null;
      await limiter({ ip: 'test-ip-123' } as any, mockRes, (err?: any) => {
        errorPassed = err;
      });

      expect(errorPassed).toBeInstanceOf(TooManyRequestsError);
      expect(errorPassed.statusCode).toBe(429);
    });
  });
});
