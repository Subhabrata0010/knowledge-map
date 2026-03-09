/**
 * Edge repository for DynamoDB operations
 */

import { Edge } from '@/models';
import { dynamoClient } from '../DynamoDBClient';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class EdgeRepository {
  private tableName = config.aws.dynamodb.edgesTable;

  /**
   * Save a single edge
   */
  async saveEdge(topic: string, edge: Edge): Promise<void> {
    const item = {
      PK: `TOPIC#${topic}`,
      SK: `EDGE#${edge.source}#${edge.target}`,
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relation: edge.relation,
      weight: edge.weight,
      metadata: edge.metadata,
      createdAt: new Date().toISOString(),
    };

    await dynamoClient.put(this.tableName, item);
  }

  /**
   * Save multiple edges in batch
   */
  async saveEdges(topic: string, edges: Edge[]): Promise<void> {
    const items = edges.map((edge) => ({
      PK: `TOPIC#${topic}`,
      SK: `EDGE#${edge.source}#${edge.target}`,
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relation: edge.relation,
      weight: edge.weight,
      metadata: edge.metadata,
      createdAt: new Date().toISOString(),
    }));

    await dynamoClient.batchWrite(this.tableName, items);
    logger.info(`Saved ${edges.length} edges for topic: ${topic}`);
  }

  /**
   * Get all edges for a topic
   */
  async getEdgesByTopic(topic: string): Promise<Edge[]> {
    const items = await dynamoClient.query<any>(
      this.tableName,
      'PK = :pk AND begins_with(SK, :sk)',
      {
        ':pk': `TOPIC#${topic}`,
        ':sk': 'EDGE#',
      }
    );

    return items.map((item) => ({
      id: item.id,
      source: item.source,
      target: item.target,
      relation: item.relation,
      weight: item.weight,
      metadata: item.metadata,
    }));
  }

  /**
   * Get edges for a specific node
   */
  async getEdgesByNode(topic: string, nodeId: string): Promise<Edge[]> {
    const allEdges = await this.getEdgesByTopic(topic);
    return allEdges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
  }

  /**
   * Delete all edges for a topic
   */
  async deleteEdgesByTopic(topic: string): Promise<void> {
    const edges = await this.getEdgesByTopic(topic);
    
    for (const edge of edges) {
      await dynamoClient.delete(this.tableName, {
        PK: `TOPIC#${topic}`,
        SK: `EDGE#${edge.source}#${edge.target}`,
      });
    }

    logger.info(`Deleted ${edges.length} edges for topic: ${topic}`);
  }
}

export const edgeRepository = new EdgeRepository();
