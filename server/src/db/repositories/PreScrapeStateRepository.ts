/**
 * Repository for managing pre-scrape state
 * Tracks which topics have been scraped and where to continue
 */

import { dynamoClient } from '../DynamoDBClient';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const STATE_TABLE = config.aws.dynamodb.cacheTable;
const STATE_KEY = 'pre-scrape-state';

export interface PreScrapeState {
  lastScrapedIndex: number;
  lastScrapedTopic: string;
  totalTopics: number;
  lastRunTimestamp: string;
  isInProgress: boolean;
}

export class PreScrapeStateRepository {
  /**
   * Get the current pre-scrape state
   */
  async getState(): Promise<PreScrapeState | null> {
    try {
      const result = await dynamoClient.get<{
        pk: string;
        state: PreScrapeState;
      }>(STATE_TABLE, { pk: STATE_KEY });
      
      return result?.state || null;
    } catch (error) {
      logger.error('Failed to get pre-scrape state', error);
      return null;
    }
  }

  /**
   * Update the pre-scrape state
   */
  async updateState(state: PreScrapeState): Promise<void> {
    try {
      await dynamoClient.put(STATE_TABLE, {
        pk: STATE_KEY,
        state,
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      });
    } catch (error) {
      logger.error('Failed to update pre-scrape state', error);
      throw error;
    }
  }

  /**
   * Reset the state (start from beginning)
   */
  async resetState(): Promise<void> {
    try {
      await dynamoClient.put(STATE_TABLE, {
        pk: STATE_KEY,
        state: {
          lastScrapedIndex: -1,
          lastScrapedTopic: '',
          totalTopics: config.preScraping.topics.length,
          lastRunTimestamp: new Date().toISOString(),
          isInProgress: false,
        },
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      });
    } catch (error) {
      logger.error('Failed to reset pre-scrape state', error);
      throw error;
    }
  }
}

export const preScrapeStateRepository = new PreScrapeStateRepository();
