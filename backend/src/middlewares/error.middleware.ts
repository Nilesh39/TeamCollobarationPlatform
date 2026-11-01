import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/AppError';
import { ErrorCode } from '../core/constants/error-codes';
import { env } from '../config/env.config';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      type: 'https://tools.ietf.org/html/rfc7807',
      title: err.name,
      detail: err.message,
      errorCode: err.errorCode,
      details: err.details,
      timestamp,
      path: req.originalUrl
    });
    return;
  }

  // Handle SyntaxError for bad JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      type: 'https://tools.ietf.org/html/rfc7807',
      title: 'Malformed JSON',
      detail: 'The request body contains invalid JSON.',
      errorCode: ErrorCode.VALIDATION_ERROR,
      timestamp,
      path: req.originalUrl
    });
    return;
  }

  // Fallback for unhandled unexpected internal errors
  console.error('[Unhandled Internal Error]:', err);

  res.status(500).json({
    success: false,
    statusCode: 500,
    type: 'https://tools.ietf.org/html/rfc7807',
    title: 'Internal Server Error',
    detail: env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    timestamp,
    path: req.originalUrl
  });
}
