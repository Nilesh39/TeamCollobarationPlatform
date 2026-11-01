import { prisma } from '../../infrastructure/database/prisma';
import { hashPassword, verifyPassword } from '../../utils/password.util';
import { signAccessToken, createRefreshTokenSession, rotateRefreshToken, revokeRefreshToken } from '../../utils/jwt.util';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../core/errors/AppError';
import { ErrorCode } from '../../core/constants/error-codes';
import { TenantRole, UserStatus } from '@prisma/client';
import { RegisterInput, LoginInput } from './auth.validation';

export class AuthService {
  /**
   * Registers a new user along with their default tenant and organization
   */
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const orgName = input.tenantName || `${input.fullName}'s Organization`;
    const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    // Atomic transaction: create user, tenant, membership, and initial workspace
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          fullName: input.fullName,
          isEmailVerified: false
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

      return { user, tenant, membership, workspace };
    });

    const { accessToken, refreshToken } = await this.generateTokenPair(
      result.user.id,
      result.user.email,
      result.tenant.id,
      TenantRole.OWNER
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        role: TenantRole.OWNER
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Authenticates user credentials and returns tokens
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
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
      defaultRole
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
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
   * Refreshes access token with family reuse detection
   */
  async refreshSession(rawRefreshToken: string) {
    const { newAccessToken, newRefreshToken, userId, tenantId } = await rotateRefreshToken(rawRefreshToken);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true }
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
        createdAt: true,
        memberships: {
          where: { status: UserStatus.ACTIVE },
          include: {
            tenant: {
              select: { id: true, name: true, slug: true, plan: true }
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
    role?: TenantRole
  ) {
    const accessToken = signAccessToken({
      userId,
      email,
      tenantId,
      role
    });

    const { refreshToken } = await createRefreshTokenSession(userId, tenantId);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
