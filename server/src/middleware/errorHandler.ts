/**
 * Error handler middleware for Lambda functions
 */

import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export interface APIGatewayProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function handleError(error: any): APIGatewayProxyResult {
  logger.error('Request failed', error);

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      }),
    };
  }

  // Unknown error
  return {
    statusCode: 500,
    headers: getCorsHeaders(),
    body: JSON.stringify({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    }),
  };
}

export function successResponse(
  data: any,
  statusCode: number = 200,
  customHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      ...getCorsHeaders(),
      ...customHeaders,
    },
    body: JSON.stringify(data),
  };
}

export function getCorsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Configure for production
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
