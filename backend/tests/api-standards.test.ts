import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('API Standards, Validation & Security Integration Tests', () => {
  const app = createApp();

  describe('CORS Configuration', () => {
    it('should include CORS headers and allow configured origin', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Request Validation & Error Standards (Zod + RFC-7807)', () => {
    it('should reject invalid registration payload with 400 and structured field details', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email-address',
        password: '123', // Too short and lacking complexity
        fullName: 'A' // Too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.type).toContain('rfc7807');
      expect(Array.isArray(res.body.details)).toBe(true);

      const fieldNames = res.body.details.map((d: any) => d.field);
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('password');
      expect(fieldNames).toContain('fullName');
    });

    it('should reject invalid forgot-password payload with 400', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'not-an-email'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid reset-password payload with 400', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: '',
        newPassword: 'weak'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject malformed JSON syntax with 400 and RFC-7807', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"badJson": invalid}');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.title).toBe('Malformed JSON');
    });
  });

  describe('Protected Endpoints & Authorization Gates', () => {
    it('should reject unauthenticated request to /api/v1/workspaces with 401', async () => {
      const res = await request(app).get('/api/v1/workspaces');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated request to /api/v1/tasks with 401', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request to /api/v1/documents with 401', async () => {
      const res = await request(app).get('/api/v1/documents');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request to /api/v1/agents with 401', async () => {
      const res = await request(app).get('/api/v1/agents');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request to /api/v1/tenants with 401', async () => {
      const res = await request(app).get('/api/v1/tenants');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request to /api/v1/tenants/current with 401', async () => {
      const res = await request(app).get('/api/v1/tenants/current');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
