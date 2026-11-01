import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('System API & Connectivity Integration Tests', () => {
  const app = createApp();

  it('GET / should return service info, version and available endpoints', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.service).toContain('AI WORK OS');
    expect(res.body.status).toBe('active');
    expect(res.body.apiVersion).toBe('v1');
    expect(res.body.endpoints).toBeDefined();
    expect(res.body.endpoints.health).toBe('/api/v1/health');
    expect(res.body.endpoints.workspaces).toBe('/api/v1/workspaces');
    expect(res.body.endpoints.tasks).toBe('/api/v1/tasks');
  });

  it('GET /api/v1/health should respond with operational status and service diagnostics', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.service).toBe('ai-work-os-backend');
    expect(res.body.data.services).toBeDefined();
    expect(res.body.data.services.redis).toBeDefined();
    expect(res.body.data.services.database).toBeDefined();
    expect(res.body.meta?.timestamp).toBeDefined();
  });

  it('Undefined route should return RFC-7807 404 Not Found problem details', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.type).toContain('rfc7807');
    expect(res.body.errorCode).toBe('NOT_FOUND');
    expect(res.body.path).toBe('/api/v1/unknown-endpoint');
  });
});
