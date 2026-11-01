import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { v1Router } from './routes/v1.router';
import { NotFoundError } from './core/errors/AppError';

export function createApp(): Express {
  const app = express();

  // Security & HTTP Headers
  app.use(helmet());

  // CORS Policy
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
    })
  );

  // Request Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request Logging Middleware
  app.use(requestLogger);

  // Service Root
  app.get('/', (req, res) => {
    res.json({
      service: 'AI WORK OS Backend API',
      version: '1.0.0',
      status: 'active',
      apiVersion: 'v1',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        tenants: '/api/v1/tenants',
        workspaces: '/api/v1/workspaces',
        projects: '/api/v1/projects',
        tasks: '/api/v1/tasks',
        documents: '/api/v1/documents',
        agents: '/api/v1/agents'
      }
    });
  });

  // API Version 1
  app.use('/api/v1', v1Router);

  // Catch-all 404 Route
  app.use((req, res, next) => {
    next(new NotFoundError(`Resource ${req.method} ${req.originalUrl} not found.`));
  });

  // Centralized RFC-7807 Error Handler
  app.use(errorHandler);

  return app;
}
