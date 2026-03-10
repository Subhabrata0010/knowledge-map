/**
 * Lambda handler for pre-scraping cron job
 * Triggered by EventBridge schedule (e.g., daily)
 */

import { Handler } from 'aws-lambda';
import { PreScrapingService } from '@/services/prescraping/PreScrapingService';
import { logger } from '@/utils/logger';

export const handler: Handler = async (event, context) => {
  logger.info('Pre-scraping Lambda triggered', {
    event,
    requestId: context.awsRequestId,
  });

  const preScrapingService = new PreScrapingService();

  try {
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
