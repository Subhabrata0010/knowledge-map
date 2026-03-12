/**
 * Lambda handler for pre-scraping cron job
 * Triggered by EventBridge schedule (e.g., every 30 minutes)
 * 
 * NOTE: This runs independently and concurrently with graph generation requests.
 * Each Lambda invocation has its own service instances and DB connections.
 */

import { Handler } from 'aws-lambda';
import { PreScrapingService } from '@/services/prescraping/PreScrapingService';
import { logger } from '@/utils/logger';

export const handler: Handler = async (event, context) => {
  // Set a reasonable timeout context
  const timeRemaining = context.getRemainingTimeInMillis();
  logger.info('Pre-scraping Lambda triggered', {
    event,
    requestId: context.awsRequestId,
    timeRemaining,
  });

  const preScrapingService = new PreScrapingService();

  try {
    // Run pre-scraping (non-blocking for other Lambda invocations)
    await preScrapingService.triggerManualScrape();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Pre-scraping completed successfully',
        status: preScrapingService.getStatus(),
      }),
    };
  } catch (error) {
    logger.error('Pre-scraping Lambda failed', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Pre-scraping failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
