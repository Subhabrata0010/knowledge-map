/**
 * Get popularity statistics
 * Shows which topics are most searched and cached
 */

import { Handler } from 'aws-lambda';
import { popularityTracker } from '@/services/tracking/PopularityTracker';
import { logger } from '@/utils/logger';

export const handler: Handler = async (event, context) => {
  logger.info('Stats request', { requestId: context.awsRequestId });

  try {
    const stats = await popularityTracker.getStats();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: stats,
      }),
    };
  } catch (error) {
    logger.error('Stats request failed', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      }),
    };
  }
};
