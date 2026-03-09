/**
 * Rate limiting middleware for Lambda functions
 * 
 * Uses DynamoDB to track request counts per IP/API key
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { config } from '../config/environment';
import { dynamoDBClient } from '../config/aws';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  message?: string;        // Custom error message
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;      // Don't count failed requests
}

/**
 * Rate limit record in DynamoDB
 */
interface RateLimitRecord {
  pk: string;              // "RATE_LIMIT#{identifier}"
  sk: string;              // "ENDPOINT#{endpoint}"
  count: number;           // Request count
  windowStart: number;     // Window start timestamp
  ttl: number;             // TTL for auto-cleanup
}

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests, please try again later',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * Rate limit table name
 */
const RATE_LIMIT_TABLE = process.env.DYNAMODB_RATE_LIMIT_TABLE || 'knowledge-map-rate-limits-dev';

/**
 * Extract identifier from event (IP or API key)
 */
function getIdentifier(event: APIGatewayProxyEvent): string {
  // Prefer API key if available
  const apiKey = event.headers['X-API-Key'] || event.headers['x-api-key'];
  if (apiKey) {
    return `key:${apiKey}`;
  }

  // Fall back to IP address
  const ip = 
    event.headers['X-Forwarded-For'] || 
    event.headers['x-forwarded-for'] ||
    event.requestContext.identity.sourceIp ||
    'unknown';

  return `ip:${ip.split(',')[0].trim()}`;
}

/**
 * Get endpoint path from event
 */
function getEndpoint(event: APIGatewayProxyEvent): string {
  return event.requestContext.resourcePath || event.path || 'unknown';
}

/**
 * Check rate limit for request
 */
export async function checkRateLimit(
  event: APIGatewayProxyEvent,
  config: Partial<RateLimitConfig> = {}
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const identifier = getIdentifier(event);
  const endpoint = getEndpoint(event);
  const now = Date.now();
  const windowStart = now - (now % finalConfig.windowMs);

  const pk = `RATE_LIMIT#${identifier}`;
  const sk = `ENDPOINT#${endpoint}`;

  try {
    // Get current rate limit record
    const getResult = await dynamoDBClient.send(
      new GetCommand({
        TableName: RATE_LIMIT_TABLE,
        Key: { pk, sk },
      })
    );

    const record = getResult.Item as RateLimitRecord | undefined;

    // If no record or window expired, create new window
    if (!record || record.windowStart !== windowStart) {
      const newRecord: RateLimitRecord = {
        pk,
        sk,
        count: 1,
        windowStart,
        ttl: Math.floor((now + finalConfig.windowMs * 2) / 1000), // TTL for cleanup
      };

      await dynamoDBClient.send(
        new PutCommand({
          TableName: RATE_LIMIT_TABLE,
          Item: newRecord,
        })
      );

      logger.info('Rate limit window started', {
        identifier,
        endpoint,
        windowStart,
      });

      return {
        allowed: true,
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - 1,
        resetTime: windowStart + finalConfig.windowMs,
      };
    }

    // Check if limit exceeded
    if (record.count >= finalConfig.maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        endpoint,
        count: record.count,
        limit: finalConfig.maxRequests,
      });

      return {
        allowed: false,
        limit: finalConfig.maxRequests,
        remaining: 0,
        resetTime: windowStart + finalConfig.windowMs,
      };
    }

    // Increment counter
    await dynamoDBClient.send(
      new UpdateCommand({
        TableName: RATE_LIMIT_TABLE,
        Key: { pk, sk },
        UpdateExpression: 'SET #count = #count + :inc',
        ExpressionAttributeNames: {
          '#count': 'count',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
        },
      })
    );

    return {
      allowed: true,
      limit: finalConfig.maxRequests,
      remaining: finalConfig.maxRequests - record.count - 1,
      resetTime: windowStart + finalConfig.windowMs,
    };
  } catch (error) {
    // If rate limit check fails, log error but allow request (fail open)
    logger.error('Rate limit check failed', error);
    
    return {
      allowed: true,
      limit: finalConfig.maxRequests,
      remaining: finalConfig.maxRequests,
      resetTime: windowStart + finalConfig.windowMs,
    };
  }
}

/**
 * Rate limit middleware for Lambda handlers
 */
export async function rateLimitMiddleware(
  event: APIGatewayProxyEvent,
  config: Partial<RateLimitConfig> = {}
): Promise<void> {
  const result = await checkRateLimit(event, config);

  // Add rate limit headers to response (caller should add these)
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };

  if (!result.allowed) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

    throw new AppError(
      finalConfig.message || 'Too many requests',
      429,
      'RATE_LIMIT_EXCEEDED',
      {
        limit: result.limit,
        resetTime: new Date(result.resetTime).toISOString(),
        retryAfter,
        ...headers,
      }
    );
  }
}

/**
 * Create rate limit response headers
 */
export async function getRateLimitHeaders(
  event: APIGatewayProxyEvent
): Promise<Record<string, string>> {
  const result = await checkRateLimit(event);

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };
}

/**
 * Burst rate limiter (short window, high limit)
 */
export async function burstRateLimitMiddleware(
  event: APIGatewayProxyEvent
): Promise<void> {
  await rateLimitMiddleware(event, {
    windowMs: 10000, // 10 seconds
    maxRequests: 10,  // 10 requests per 10 seconds
    message: 'Too many requests in short time, please slow down',
  });
}

/**
 * Strict rate limiter for expensive operations
 */
export async function strictRateLimitMiddleware(
  event: APIGatewayProxyEvent
): Promise<void> {
  await rateLimitMiddleware(event, {
    windowMs: 3600000, // 1 hour
    maxRequests: 10,   // 10 requests per hour
    message: 'Rate limit exceeded for this operation',
  });
}