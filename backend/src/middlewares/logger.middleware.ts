import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime();
  const startTime = new Date().toISOString();

  // Capture response finish
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);

    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userId = req.user?.userId || 'anonymous';
    const tenantId = req.tenantContext?.tenantId || req.headers['x-tenant-id'] || 'no-tenant';

    // Status format
    const statusSign = statusCode >= 500 ? '🔥' : statusCode >= 400 ? '⚠️' : '✅';

    console.log(
      `[HTTP] ${startTime} ${statusSign} ${method} ${url} ${statusCode} - ${elapsedTimeInMs}ms | IP: ${ip} | User: ${userId} | Tenant: ${tenantId}`
    );
  });

  next();
}
