import { DynamoDBClient, CreateTableCommand, ListTablesCommand, waitUntilTableExists } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

const createNodesTable = async () => {
  console.log('Creating Nodes table...');
  
  try {
    await client.send(new CreateTableCommand({
      TableName: 'knowledge-map-nodes-dev',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'nodeType', AttributeType: 'S' },
        { AttributeName: 'importance', AttributeType: 'N' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'NodeTypeIndex',
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'nodeType', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'ImportanceIndex',
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'importance', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    
    await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: 'knowledge-map-nodes-dev' });
    console.log('✓ Nodes table created');
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('✓ Nodes table already exists');
    } else {
      throw error;
    }
  }
};

const createEdgesTable = async () => {
  console.log('Creating Edges table...');
  
  try {
    await client.send(new CreateTableCommand({
      TableName: 'knowledge-map-edges-dev',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'relationType', AttributeType: 'S' },
        { AttributeName: 'weight', AttributeType: 'N' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'RelationTypeIndex',
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'relationType', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'WeightIndex',
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'weight', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    
    await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: 'knowledge-map-edges-dev' });
    console.log('✓ Edges table created');
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('✓ Edges table already exists');
    } else {
      throw error;
    }
  }
};

const createCacheTable = async () => {
  console.log('Creating Cache table...');
  
  try {
    await client.send(new CreateTableCommand({
      TableName: 'knowledge-map-cache-dev',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    
    await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: 'knowledge-map-cache-dev' });
    
    // Note: TTL can only be enabled via AWS CLI or Console, not via CreateTable
    console.log('✓ Cache table created (enable TTL on "ttl" attribute via AWS Console if needed)');
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('✓ Cache table already exists');
    } else {
      throw error;
    }
  }
};

const listTables = async () => {
  const result = await client.send(new ListTablesCommand({}));
  console.log('\nExisting tables:');
  result.TableNames?.forEach(name => console.log(`  - ${name}`));
};

const createRateLimitTable = async () => {
  console.log('Creating Rate Limit table...');
  
  try {
    await client.send(new CreateTableCommand({
      TableName: 'knowledge-map-rate-limits-dev',
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    
    await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: 'knowledge-map-rate-limits-dev' });
    console.log('✓ Rate Limit table created (TTL will be set on records automatically)');
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('✓ Rate Limit table already exists');
    } else {
      throw error;
    }
  }
};

const main = async () => {
  console.log('Creating DynamoDB tables for local development...\n');
  
  try {
    await createNodesTable();
    await createEdgesTable();
    await createCacheTable();
    await createRateLimitTable();
    await listTables();
    
    console.log('\n✅ All tables created successfully!');
    console.log('\nTo view tables, run:');
    console.log('  aws dynamodb list-tables --endpoint-url http://localhost:8000');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
};

main();
