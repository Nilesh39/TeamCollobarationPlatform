import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import { redis } from '../../infrastructure/redis/redis.client';
import { sendSuccess } from '../../utils/response.util';

export class HealthController {
  async getHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbError = null;

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = 'degraded_or_offline';
      dbError = err.message;
    }

    const redisStatus = redis.isHealthy() ? 'connected' : 'in_memory_fallback';

    sendSuccess(
      res,
      {
        service: 'ai-work-os-backend',
        status: dbStatus === 'healthy' ? 'healthy' : 'operational_with_degraded_db',
        uptimeSeconds: Math.floor(process.uptime()),
        latencyMs: Date.now() - startTime,
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: {
            status: dbStatus,
            error: dbError
          },
          redis: {
            status: redisStatus
          }
        }
      },
      'Service health telemetry retrieved.'
    );
  }
}

export const healthController = new HealthController();
