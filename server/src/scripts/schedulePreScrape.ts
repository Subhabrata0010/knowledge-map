/**
 * Local scheduler for pre-scraping
 * Runs pre-scraping every X hours automatically
 */

import { PreScrapingService } from '@/services/prescraping/PreScrapingService';
import { logger } from '@/utils/logger';
import { config } from '@/config';

async function startScheduler() {
  logger.info('🕐 Starting pre-scraping scheduler...');
  logger.info(`Interval: Every ${config.preScraping.intervalHours} hours`);
  logger.info(`Topics: ${config.preScraping.topics.join(', ')}`);

  const preScraper = new PreScrapingService();

  // Run initial pre-scrape
  logger.info('🚀 Running initial pre-scrape...');
  try {
    await preScraper.triggerManualScrape();
    logger.info('✅ Initial pre-scrape completed');
  } catch (error) {
    logger.error('❌ Initial pre-scrape failed:', error);
  }

  // Schedule recurring pre-scraping
  const intervalMs = config.preScraping.intervalHours * 60 * 60 * 1000;
  logger.info(`⏰ Next run in ${config.preScraping.intervalHours} hours`);

  setInterval(async () => {
    logger.info('🔄 Running scheduled pre-scrape...');
    try {
      await preScraper.triggerManualScrape();
      logger.info('✅ Scheduled pre-scrape completed');
      logger.info(`⏰ Next run in ${config.preScraping.intervalHours} hours`);
    } catch (error) {
      logger.error('❌ Scheduled pre-scrape failed:', error);
    }
  }, intervalMs);

  logger.info('✨ Scheduler is running! Press Ctrl+C to stop.');
}

startScheduler().catch((error) => {
  logger.error('Failed to start scheduler:', error);
  process.exit(1);
});
