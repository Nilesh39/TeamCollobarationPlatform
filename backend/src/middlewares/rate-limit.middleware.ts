import { Request, Response, NextFunction } from 'express';
import { redis } from '../infrastructure/redis/redis.client';
import { TooManyRequestsError } from '../core/errors/AppError';
import { ErrorCode } from '../core/constants/error-codes';

export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  prefix?: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowSeconds = 60,
    maxRequests = 10,
    prefix = 'rl',
    message = 'Too many requests. Please try again later.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket.remoteAddress || 'unknown';
    }
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientKey = keyGenerator(req);
      const redisKey = `${prefix}:${clientKey}`;

      const currentCountStr = await redis.get(redisKey);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

      if (currentCount >= maxRequests) {
        res.setHeader('Retry-After', windowSeconds.toString());
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        return next(new TooManyRequestsError(message, ErrorCode.RATE_LIMIT_EXCEEDED));
      }

      const newCount = currentCount + 1;
      await redis.set(redisKey, newCount.toString(), windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - newCount).toString());

      next();
    } catch {
      // In case of error in rate limiter backend, fail open so legitimate traffic is not halted
      next();
    }
  };
}

export const authRateLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 30,
  prefix: 'rl:auth',
  message: 'Too many authentication attempts. Please try again in 1 minute.'
});

export const passwordResetRateLimiter = rateLimiter({
  windowSeconds: 300,
  maxRequests: 5,
  prefix: 'rl:pwd_reset',
  message: 'Too many password reset requests. Please wait 5 minutes before trying again.'
});
