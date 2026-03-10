/**
 * DynamoDB Client wrapper with common operations
 */

import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  BatchWriteCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '@/config/aws';
import { logger } from '@/utils/logger';

export class DynamoDBClient {
  async get<T = any>(tableName: string, key: Record<string, any>): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: key,
      });

      const response = await docClient.send(command);
      return (response.Item as T) || null;
    } catch (error) {
      logger.error(`DynamoDB get error in table ${tableName}`, error, { key });
      throw error;
    }
  }

  async put(tableName: string, item: Record<string, any>): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await docClient.send(command);
    } catch (error) {
      logger.error(`DynamoDB put error in table ${tableName}`, error);
      throw error;
    }
  }

  async query<T = any>(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>
  ): Promise<T[]> {
    try {
      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(expressionAttributeNames && { ExpressionAttributeNames: expressionAttributeNames }),
      });

      const response = await docClient.send(command);
      return (response.Items as T[]) || [];
    } catch (error) {
      logger.error(`DynamoDB query error in table ${tableName}`, error);
      throw error;
    }
  }

  async batchWrite(tableName: string, items: Record<string, any>[]): Promise<void> {
    // DynamoDB limits batch writes to 25 items
    const batches = this.chunk(items, 25);

    for (const batch of batches) {
      try {
        const command = new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch.map((item) => ({
              PutRequest: {
                Item: item,
              },
            })),
          },
        });

        await docClient.send(command);
      } catch (error) {
        logger.error(`DynamoDB batch write error in table ${tableName}`, error);
        throw error;
      }
    }
  }

  async delete(tableName: string, key: Record<string, any>): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: key,
      });

      await docClient.send(command);
    } catch (error) {
      logger.error(`DynamoDB delete error in table ${tableName}`, error, { key });
      throw error;
    }
  }

  async update(
    tableName: string,
    key: Record<string, any>,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const updateExpression = Object.keys(updates)
        .map((k, i) => `#attr${i} = :val${i}`)
        .join(', ');

      const expressionAttributeNames = Object.keys(updates).reduce(
        (acc, k, i) => ({ ...acc, [`#attr${i}`]: k }),
        {}
      );

      const expressionAttributeValues = Object.values(updates).reduce(
        (acc, v, i) => ({ ...acc, [`:val${i}`]: v }),
        {}
      );

      const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      await docClient.send(command);
    } catch (error) {
      logger.error(`DynamoDB update error in table ${tableName}`, error, { key });
      throw error;
    }
  }

  async scan<T = any>(
    tableName: string,
    options?: {
      FilterExpression?: string;
      ExpressionAttributeValues?: Record<string, any>;
      Limit?: number;
    }
  ): Promise<T[]> {
    try {
      const command = new ScanCommand({
        TableName: tableName,
        ...options,
      });

      const response = await docClient.send(command);
      return (response.Items as T[]) || [];
    } catch (error) {
      logger.error(`DynamoDB scan error in table ${tableName}`, error);
      throw error;
    }
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const dynamoClient = new DynamoDBClient();
