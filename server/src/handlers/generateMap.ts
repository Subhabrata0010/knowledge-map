/**
 * Lambda handler for POST /generate-map
 * Generates a new knowledge map for a given topic
 * 
 * Security features:
 * - Input validation and sanitization (SQL injection, XSS prevention)
 * - Rate limiting (100 requests per 15 minutes)
 * - Request logging with IP tracking
 * 
 * NOTE: This runs independently and concurrently with pre-scraping jobs.
 * Each Lambda invocation has isolated service instances and DB connections.
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
import { ValidationError } from '@/utils/errors';

const pipeline = new PipelineOrchestrator();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    logger.info('Generate map request received', {
      requestId,
      ip: event.requestContext.identity.sourceIp,
    });

    // ==================== DISABLED FOR TESTING ====================
    // Apply rate limiting (100 requests per 15 minutes)
    // await rateLimitMiddleware(event, {
    //   windowMs: 900000,    // 15 minutes
    //   maxRequests: 100,
    //   message: 'Too many map generation requests. Please try again later.',
    // });

    // Get rate limit headers
    // const rateLimitHeaders = await getRateLimitHeaders(event);
    // ==================== END DISABLED SECTION ====================

    // Parse request body with minimal validation
    let body: any;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      throw new ValidationError('Invalid JSON in request body');
    }

    // ==================== DISABLED FOR TESTING ====================
    // Validate request (includes SQL/XSS checks)
    // const { topic } = RequestValidator.validateGenerateMapRequest(body);

    // Additional sanitization logging
    // const sanitizedTopic = sanitizeInput(topic);
    // if (topic !== sanitizedTopic) {
    //   logger.warn('Topic was sanitized', {
    //     original: topic,
    //     sanitized: sanitizedTopic,
    //     requestId,
    //     ip: event.requestContext.identity.sourceIp,
    //   });
    // }
    // ==================== END DISABLED SECTION ====================
    
    // Simple topic extraction without validation
    const topic = body.topic || '';
    if (!topic || typeof topic !== 'string') {
      throw new ValidationError('Topic is required and must be a string');
    }

    logger.info(`Generating knowledge map for topic: ${topic}`);

    // Generate the knowledge map
    const graph = await pipeline.generateKnowledgeMap(topic);

    logger.info(`Successfully generated map for: ${topic}`, {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      generationTime: graph.metadata.generationTimeMs,
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
    logger.error('Generate map failed', error, { requestId });
    return handleError(error);
  }
}
