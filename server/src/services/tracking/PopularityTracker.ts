/**
 * Topic Popularity Tracker
 * Tracks which topics users search for to inform pre-scraping priorities
 */

import { dynamoClient } from '@/db/DynamoDBClient';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { Normalizer } from '@/utils/normalizer';

interface PopularityRecord {
  PK: string;  // 'POPULARITY#topicKey'
  SK: string;  // 'POPULARITY#topicKey'
  topic: string;
  topicKey: string;
  searchCount: number;
  lastSearched: number;
  firstSearched: number;
}

export class PopularityTracker {
  private tableName = config.aws.dynamodb.cacheTable; // Reuse cache table

  /**
   * Track a topic search
   */
  async trackSearch(topic: string): Promise<void> {
    const topicKey = Normalizer.normalizeTopic(topic);
    const now = Date.now();

    try {
      const existing = await this.getPopularity(topicKey);

      if (existing) {
        // Increment existing record
        await dynamoClient.update(
          this.tableName,
          { PK: `POPULARITY#${topicKey}`, SK: `POPULARITY#${topicKey}` },
          {
            searchCount: existing.searchCount + 1,
            lastSearched: now,
          }
        );
      } else {
        // Create new record
        const record: PopularityRecord = {
          PK: `POPULARITY#${topicKey}`,
          SK: `POPULARITY#${topicKey}`,
          topic,
          topicKey,
          searchCount: 1,
          lastSearched: now,
          firstSearched: now,
        };
        await dynamoClient.put(this.tableName, record);
      }

      logger.debug(`Tracked search for: ${topic}`);
    } catch (error) {
      logger.warn(`Failed to track popularity for ${topic}`, { error });
      // Don't throw - tracking is non-critical
    }
  }

  /**
   * Get popularity data for a topic
   */
  private async getPopularity(topicKey: string): Promise<PopularityRecord | null> {
    return await dynamoClient.get<PopularityRecord>(this.tableName, {
      PK: `POPULARITY#${topicKey}`,
      SK: `POPULARITY#${topicKey}`,
    });
  }

  /**
   * Get top N most popular topics
   */
  async getTopTopics(limit: number = 20): Promise<string[]> {
    try {
      // Scan for all popularity records
      const records = await dynamoClient.scan<PopularityRecord>(this.tableName, {
        FilterExpression: 'begins_with(PK, :prefix)',
        ExpressionAttributeValues: {
          ':prefix': 'POPULARITY#',
        },
      });

      if (!records || records.length === 0) {
        logger.info('No popularity data yet, using seed topics');
        return config.preScraping.topics.slice(0, limit);
      }

      // Sort by search count descending
      const sorted = records
        .sort((a: PopularityRecord, b: PopularityRecord) => b.searchCount - a.searchCount)
        .slice(0, limit)
        .map((r: PopularityRecord) => r.topic);

      logger.info(`Top ${limit} popular topics:`, sorted);
      return sorted;
    } catch (error) {
      logger.error('Failed to get popular topics:', error);
      // Fallback to seed topics
      return config.preScraping.topics.slice(0, limit);
    }
  }

  /**
   * Get popularity stats
   */
  async getStats(): Promise<{
    totalTopics: number;
    totalSearches: number;
    topTopics: Array<{ topic: string; count: number }>;
  }> {
    try {
      const records = await dynamoClient.scan<PopularityRecord>(this.tableName, {
        FilterExpression: 'begins_with(PK, :prefix)',
        ExpressionAttributeValues: {
          ':prefix': 'POPULARITY#',
        },
      });

      const totalSearches = records.reduce((sum: number, r: PopularityRecord) => sum + r.searchCount, 0);
      const topTopics = records
        .sort((a: PopularityRecord, b: PopularityRecord) => b.searchCount - a.searchCount)
        .slice(0, 10)
        .map((r: PopularityRecord) => ({ topic: r.topic, count: r.searchCount }));

      return {
        totalTopics: records.length,
        totalSearches,
        topTopics,
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return { totalTopics: 0, totalSearches: 0, topTopics: [] };
    }
  }
}

export const popularityTracker = new PopularityTracker();
