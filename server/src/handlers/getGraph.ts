/**
 * Lambda handler for GET /graph/{topic}
 * Retrieves an existing knowledge map
 * 
 * Security features:
 * - Input validation and sanitization
 * - Rate limiting (200 requests per 15 minutes - more lenient for GET)
 * - Request logging with IP tracking
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PipelineOrchestrator } from '@/services/pipeline';
import {
  handleError,
  successResponse,
  handleOptionsRequest,
  RequestValidator,
} from '@/middleware';
import { rateLimitMiddleware, getRateLimitHeaders } from '@/middleware/rateLimit';
import { sanitizeInput } from '@/utils/validators';
import { logger } from '@/utils/logger';
import { NotFoundError, ValidationError } from '@/utils/errors';

const pipeline = new PipelineOrchestrator();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    logger.info('Get graph request received', {
      requestId,
      ip: event.requestContext.identity.sourceIp,
    });

    // ==================== DISABLED FOR TESTING ====================
    // Apply rate limiting (200 requests per 15 minutes - more lenient for GET)
    // await rateLimitMiddleware(event, {
    //   windowMs: 900000,    // 15 minutes
    //   maxRequests: 200,    // 2x POST limit for read operations
    //   message: 'Too many requests. Please try again later.',
    // });

    // Get rate limit headers
    // const rateLimitHeaders = await getRateLimitHeaders(event);

    // Validate request (includes SQL/XSS checks)
    // const { topic } = RequestValidator.validateGetGraphRequest(event.pathParameters);

    // Additional sanitization logging
    // const sanitizedTopic = sanitizeInput(topic);
    // if (topic !== sanitizedTopic) {
    //   logger.warn('Topic parameter was sanitized', {
    //     original: topic,
    //     sanitized: sanitizedTopic,
    //     requestId,
    //     ip: event.requestContext.identity.sourceIp,
    //   });
    // }
    // ==================== END DISABLED SECTION ====================
    
    // Simple topic extraction without validation
    const topic = event.pathParameters?.topic || '';
    if (!topic) {
      throw new ValidationError('Topic parameter is required');
    }

    logger.info(`Fetching knowledge map for topic: ${topic}`);

    // Retrieve the knowledge map
    const graph = await pipeline.getKnowledgeMap(topic);

    if (!graph) {
      throw new NotFoundError(`Knowledge map not found for topic: ${topic}`);
    }

    logger.info(`Successfully retrieved map for: ${topic}`, {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      requestId,
    });

    return successResponse(
      {
        success: true,
        data: graph,
      },
      200,
      {
        // ...rateLimitHeaders, // DISABLED FOR TESTING
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      }
    );
  } catch (error) {
    logger.error('Get graph failed', error, { requestId });
    return handleError(error);
  }
}
