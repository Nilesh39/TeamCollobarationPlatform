"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const password_util_1 = require("../src/utils/password.util");
const jwt_util_1 = require("../src/utils/jwt.util");
const redis_client_1 = require("../src/infrastructure/redis/redis.client");
const permissions_1 = require("../src/core/constants/permissions");
(0, vitest_1.describe)('Authentication & Cryptography Unit Tests', () => {
    (0, vitest_1.beforeEach)(async () => {
        await redis_client_1.redis.flushAll();
    });
    (0, vitest_1.describe)('Argon2id Password Hashing', () => {
        (0, vitest_1.it)('should securely hash password with Argon2id and verify correctly', async () => {
            const password = 'SecretPassword123!';
            const hash = await (0, password_util_1.hashPassword)(password);
            (0, vitest_1.expect)(hash).toBeDefined();
            (0, vitest_1.expect)(hash.startsWith('$argon2id$')).toBe(true);
            const isValid = await (0, password_util_1.verifyPassword)(password, hash);
            (0, vitest_1.expect)(isValid).toBe(true);
            const isInvalid = await (0, password_util_1.verifyPassword)('WrongPassword123!', hash);
            (0, vitest_1.expect)(isInvalid).toBe(false);
        });
    });
    (0, vitest_1.describe)('JWT Access Token Lifecycle', () => {
        (0, vitest_1.it)('should sign and verify short-lived access tokens with proper claims', () => {
            const payload = {
                userId: '11111111-1111-1111-1111-111111111111',
                email: 'user@example.com',
                tenantId: '22222222-2222-2222-2222-222222222222',
                role: permissions_1.TenantRole.ADMIN
            };
            const token = (0, jwt_util_1.signAccessToken)(payload);
            (0, vitest_1.expect)(typeof token).toBe('string');
            const decoded = (0, jwt_util_1.verifyAccessToken)(token);
            (0, vitest_1.expect)(decoded.userId).toBe(payload.userId);
            (0, vitest_1.expect)(decoded.email).toBe(payload.email);
            (0, vitest_1.expect)(decoded.tenantId).toBe(payload.tenantId);
            (0, vitest_1.expect)(decoded.role).toBe(permissions_1.TenantRole.ADMIN);
        });
        (0, vitest_1.it)('should throw an error when an invalid token is provided', () => {
            (0, vitest_1.expect)(() => (0, jwt_util_1.verifyAccessToken)('invalid.jwt.token')).toThrow();
        });
    });
    (0, vitest_1.describe)('Redis-Backed Refresh Token Rotation & Family Reuse Detection', () => {
        (0, vitest_1.it)('should issue refresh token, rotate it, and allow valid continuation', async () => {
            const userId = 'user-abc-123';
            const tenantId = 'tenant-xyz-789';
            // 1. Initial session creation
            const { refreshToken: token1, familyId } = await (0, jwt_util_1.createRefreshTokenSession)(userId, tenantId);
            (0, vitest_1.expect)(token1).toBeDefined();
            (0, vitest_1.expect)(familyId).toBeDefined();
            // 2. Rotate token
            const rotation1 = await (0, jwt_util_1.rotateRefreshToken)(token1);
            (0, vitest_1.expect)(rotation1.userId).toBe(userId);
            (0, vitest_1.expect)(rotation1.newRefreshToken).toBeDefined();
            (0, vitest_1.expect)(rotation1.newRefreshToken).not.toBe(token1);
            // 3. Rotate new token again
            const rotation2 = await (0, jwt_util_1.rotateRefreshToken)(rotation1.newRefreshToken);
            (0, vitest_1.expect)(rotation2.userId).toBe(userId);
            (0, vitest_1.expect)(rotation2.newRefreshToken).toBeDefined();
        });
        (0, vitest_1.it)('should detect token replay/reuse and revoke entire token family', async () => {
            const userId = 'user-replay-target';
            const { refreshToken: token1, familyId } = await (0, jwt_util_1.createRefreshTokenSession)(userId);
            // Legitimate client rotates token1 -> gets token2
            const rotation = await (0, jwt_util_1.rotateRefreshToken)(token1);
            const token2 = rotation.newRefreshToken;
            // Malicious actor attempts to replay already-consumed token1!
            await (0, vitest_1.expect)((0, jwt_util_1.rotateRefreshToken)(token1)).rejects.toThrow(/reuse detected/i);
            // Legitimate client with token2 should now also be locked out because the family was revoked
            await (0, vitest_1.expect)((0, jwt_util_1.rotateRefreshToken)(token2)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=auth.test.js.map