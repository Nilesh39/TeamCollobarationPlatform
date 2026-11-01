import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // PostgreSQL
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/ai_work_os?schema=public'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default('redispassword'),
  REDIS_URL: z.string().optional(),

  // JWT & Security
  JWT_ACCESS_SECRET: z.string().min(16).default('ai_work_os_dev_super_secret_access_token_jwt_key_2026_xyz'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default('ai_work_os_dev_super_secret_refresh_token_jwt_key_2026_xyz'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16).default('ai_work_os_cookie_signing_secret_key_32_characters_minimum'),

  // AI Integration
  GEMINI_API_KEY: z.string().optional().default('')
});

export const env = envSchema.parse(process.env);
