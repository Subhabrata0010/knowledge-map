/**
 * Node repository for DynamoDB operations
 */

import { Node } from '@/models';
import { dynamoClient } from '../DynamoDBClient';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class NodeRepository {
  private tableName = config.aws.dynamodb.nodesTable;

  /**
   * Save a single node
   */
  async saveNode(topic: string, node: Node): Promise<void> {
    const item = {
      PK: `TOPIC#${topic}`,
      SK: `NODE#${node.id}`,
      id: node.id,
      name: node.name,
      type: node.type,
      description: node.description,
      frequency: node.frequency,
      importance: node.importance,
      metadata: node.metadata,
      createdAt: new Date().toISOString(),
    };

    await dynamoClient.put(this.tableName, item);
  }

  /**
   * Save multiple nodes in batch
   */
  async saveNodes(topic: string, nodes: Node[]): Promise<void> {
    const items = nodes.map((node) => ({
      PK: `TOPIC#${topic}`,
      SK: `NODE#${node.id}`,
      id: node.id,
      name: node.name,
      type: node.type,
      description: node.description,
      frequency: node.frequency,
      importance: node.importance,
      metadata: node.metadata,
      createdAt: new Date().toISOString(),
    }));

    await dynamoClient.batchWrite(this.tableName, items);
    logger.info(`Saved ${nodes.length} nodes for topic: ${topic}`);
  }

  /**
   * Get all nodes for a topic
   */
  async getNodesByTopic(topic: string): Promise<Node[]> {
    const items = await dynamoClient.query<any>(
      this.tableName,
      'PK = :pk AND begins_with(SK, :sk)',
      {
        ':pk': `TOPIC#${topic}`,
        ':sk': 'NODE#',
      }
    );

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      description: item.description,
      frequency: item.frequency,
      importance: item.importance,
      metadata: item.metadata,
    }));
  }

  /**
   * Get a single node by ID
   */
  async getNode(topic: string, nodeId: string): Promise<Node | null> {
    const item = await dynamoClient.get<any>(this.tableName, {
      PK: `TOPIC#${topic}`,
      SK: `NODE#${nodeId}`,
    });

    if (!item) return null;

    return {
      id: item.id,
      name: item.name,
      type: item.type,
      description: item.description,
      frequency: item.frequency,
      importance: item.importance,
      metadata: item.metadata,
    };
  }

  /**
   * Delete all nodes for a topic
   */
  async deleteNodesByTopic(topic: string): Promise<void> {
    const nodes = await this.getNodesByTopic(topic);
    
    for (const node of nodes) {
      await dynamoClient.delete(this.tableName, {
        PK: `TOPIC#${topic}`,
        SK: `NODE#${node.id}`,
      });
    }

    logger.info(`Deleted ${nodes.length} nodes for topic: ${topic}`);
  }
}

export const nodeRepository = new NodeRepository();
