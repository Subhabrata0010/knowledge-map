/**
 * Cache repository for DynamoDB operations
 */

import { Graph } from '@/models';
import { dynamoClient } from '../DynamoDBClient';
import { config } from '@/config';
import { logger } from '@/utils/logger';

interface CacheItem {
  PK: string;
  SK: string;
  graph: Graph;
  ttl: number;
  createdAt: string;
}

export class CacheRepository {
  private tableName = config.aws.dynamodb.cacheTable;

  /**
   * Save a graph to cache
   */
  async saveGraph(topicKey: string, graph: Graph): Promise<void> {
    const ttlHours = config.cache.ttlHours;
    const ttl = Math.floor(Date.now() / 1000) + ttlHours * 3600;

    const item: CacheItem = {
      PK: `CACHE#${topicKey}`,
      SK: 'GRAPH',
      graph,
      ttl,
      createdAt: new Date().toISOString(),
    };

    await dynamoClient.put(this.tableName, item);
    logger.info(`Cached graph for topic: ${topicKey}, TTL: ${ttlHours}h`);
  }

  /**
   * Get a cached graph
   */
  async getGraph(topicKey: string): Promise<Graph | null> {
    const item = await dynamoClient.get<CacheItem>(this.tableName, {
      PK: `CACHE#${topicKey}`,
      SK: 'GRAPH',
    });

    if (!item) {
      logger.debug(`Cache miss for topic: ${topicKey}`);
      return null;
    }

    // Check if expired (DynamoDB TTL might have delay)
    const now = Math.floor(Date.now() / 1000);
    if (item.ttl && item.ttl < now) {
      logger.debug(`Cache expired for topic: ${topicKey}`);
      return null;
    }

    logger.info(`Cache hit for topic: ${topicKey}`);
    return item.graph;
  }

  /**
   * Delete a cached graph
   */
  async deleteGraph(topicKey: string): Promise<void> {
    await dynamoClient.delete(this.tableName, {
      PK: `CACHE#${topicKey}`,
      SK: 'GRAPH',
    });

    logger.info(`Deleted cache for topic: ${topicKey}`);
  }
}

export const cacheRepository = new CacheRepository();
