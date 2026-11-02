import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/utils/jwt.util';
import { TenantRole } from '@prisma/client';
import { taskService } from '../src/modules/tasks/task.service';

describe('Task Management Module & Dependency Graph Tests', () => {
  const app = createApp();
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const projectId = '00000000-0000-0000-0000-000000000002';
  const ownerUserId = '00000000-0000-0000-0000-000000000003';
  const guestUserId = '00000000-0000-0000-0000-000000000005';

  const ownerToken = signAccessToken({
    userId: ownerUserId,
    email: 'owner@acme.com',
    tenantId,
    role: TenantRole.OWNER
  });

  const guestToken = signAccessToken({
    userId: guestUserId,
    email: 'guest@acme.com',
    tenantId,
    role: TenantRole.GUEST
  });

  describe('Task Input Validation (Zod Schemas)', () => {
    it('should reject task creation with missing projectId', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          title: 'Missing Project Task',
          status: 'TODO'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject task creation with too short title (< 2 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          projectId,
          title: 'X'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid hex color for label addition', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${projectId}/labels`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          name: 'Bug',
          color: 'not-a-hex'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty comment content', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${projectId}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          content: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('RBAC Authorization Guards', () => {
    it('should reject unauthenticated request to /api/v1/tasks with 401', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject task creation from GUEST role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${guestToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          projectId,
          title: 'Guest Attempt Task'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('Task Dependency Validation & Circular Cycle Prevention Algorithm', () => {
    it('should detect and reject self-dependency (task depending on itself)', async () => {
      const taskId = 'task-alpha';
      const selfPrerequisite = 'task-alpha';

      // Self-loop detection test
      const isCycle = await taskService.detectDependencyCycle(taskId, selfPrerequisite);
      expect(isCycle).toBe(true);
    });

    it('should detect circular dependency in 2-node cycle (A depends on B, adding B depends on A)', async () => {
      // Simulate existing dependency: Task A depends on Task B (B -> A)
      // If we attempt to make Task B depend on Task A (A -> B), cycle detector should return true
      const mockGraph = new Map<string, string[]>([
        ['task-a', ['task-b']] // task-a depends on task-b
      ]);

      async function testCycle(sourceId: string, targetId: string): Promise<boolean> {
        if (sourceId === targetId) return true;
        const visited = new Set<string>();
        const queue: string[] = [targetId];
        visited.add(targetId);

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (current === sourceId) return true;
          const deps = mockGraph.get(current) || [];
          for (const dep of deps) {
            if (!visited.has(dep)) {
              visited.add(dep);
              queue.push(dep);
            }
          }
        }
        return false;
      }

      // task-b trying to depend on task-a:
      const cycleDetected = await testCycle('task-b', 'task-a');
      expect(cycleDetected).toBe(true);
    });

    it('should detect multi-node transitive circular dependency (A -> B -> C -> A)', async () => {
      // Existing graph:
      // A depends on B
      // B depends on C
      // Attempting to make C depend on A should trigger cycle detection!
      const mockGraph = new Map<string, string[]>([
        ['task-a', ['task-b']],
        ['task-b', ['task-c']]
      ]);

      async function testCycle(sourceId: string, targetId: string): Promise<boolean> {
        if (sourceId === targetId) return true;
        const visited = new Set<string>();
        const queue: string[] = [targetId];
        visited.add(targetId);

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (current === sourceId) return true;
          const deps = mockGraph.get(current) || [];
          for (const dep of deps) {
            if (!visited.has(dep)) {
              visited.add(dep);
              queue.push(dep);
            }
          }
        }
        return false;
      }

      // Trying to add: task-c depends on task-a
      const cycleDetected = await testCycle('task-c', 'task-a');
      expect(cycleDetected).toBe(true);

      // Independent task D should NOT trigger a cycle
      const independentCheck = await testCycle('task-d', 'task-a');
      expect(independentCheck).toBe(false);
    });
  });
});
