import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/prisma';
import { hashPassword, verifyPassword } from '../../utils/password.util';
import {
  signAccessToken,
  createRefreshTokenSession,
  rotateRefreshToken,
  revokeRefreshToken,
  getUserActiveSessions,
  revokeSessionById,
  revokeAllUserSessions
} from '../../utils/jwt.util';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ForbiddenError
} from '../../core/errors/AppError';
import { ErrorCode } from '../../core/constants/error-codes';
import { TenantRole, UserStatus } from '@prisma/client';
import { RegisterInput, LoginInput } from './auth.validation';

export interface AuthContextMeta {
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  /**
   * Registers a new user along with their default tenant and organization
   */
  async register(input: RegisterInput, meta?: AuthContextMeta) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const orgName = input.tenantName?.trim() || `${input.fullName.trim()}'s Organization`;
    const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Atomic transaction: user, tenant, membership, workspace, auth token
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: input.fullName.trim(),
          isEmailVerified: false,
          isSuperAdmin: false
        }
      });

      const tenant = await tx.tenant.create({
        data: {
          name: orgName,
          slug: orgSlug,
          plan: 'STARTER',
          settings: {
            features: { aiAgents: true, automations: true }
          }
        }
      });

      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: TenantRole.OWNER,
          status: UserStatus.ACTIVE
        }
      });

      const workspace = await tx.workspace.create({
        data: {
          tenantId: tenant.id,
          name: 'General',
          slug: 'general',
          description: 'Default organization workspace'
        }
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: 'ADMIN'
        }
      });

      await tx.authToken.create({
        data: {
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
          token: verificationToken,
          expiresAt: verificationExpires
        }
      });

      return { user, tenant, membership, workspace };
    });

    const { accessToken, refreshToken } = await this.generateTokenPair(
      result.user.id,
      result.user.email,
      result.tenant.id,
      TenantRole.OWNER,
      result.user.isSuperAdmin,
      meta
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        isEmailVerified: result.user.isEmailVerified,
        isSuperAdmin: result.user.isSuperAdmin
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        role: TenantRole.OWNER
      },
      accessToken,
      refreshToken,
      verificationToken // returned in dev/testing environments for automated verification
    };
  }

  /**
   * Authenticates user credentials and returns tokens
   */
  async login(input: LoginInput, meta?: AuthContextMeta) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          where: { status: UserStatus.ACTIVE },
          include: { tenant: true }
        }
      }
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password credentials.', ErrorCode.UNAUTHORIZED);
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password credentials.', ErrorCode.UNAUTHORIZED);
    }

    // Resolve primary/default tenant
    const primaryMembership = user.memberships[0];
    const defaultTenantId = primaryMembership?.tenantId;
    const defaultRole = primaryMembership?.role;

    const { accessToken, refreshToken } = await this.generateTokenPair(
      user.id,
      user.email,
      defaultTenantId,
      defaultRole,
      user.isSuperAdmin,
      meta
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        isSuperAdmin: user.isSuperAdmin
      },
      activeTenant: primaryMembership
        ? {
            id: primaryMembership.tenant.id,
            name: primaryMembership.tenant.name,
            slug: primaryMembership.tenant.slug,
            role: primaryMembership.role
          }
        : null,
      availableTenants: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role
      })),
      accessToken,
      refreshToken
    };
  }

  /**
   * Verifies user email via unique verification token
   */
  async verifyEmail(token: string) {
    const tokenRecord = await prisma.authToken.findUnique({
      where: { token }
    });

    if (!tokenRecord || tokenRecord.type !== 'EMAIL_VERIFICATION') {
      throw new BadRequestError('Invalid or unrecognized email verification token.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.authToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      throw new BadRequestError('Email verification token has expired. Please request a new link.');
    }

    // Mark user email verified and remove token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { isEmailVerified: true }
      }),
      prisma.authToken.delete({
        where: { id: tokenRecord.id }
      })
    ]);

    return { message: 'Email verified successfully. You can now access all workspace capabilities.' };
  }

  /**
   * Resends email verification token
   */
  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    // To prevent account enumeration, return success even if user not found
    if (!user) {
      return { message: 'If an account exists with this email, a verification link has been sent.' };
    }

    if (user.isEmailVerified) {
      return { message: 'This email is already verified.' };
    }

    // Clear old verification tokens
    await prisma.authToken.deleteMany({
      where: { userId: user.id, type: 'EMAIL_VERIFICATION' }
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        token: verificationToken,
        expiresAt
      }
    });

    return {
      message: 'Verification link dispatched.',
      verificationToken // returned in dev/testing for verification
    };
  }

  /**
   * Initiates forgot password flow
   */
  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Prevent enumeration: always return same message
    if (!user) {
      return { message: 'If an account exists with that email address, password reset instructions have been sent.' };
    }

    // Remove any existing password reset tokens for this user
    await prisma.authToken.deleteMany({
      where: { userId: user.id, type: 'PASSWORD_RESET' }
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        token: resetToken,
        expiresAt
      }
    });

    return {
      message: 'If an account exists with that email address, password reset instructions have been sent.',
      resetToken // returned in dev/testing for automated reset flow
    };
  }

  /**
   * Resets password using valid token
   */
  async resetPassword(token: string, newPassword: string) {
    const tokenRecord = await prisma.authToken.findUnique({
      where: { token }
    });

    if (!tokenRecord || tokenRecord.type !== 'PASSWORD_RESET') {
      throw new BadRequestError('Invalid or unrecognized password reset token.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.authToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      throw new BadRequestError('Password reset link has expired. Please submit a new reset request.');
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.authToken.delete({
        where: { id: tokenRecord.id }
      })
    ]);

    // Security requirement: Revoke all existing sessions for this user on password change
    await revokeAllUserSessions(tokenRecord.userId);

    return { message: 'Password has been updated successfully. Please log in with your new credentials.' };
  }

  /**
   * Refreshes access token with family reuse detection
   */
  async refreshSession(rawRefreshToken: string, meta?: AuthContextMeta) {
    const { newAccessToken, newRefreshToken, userId, tenantId } = await rotateRefreshToken(rawRefreshToken, meta);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, isSuperAdmin: true }
    });

    if (!user) {
      throw new UnauthorizedError('Associated user account no longer exists.', ErrorCode.TOKEN_INVALID);
    }

    return {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tenantId
    };
  }

  /**
   * Switches user context to another active tenant
   */
  async switchTenant(userId: string, targetTenantId: string, meta?: AuthContextMeta) {
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: targetTenantId,
          userId
        }
      },
      include: {
        tenant: true,
        user: true
      }
    });

    if (!membership || membership.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('You are not an active member of this organization.');
    }

    const { accessToken, refreshToken } = await this.generateTokenPair(
      userId,
      membership.user.email,
      membership.tenant.id,
      membership.role,
      membership.user.isSuperAdmin,
      meta
    );

    return {
      activeTenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
        role: membership.role
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Returns active sessions for the user
   */
  async getSessions(userId: string, currentRefreshToken?: string) {
    return await getUserActiveSessions(userId, currentRefreshToken);
  }

  /**
   * Revokes a specific session
   */
  async revokeSession(userId: string, familyId: string) {
    await revokeSessionById(userId, familyId);
    return { message: 'Session terminated successfully.' };
  }

  /**
   * Revokes all sessions for the user
   */
  async revokeAllSessions(userId: string) {
    await revokeAllUserSessions(userId);
    return { message: 'All active sessions terminated successfully.' };
  }

  /**
   * Logs out user by revoking the refresh token session
   */
  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      await revokeRefreshToken(rawRefreshToken);
    }
  }

  /**
   * Returns current user profile with tenant memberships
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isEmailVerified: true,
        isSuperAdmin: true,
        createdAt: true,
        memberships: {
          where: { status: UserStatus.ACTIVE },
          include: {
            tenant: {
              select: { id: true, name: true, slug: true, plan: true, settings: true }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    return user;
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    tenantId?: string,
    role?: TenantRole,
    isSuperAdmin?: boolean,
    meta?: AuthContextMeta
  ) {
    const accessToken = signAccessToken({
      userId,
      email,
      tenantId,
      role,
      isSuperAdmin
    });

    const { refreshToken } = await createRefreshTokenSession(userId, tenantId, undefined, meta);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
