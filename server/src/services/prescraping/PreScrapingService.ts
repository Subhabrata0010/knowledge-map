/**
 * Pre-scraping service - scrape and cache popular topics in advance
 * This is how Perplexity serves results instantly!
 */

import { config } from '@/config';
import { logger } from '@/utils/logger';
import { PipelineOrchestrator } from '@/services/pipeline/PipelineOrchestrator';
import { cacheRepository } from '@/db/repositories';
import { popularityTracker } from '@/services/tracking/PopularityTracker';
import { Normalizer } from '@/utils/normalizer';

export class PreScrapingService {
  private orchestrator: PipelineOrchestrator;
  private isRunning: boolean = false;

  constructor() {
    this.orchestrator = new PipelineOrchestrator();
  }

  /**
   * Start periodic pre-scraping of popular topics
   */
  async startPreScraping(): Promise<void> {
    if (!config.preScraping.enabled) {
      logger.info('Pre-scraping disabled');
      return;
    }

    if (this.isRunning) {
      logger.warn('Pre-scraping already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting pre-scraping service', {
      topics: config.preScraping.topics.length,
      interval: config.preScraping.intervalHours,
    });

    // Initial scrape
    await this.scrapeAllTopics();

    // Schedule periodic scraping
    const intervalMs = config.preScraping.intervalHours * 60 * 60 * 1000;
    setInterval(() => {
      this.scrapeAllTopics().catch((error) => {
        logger.error('Pre-scraping failed', error);
      });
    }, intervalMs);
  }

  /**
   * Scrape top popular topics (or seed topics if no popularity data)
   */
  private async scrapeAllTopics(): Promise<void> {
    // Get top N popular topics based on user searches
    const topics = await popularityTracker.getTopTopics(config.preScraping.maxTopics);

    logger.info('Starting pre-scrape batch', {
      maxTopics: config.preScraping.maxTopics,
      pagesPerTopic: config.preScraping.pagesPerTopic,
      topics,
    });

    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    // Process topics sequentially to avoid overloading servers
    for (const topic of topics) {
      try {
        logger.info(`Pre-scraping: ${topic}`);

        // Check if already cached and fresh
        const topicKey = Normalizer.normalizeTopic(topic);
        const cached = await cacheRepository.getGraph(topicKey);
        if (cached) {
          logger.info(`Skipping ${topic} - already cached`);
          skippedCount++;
          continue;
        }

        // Generate and cache knowledge map
        const graph = await this.orchestrator.generateKnowledgeMap(topic);
        logger.info(`Pre-scraped: ${topic}`, {
          nodes: graph.nodes.length,
          edges: graph.edges.length,
        });

        successCount++;

        // Wait between topics to be nice to servers
        await this.sleep(5000); // 5 second delay
      } catch (error) {
        logger.error(`Pre-scraping failed for ${topic}`, error);
        failCount++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Pre-scrape batch complete', {
      duration,
      success: successCount,
      failed: failCount,
      skipped: skippedCount,
      total: topics.length,
    });
  }

  /**
   * Manually trigger pre-scraping
   */
  async triggerManualScrape(topics?: string[]): Promise<void> {
    const topicsToScrape = topics || config.preScraping.topics;

    logger.info('Manual pre-scrape triggered', { topics: topicsToScrape });

    for (const topic of topicsToScrape) {
      try {
        await this.orchestrator.generateKnowledgeMap(topic);
        logger.info(`Manually pre-scraped: ${topic}`);
      } catch (error) {
        logger.error(`Manual pre-scrape failed for ${topic}`, error);
      }
    }
  }

  /**
   * Get pre-scraping status
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    topics: string[];
    intervalHours: number;
  } {
    return {
      enabled: config.preScraping.enabled,
      running: this.isRunning,
      topics: config.preScraping.topics,
      intervalHours: config.preScraping.intervalHours,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
