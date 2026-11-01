import { Response } from 'express';

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export interface StandardApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  meta?: ApiResponseMeta;
}

/**
 * Sends a standardized success response.
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: Omit<ApiResponseMeta, 'timestamp'>
): Response {
  const responsePayload: StandardApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString()
    }
  };

  return res.status(statusCode).json(responsePayload);
}

/**
 * Sends a 201 Created standardized response.
 */
export function sendCreated<T>(
  res: Response,
  data?: T,
  message = 'Resource created successfully.'
): Response {
  return sendSuccess(res, data, message, 201);
}
