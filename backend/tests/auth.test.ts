import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password.util';
import {
  signAccessToken,
  verifyAccessToken,
  createRefreshTokenSession,
  rotateRefreshToken,
  revokeRefreshTokenFamily
} from '../src/utils/jwt.util';
import { redis } from '../src/infrastructure/redis/redis.client';
import { TenantRole } from '../src/core/constants/permissions';

describe('Authentication & Cryptography Unit Tests', () => {
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

  describe('JWT Access Token Lifecycle', () => {
    it('should sign and verify short-lived access tokens with proper claims', () => {
      const payload = {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'user@example.com',
        tenantId: '22222222-2222-2222-2222-222222222222',
        role: TenantRole.ADMIN
      };

      const token = signAccessToken(payload);
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.tenantId).toBe(payload.tenantId);
      expect(decoded.role).toBe(TenantRole.ADMIN);
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
      const { refreshToken: token1, familyId } = await createRefreshTokenSession(userId);

      // Legitimate client rotates token1 -> gets token2
      const rotation = await rotateRefreshToken(token1);
      const token2 = rotation.newRefreshToken;

      // Malicious actor attempts to replay already-consumed token1!
      await expect(rotateRefreshToken(token1)).rejects.toThrow(/reuse detected/i);

      // Legitimate client with token2 should now also be locked out because the family was revoked
      await expect(rotateRefreshToken(token2)).rejects.toThrow();
    });
  });
});
