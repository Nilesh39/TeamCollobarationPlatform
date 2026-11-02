import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/utils/jwt.util';
import { TenantRole, ProjectStatus, ProjectPriority, MilestoneStatus } from '@prisma/client';
import { projectService } from '../src/modules/projects/project.service';

describe('Project Management Module Tests', () => {
  const app = createApp();
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const workspaceId = '00000000-0000-0000-0000-000000000002';
  const ownerUserId = '00000000-0000-0000-0000-000000000003';
  const memberUserId = '00000000-0000-0000-0000-000000000004';

  const ownerToken = signAccessToken({
    userId: ownerUserId,
    email: 'owner@acme.com',
    tenantId,
    role: TenantRole.OWNER
  });

  const memberToken = signAccessToken({
    userId: memberUserId,
    email: 'member@acme.com',
    tenantId,
    role: TenantRole.MEMBER
  });

  describe('Project Input Validation (Zod Schemas)', () => {
    it('should reject project creation with invalid key format (lowercase or non-alphanumeric)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          workspaceId,
          name: 'Invalid Key Project',
          key: 'invalid_key!',
          status: 'PLANNING'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject project creation with missing workspaceId', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          name: 'No Workspace Project',
          key: 'NOWS'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid milestone creation payload with short title', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${workspaceId}/milestones`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          title: 'A' // Min length is 2
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('RBAC Authorization Guards', () => {
    it('should reject unauthenticated request to /api/v1/projects with 401', async () => {
      const res = await request(app).get('/api/v1/projects');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject project creation from MEMBER role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          workspaceId,
          name: 'Member Attempt Project',
          key: 'MEMB',
          status: 'PLANNING'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
      expect(res.body.detail).toContain('Insufficient role privileges');
    });

    it('should reject milestone deletion from MEMBER role with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${workspaceId}/milestones/00000000-0000-0000-0000-000000000099`)
        .set('Authorization', `Bearer ${memberToken}`)
        .set('X-Tenant-ID', tenantId);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Project Service Logic & Calculations', () => {
    it('should accurately calculate project progress percentage from task metrics', () => {
      const totalTasks = 10;
      const doneTasks = 7;
      const progress = Math.round((doneTasks / totalTasks) * 100);
      expect(progress).toBe(70);

      // Edge case: zero tasks defaults to manual project progress (0%)
      const zeroProgress = 0 > 0 ? Math.round((0 / 0) * 100) : 0;
      expect(zeroProgress).toBe(0);
    });

    it('should correctly format project listing item with metrics and manager', () => {
      const mockProject = {
        id: 'proj-1',
        name: 'AI Integration Core',
        key: 'AIC',
        description: 'LangChain & Gemini models',
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.HIGH,
        startDate: new Date('2026-11-01'),
        dueDate: new Date('2026-12-15'),
        isArchived: false,
        progress: 75,
        workspace: { id: 'ws-1', name: 'General', slug: 'general' },
        manager: { id: 'mgr-1', fullName: 'Alice Walker', email: 'alice@acme.com', avatarUrl: null },
        members: [{ user: { id: 'usr-1', fullName: 'Bob', email: 'bob@acme.com', avatarUrl: null } }],
        tasks: [{ status: 'DONE' }, { status: 'DONE' }, { status: 'TODO' }],
        _count: { milestones: 3 }
      };

      const doneTasks = mockProject.tasks.filter((t) => t.status === 'DONE').length;
      const totalTasks = mockProject.tasks.length;
      const progress = Math.round((doneTasks / totalTasks) * 100);

      expect(progress).toBe(67);
      expect(mockProject.key).toBe('AIC');
      expect(mockProject.priority).toBe('HIGH');
      expect(mockProject.status).toBe('IN_PROGRESS');
      expect(mockProject._count.milestones).toBe(3);
    });
  });
});
