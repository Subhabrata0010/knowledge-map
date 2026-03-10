/**
 * Manual pre-scraping script
 * Run this to cache popular topics locally
 */

import { PreScrapingService } from '@/services/prescraping/PreScrapingService';
import { logger } from '@/utils/logger';
import { config } from '@/config';

async function main() {
  logger.info('Starting manual pre-scraping...');
  logger.info(`Topics to scrape: ${config.preScraping.topics.join(', ')}`);

  const preScraper = new PreScrapingService();

  try {
    await preScraper.triggerManualScrape();
    logger.info('✅ Pre-scraping completed successfully!');
    logger.info('All topics are now cached in DynamoDB Local');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Pre-scraping failed:', error);
    process.exit(1);
  }
}

main();
