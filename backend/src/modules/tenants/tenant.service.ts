import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/prisma';
import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { TenantRole, UserStatus } from '@prisma/client';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError
} from '../../core/errors/AppError';
import {
  UpdateTenantInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
  UpdateSettingsInput
} from './tenant.validation';

export class TenantService {
  /**
   * Retrieves all tenants/organizations the user is a member of
   */
  async getUserTenants(userId: string) {
    const memberships = await prisma.tenantMembership.findMany({
      where: { userId, status: UserStatus.ACTIVE },
      include: {
        tenant: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return memberships.map((m) => ({
      tenantId: m.tenantId,
      name: m.tenant.name,
      slug: m.tenant.slug,
      plan: m.tenant.plan,
      role: m.role,
      joinedAt: m.createdAt
    }));
  }

  /**
   * Retrieves full details for a specific tenant
   */
  async getTenantDetails(tenantId: string) {
    const tenantClient = createTenantPrismaClient(tenantId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            memberships: true,
            workspaces: true,
            projects: true
          }
        }
      }
    });

    if (!tenant) {
      throw new NotFoundError('Organization not found.');
    }

    const workspaces = await tenantClient.workspace.findMany();

    return {
      ...tenant,
      workspaces
    };
  }

  /**
   * Creates a new organization with initial workspace and assigns creator as OWNER
   */
  async createTenant(userId: string, name: string) {
    const orgName = name.trim();
    const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: orgName,
          slug,
          plan: 'STARTER',
          settings: {
            allowInvites: true,
            defaultRole: 'MEMBER',
            theme: 'dark'
          }
        }
      });

      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId,
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
          userId,
          role: 'ADMIN'
        }
      });

      return { tenant, membership, workspace };
    });
  }

  /**
   * Edits organization metadata (name, slug, settings)
   */
  async updateTenant(tenantId: string, input: UpdateTenantInput) {
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!existing) {
      throw new NotFoundError('Organization not found.');
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.settings ? { settings: input.settings } : {})
      }
    });

    return updated;
  }

  /**
   * Lists all members of the organization
   */
  async getMembers(tenantId: string) {
    const members = await prisma.tenantMembership.findMany({
      where: { tenantId, status: UserStatus.ACTIVE },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return members.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      email: m.user.email,
      fullName: m.user.fullName,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.createdAt
    }));
  }

  /**
   * Invites a new member to the organization
   */
  async inviteMember(tenantId: string, invitedById: string, input: InviteMemberInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if user is already an active member of this organization
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      const existingMembership = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: existingUser.id
          }
        }
      });

      if (existingMembership && existingMembership.status === UserStatus.ACTIVE) {
        throw new ConflictError('User is already an active member of this organization.');
      }
    }

    // Check if pending invitation exists
    const existingInvite = await prisma.tenantInvitation.findFirst({
      where: {
        tenantId,
        email: normalizedEmail,
        status: 'PENDING'
      }
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (existingInvite) {
      // Refresh existing invite
      const updated = await prisma.tenantInvitation.update({
        where: { id: existingInvite.id },
        data: {
          role: input.role,
          token,
          expiresAt,
          invitedById
        }
      });
      return {
        invitation: updated,
        invitationToken: token
      };
    }

    const invitation = await prisma.tenantInvitation.create({
      data: {
        tenantId,
        email: normalizedEmail,
        role: input.role,
        token,
        invitedById,
        status: 'PENDING',
        expiresAt
      }
    });

    return {
      invitation,
      invitationToken: token
    };
  }

  /**
   * Lists all pending invitations for an organization
   */
  async getInvitations(tenantId: string) {
    return await prisma.tenantInvitation.findMany({
      where: { tenantId, status: 'PENDING' },
      include: {
        invitedBy: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Accepts an invitation using its unique token
   */
  async acceptInvitation(userId: string, token: string) {
    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token },
      include: { tenant: true }
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BadRequestError('Invalid or expired organization invitation.');
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      }).catch(() => {});
      throw new BadRequestError('This invitation has expired. Please ask an admin to re-send it.');
    }

    // Check if user is already a member
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: invitation.tenantId,
          userId
        }
      }
    });

    if (existingMembership) {
      await prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });
      return {
        message: 'You are already a member of this organization.',
        tenant: invitation.tenant,
        membership: existingMembership
      };
    }

    // Atomically accept invite, add membership, and add to default workspace
    const result = await prisma.$transaction(async (tx) => {
      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });

      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: invitation.tenantId,
          userId,
          role: invitation.role,
          status: UserStatus.ACTIVE
        }
      });

      // Find general workspace
      const defaultWorkspace = await tx.workspace.findFirst({
        where: { tenantId: invitation.tenantId, slug: 'general' }
      });

      if (defaultWorkspace) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: defaultWorkspace.id,
            userId,
            role: 'MEMBER'
          }
        }).catch(() => {});
      }

      return { tenant: invitation.tenant, membership };
    });

    return {
      message: 'Invitation accepted successfully.',
      ...result
    };
  }

  /**
   * Removes a member from the organization
   */
  async removeMember(tenantId: string, memberId: string, actorUserId: string) {
    const membership = await prisma.tenantMembership.findUnique({
      where: { id: memberId }
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundError('Member record not found in this organization.');
    }

    // Safety guard: Cannot remove the last OWNER
    if (membership.role === TenantRole.OWNER) {
      const ownerCount = await prisma.tenantMembership.count({
        where: {
          tenantId,
          role: TenantRole.OWNER,
          status: UserStatus.ACTIVE
        }
      });

      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot remove the sole owner of the organization. Transfer ownership first.');
      }
    }

    await prisma.tenantMembership.delete({
      where: { id: memberId }
    });

    return { message: 'Member removed from organization successfully.' };
  }

  /**
   * Updates a member's role within the organization
   */
  async updateMemberRole(
    tenantId: string,
    memberId: string,
    input: UpdateMemberRoleInput,
    actorUserId: string
  ) {
    const membership = await prisma.tenantMembership.findUnique({
      where: { id: memberId }
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundError('Member record not found in this organization.');
    }

    // If downgrading an OWNER, verify there is at least one other OWNER
    if (membership.role === TenantRole.OWNER && input.role !== TenantRole.OWNER) {
      const ownerCount = await prisma.tenantMembership.count({
        where: {
          tenantId,
          role: TenantRole.OWNER,
          status: UserStatus.ACTIVE
        }
      });

      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot demote the sole owner of the organization.');
      }
    }

    const updated = await prisma.tenantMembership.update({
      where: { id: memberId },
      data: { role: input.role }
    });

    return updated;
  }

  /**
   * Retrieves organization settings
   */
  async getSettings(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        settings: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!tenant) {
      throw new NotFoundError('Organization not found.');
    }

    return tenant;
  }

  /**
   * Updates organization settings
   */
  async updateSettings(tenantId: string, input: UpdateSettingsInput) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: input.settings
      }
    });

    return tenant;
  }
}

export const tenantService = new TenantService();
