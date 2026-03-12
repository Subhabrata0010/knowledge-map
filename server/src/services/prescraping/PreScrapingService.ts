/**
 * Pre-scraping service - scrape and cache popular topics in advance
 * This is how Perplexity serves results instantly!
 */

import { config } from '@/config';
import { logger } from '@/utils/logger';
import { PipelineOrchestrator } from '@/services/pipeline/PipelineOrchestrator';
import { cacheRepository, preScrapeStateRepository } from '@/db/repositories';
import { popularityTracker } from '@/services/tracking/PopularityTracker';
import { Normalizer } from '@/utils/normalizer';

const BATCH_SIZE = 30; // Process 30 topics per batch
const BATCH_DELAY_MS = 5 * 60 * 1000; // 5 minutes between batches

export class PreScrapingService {
  private orchestrator: PipelineOrchestrator;
  private isRunning: boolean = false;
  private batchTimer: NodeJS.Timeout | null = null;

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
   * Non-blocking - allows concurrent graph generation requests
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
    // But don't block - each operation is async and non-blocking
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
        // This is non-blocking for other Lambda invocations
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
   * Manually trigger pre-scraping with pagination support
   */
  async triggerManualScrape(topics?: string[]): Promise<void> {
    const allTopics = topics || config.preScraping.topics;

    logger.info('Manual pre-scrape triggered', { totalTopics: allTopics.length });

    // If topics exceed batch size, use pagination
    if (allTopics.length > BATCH_SIZE) {
      await this.scrapeWithPagination(allTopics);
    } else {
      // Scrape all topics at once
      await this.scrapeBatch(allTopics, 0);
    }
  }

  /**
   * Scrape topics in batches with automatic continuation
   */
  private async scrapeWithPagination(allTopics: string[]): Promise<void> {
    // Get last state
    let state = await preScrapeStateRepository.getState();
    
    // If no state or completed full cycle, start from beginning
    if (!state || state.lastScrapedIndex >= allTopics.length - 1) {
      state = {
        lastScrapedIndex: -1,
        lastScrapedTopic: '',
        totalTopics: allTopics.length,
        lastRunTimestamp: new Date().toISOString(),
        isInProgress: false,
      };
    }

    // Check if another process is running
    if (state.isInProgress) {
      logger.warn('Pre-scrape already in progress, skipping');
      return;
    }

    // Mark as in progress
    await preScrapeStateRepository.updateState({
      ...state,
      isInProgress: true,
    });

    try {
      await this.processBatches(allTopics, state.lastScrapedIndex);
    } catch (error) {
      logger.error('Pre-scrape pagination failed', error);
      // Reset in-progress flag on error
      await preScrapeStateRepository.updateState({
        ...state,
        isInProgress: false,
      });
      throw error;
    }
  }

  /**
   * Process topics in batches with delays
   */
  private async processBatches(allTopics: string[], startIndex: number): Promise<void> {
    let currentIndex = startIndex;

    while (currentIndex < allTopics.length - 1) {
      const nextIndex = Math.min(currentIndex + BATCH_SIZE, allTopics.length);
      const batch = allTopics.slice(currentIndex + 1, nextIndex);

      logger.info(`Processing batch: topics ${currentIndex + 1} to ${nextIndex - 1} of ${allTopics.length}`);

      await this.scrapeBatch(batch, currentIndex);

      currentIndex = nextIndex - 1;

      // Update state
      await preScrapeStateRepository.updateState({
        lastScrapedIndex: currentIndex,
        lastScrapedTopic: allTopics[currentIndex],
        totalTopics: allTopics.length,
        lastRunTimestamp: new Date().toISOString(),
        isInProgress: currentIndex < allTopics.length - 1, // Still in progress if more topics remain
      });

      // If more topics remain, schedule next batch after delay
      if (currentIndex < allTopics.length - 1) {
        logger.info(`Waiting ${BATCH_DELAY_MS / 1000 / 60} minutes before next batch...`);
        await this.sleep(BATCH_DELAY_MS);
      }
    }

    logger.info('All topics pre-scraped successfully!');
  }

  /**
   * Scrape a single batch of topics
   */
  private async scrapeBatch(topics: string[], batchStartIndex: number): Promise<void> {
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      try {
        await this.orchestrator.generateKnowledgeMap(topic);
        logger.info(`Pre-scraped: ${topic} (${batchStartIndex + i + 1})`);
        
        // Small delay between topics
        await this.sleep(2000);
      } catch (error) {
        logger.error(`Pre-scrape failed for ${topic}`, error);
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
