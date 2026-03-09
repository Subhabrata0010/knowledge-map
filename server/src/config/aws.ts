/**
 * AWS SDK configuration
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { config } from './environment';

// DynamoDB Client
export const dynamoDBClient = new DynamoDBClient({
  region: config.aws.region,
  ...(config.aws.dynamodb.endpoint && { endpoint: config.aws.dynamodb.endpoint }),
});

export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// S3 Client
export const s3Client = new S3Client({
  region: config.aws.region,
});
