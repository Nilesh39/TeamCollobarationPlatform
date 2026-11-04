import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/utils/jwt.util';
import { TenantRole, ProjectPriority, TaskPriority } from '@prisma/client';
import { geminiPlannerClient } from '../src/modules/ai-planner/gemini.client';
import {
  generatePlanSchema,
  structuredProjectPlanSchema
} from '../src/modules/ai-planner/ai-planner.validation';

describe('AI Project Planner & Gemini Integration Tests', () => {
  const app = createApp();
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const workspaceId = '00000000-0000-0000-0000-000000000010';
  const ownerUserId = '00000000-0000-0000-0000-000000000003';
  const memberUserId = '00000000-0000-0000-0000-000000000006';
  const guestUserId = '00000000-0000-0000-0000-000000000007';

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

  const guestToken = signAccessToken({
    userId: guestUserId,
    email: 'guest@acme.com',
    tenantId,
    role: TenantRole.GUEST
  });

  describe('Zod Schema Validation', () => {
    it('should reject generate plan request with prompt shorter than 5 chars', () => {
      const parsed = generatePlanSchema.safeParse({
        prompt: 'Shop',
        workspaceId
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject generate plan request with invalid workspace UUID', () => {
      const parsed = generatePlanSchema.safeParse({
        prompt: 'Create an e-commerce website using React, Node.js and PostgreSQL',
        workspaceId: 'not-a-valid-uuid'
      });
      expect(parsed.success).toBe(false);
    });

    it('should accept valid generate plan payload with default targetDays', () => {
      const parsed = generatePlanSchema.safeParse({
        prompt: 'Create an e-commerce website using React, Node.js and PostgreSQL within 30 days.',
        workspaceId
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.targetDays).toBe(30);
        expect(parsed.data.model).toBe('gemini-1.5-flash');
      }
    });
  });

  describe('Natural Language Requirement Decomposition (Multiple Project Prompts)', () => {
    it('should synthesize a structured e-commerce plan with React, Node.js, and PostgreSQL', async () => {
      const prompt = 'Create an e-commerce website using React, Node.js and PostgreSQL within 30 days.';
      const result = await geminiPlannerClient.generatePlan(prompt, 30);

      expect(result.plan).toBeDefined();
      expect(result.plan.projectOverview.name).toContain('E-Commerce');
      expect(result.plan.projectOverview.key).toBe('ECOM');
      expect(result.plan.projectOverview.estimatedTotalDays).toBe(30);

      // Verify 10 required components
      expect(result.plan.projectOverview.techStack.length).toBeGreaterThan(0);
      expect(result.plan.phases.length).toBeGreaterThanOrEqual(3);
      expect(result.plan.milestones.length).toBeGreaterThanOrEqual(3);
      expect(result.plan.tasks.length).toBeGreaterThanOrEqual(5);
      expect(result.plan.dependencies.length).toBeGreaterThanOrEqual(2);
      expect(result.plan.teamRoles.length).toBeGreaterThanOrEqual(2);
      expect(result.plan.risks.length).toBeGreaterThanOrEqual(2);

      // Verify subtasks exist within tasks
      const tasksWithSubtasks = result.plan.tasks.filter((t) => t.subtasks && t.subtasks.length > 0);
      expect(tasksWithSubtasks.length).toBeGreaterThan(0);

      // Verify token tracking
      expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
      expect(result.tokenUsage.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should synthesize a healthcare telemedicine portal with HIPAA compliance and WebRTC', async () => {
      const prompt = 'Build a Healthcare Patient Portal with HIPAA compliance, WebRTC tele-consultations in 60 days.';
      const result = await geminiPlannerClient.generatePlan(prompt, 60);

      expect(result.plan.projectOverview.key).toBe('CARE');
      expect(result.plan.projectOverview.estimatedTotalDays).toBe(60);
      expect(result.plan.projectOverview.suggestedBudgetTier).toBe('MEDIUM');
      expect(result.plan.tasks.some((t) => t.labels.includes('Security') || t.labels.includes('RealTime'))).toBe(true);
    });

    it('should synthesize a collaborative code editor workspace with WebSockets and Docker', async () => {
      const prompt = 'Develop a real-time collaborative code editor with WebSockets and Docker in 45 days.';
      const result = await geminiPlannerClient.generatePlan(prompt, 45);

      expect(result.plan.projectOverview.key).toBe('COLL');
      expect(result.plan.projectOverview.estimatedTotalDays).toBe(45);
      expect(result.plan.tasks.some((t) => t.title.toLowerCase().includes('real-time') || t.title.toLowerCase().includes('containerization'))).toBe(true);
    });
  });

  describe('API Endpoints & Background Processing', () => {
    it('should generate plan synchronously with ?sync=true query param', async () => {
      const res = await request(app)
        .post('/api/v1/ai-planner/generate?sync=true')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          prompt: 'Create an e-commerce website using React, Node.js and PostgreSQL within 30 days.',
          workspaceId,
          targetDays: 30
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.result.plan.projectOverview.key).toBe('ECOM');
      expect(res.body.data.result.tokenUsage).toBeDefined();
    });

    it('should start background generation and return 202 Accepted with jobId', async () => {
      const res = await request(app)
        .post('/api/v1/ai-planner/generate')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          prompt: 'Build a high-throughput crypto payment gateway with automated reconciliation.',
          workspaceId,
          targetDays: 45
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobId).toBeDefined();
      expect(res.body.data.jobId).toMatch(/^job-/);

      // Verify job status endpoint
      const jobRes = await request(app)
        .get(`/api/v1/ai-planner/jobs/${res.body.data.jobId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId);

      expect(jobRes.status).toBe(200);
      expect(jobRes.body.data.id).toBe(res.body.data.jobId);
    });

    it('should reject plan approval from GUEST role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/ai-planner/approve')
        .set('Authorization', `Bearer ${guestToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          workspaceId,
          approvedPlan: {
            project: {
              name: 'Guest Attempt Project',
              key: 'GST',
              description: 'Should fail'
            },
            milestones: [],
            tasks: []
          }
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow plan approval by OWNER and persist project with tasks and milestones', async () => {
      const res = await request(app)
        .post('/api/v1/ai-planner/approve')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          workspaceId,
          approvedPlan: {
            project: {
              name: 'Approved E-Commerce Platform',
              key: 'AECP',
              description: 'AI-generated plan approved by organization owner.',
              priority: 'HIGH'
            },
            milestones: [
              { tempId: 'ms-1', title: 'Milestone 1: DB & Auth Blueprint' },
              { tempId: 'ms-2', title: 'Milestone 2: Core Storefront APIs' }
            ],
            tasks: [
              {
                tempId: 't-1',
                milestoneTempId: 'ms-1',
                title: 'Design PostgreSQL Schema',
                description: 'Prisma models for products, carts, orders.',
                priority: 'URGENT',
                estimatedHours: 8,
                labels: ['Database', 'PostgreSQL'],
                subtasks: [{ title: 'Write Prisma schema' }]
              },
              {
                tempId: 't-2',
                milestoneTempId: 'ms-2',
                title: 'Build Stripe Checkout Gateway',
                description: 'Webhook listener and payment intent API.',
                priority: 'HIGH',
                estimatedHours: 12,
                dependencies: ['t-1'],
                subtasks: [{ title: 'Test Stripe webhooks' }]
              }
            ]
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Approved E-Commerce Platform');
      expect(res.body.data.project.key).toBe('AECP');
      expect(res.body.data.tasksCount).toBe(2);
      expect(res.body.data.milestonesCount).toBe(2);
    });
  });
});
