# Knowledge Map - Backend Server

Serverless backend for the Internet Knowledge Map system, built with AWS Lambda, DynamoDB, and TypeScript.

## 🏗️ Architecture

The backend consists of several layers following clean architecture principles:

```
handlers/           # Lambda entry points (API Gateway integration)
├── generateMap.ts  # POST /generate-map - Generate new knowledge graph
└── getGraph.ts     # GET /graph/{topic} - Retrieve cached graph

services/           # Business logic layer
├── pipeline/       # Orchestrates entire generation workflow
├── search/         # DuckDuckGo web search
├── scraper/        # HTML fetching and content extraction
├── entity/         # NLP entity extraction and ranking
├── relationship/   # Relationship discovery via co-occurrence
└── graph/          # Graph construction and metrics

db/                 # Data access layer
├── DynamoDBClient.ts    # DynamoDB wrapper with retry logic
└── repositories/        # Repository pattern for each table
    ├── NodeRepository.ts
    ├── EdgeRepository.ts
    └── CacheRepository.ts

models/             # TypeScript type definitions
├── Graph.ts        # Node, Edge, Graph types
├── Entity.ts       # Entity extraction types
├── SearchResult.ts # Search service types
└── ScrapedContent.ts # Scraper types

utils/              # Shared utilities
├── logger.ts       # Structured JSON logging
├── errors.ts       # Custom error classes
├── validators.ts   # Input validation
├── normalizer.ts   # String normalization
├── retry.ts        # Exponential backoff retry
└── parallel.ts     # Parallel execution helpers

middleware/         # Request/response middleware
├── errorHandler.ts # Error formatting
├── validator.ts    # Request validation
└── cors.ts         # CORS headers

config/             # Configuration management
├── environment.ts  # Environment variables
└── aws.ts          # AWS SDK setup
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Docker (optional, for local DynamoDB)

### Install Dependencies

```bash
npm install
```

### Configuration

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   ```bash
   # For local development
   DYNAMODB_ENDPOINT=http://localhost:8000
   AWS_REGION=us-east-1
   DYNAMODB_NODES_TABLE=knowledge-map-nodes-dev
   DYNAMODB_EDGES_TABLE=knowledge-map-edges-dev
   DYNAMODB_CACHE_TABLE=knowledge-map-cache-dev
   
   # Search & scraping
   MAX_SEARCH_RESULTS=15
   MAX_CONCURRENT_SCRAPES=5
   MAX_ENTITIES=50
   
   # Caching
   CACHE_TTL_HOURS=24
   
   # Logging
   LOG_LEVEL=info
   ```

### Local Development

#### Option 1: With Local DynamoDB (Recommended)

1. **Start DynamoDB Local**:
   ```bash
   # Using Docker
   docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local
   
   # Or using the script
   chmod +x scripts/local-dynamodb.sh
   ./scripts/local-dynamodb.sh
   ```

2. **Create tables**:
   ```bash
   npm run create-tables-local
   ```

3. **Start serverless offline**:
   ```bash
   npm run dev
   ```

   API will be available at `http://localhost:3001`

#### Option 2: Without Local DynamoDB

Point to AWS DynamoDB tables in your `.env`:
```bash
# Remove DYNAMODB_ENDPOINT or comment it out
# Use actual AWS table names
DYNAMODB_NODES_TABLE=knowledge-map-nodes-dev
DYNAMODB_EDGES_TABLE=knowledge-map-edges-dev
DYNAMODB_CACHE_TABLE=knowledge-map-cache-dev
```

Then start:
```bash
npm run dev
```

### Build

Compile TypeScript:
```bash
npm run build
```

Watch mode:
```bash
npm run build:watch
```

### Testing

Test locally with sample events:

```bash
# Generate map
npm run invoke:generate

# Get cached graph
npm run invoke:get
```

Or test with curl:

```bash
# Generate new knowledge graph
curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Agents"}'

# Get cached graph
curl http://localhost:3001/graph/ai-agents
```

## 🚢 Deployment

### Option 1: Automated Script (Recommended)

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh dev us-east-1
```

**Windows (PowerShell):**
```powershell
.\scripts\deploy.ps1 -Environment dev -AwsRegion us-east-1
```

### Option 2: Serverless Framework

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to production
npm run deploy:prod

# View logs
npm run logs

# Remove deployment
npm run remove
```

### Option 3: Manual CloudFormation

See [DEPLOYMENT.md](../DEPLOYMENT.md) in the root directory.

### Deployment Outputs

After deployment, you'll get:
- **API Gateway URL**: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`
- **Lambda Function ARNs**
- **DynamoDB Table Names**

Update your frontend `.env.local`:
```bash
NEXT_PUBLIC_API_URL=<your-api-gateway-url>
```

## 📊 API Endpoints

### POST /generate-map

Generate a new knowledge graph for a topic.

**Request:**
```json
{
  "topic": "AI Agents"
}
```

**Response (200 OK):**
```json
{
  "graph": {
    "metadata": {
      "topic": "AI Agents",
      "generatedAt": "2025-01-15T10:30:00.000Z",
      "nodeCount": 42,
      "edgeCount": 68,
      "averageDegree": 3.2,
      "maxDepth": 4
    },
    "nodes": [
      {
        "id": "ai-agents",
        "type": "technology",
        "label": "AI Agents",
        "description": "Autonomous artificial intelligence systems...",
        "importance": 0.95,
        "frequency": 127,
        "sources": 12
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "ai-agents",
        "target": "machine-learning",
        "type": "built-on",
        "weight": 0.87,
        "coOccurrences": 45
      }
    ]
  },
  "cached": false
}
```

**Error Responses:**
- `400 Bad Request`: Invalid topic (empty, too long, invalid characters)
- `500 Internal Server Error`: Pipeline failure, DynamoDB error, timeout

### GET /graph/{topic}

Retrieve a cached knowledge graph.

**Request:**
```
GET /graph/ai-agents
```

**Response (200 OK):**
```json
{
  "graph": { /* same as generate-map response */ },
  "cached": true,
  "cacheAge": 7200
}
```

**Error Responses:**
- `404 Not Found`: Graph not found in cache
- `500 Internal Server Error`: DynamoDB error

## 🧩 Core Services

### Pipeline Orchestrator

Coordinates the entire graph generation workflow:

```typescript
const pipeline = new PipelineOrchestrator(/* dependencies */);
const graph = await pipeline.generateGraph(topic);
```

**Workflow:**
1. Check cache (DynamoDB)
2. Search DuckDuckGo
3. Scrape top URLs (parallel)
4. Extract entities (NLP)
5. Build relationships
6. Construct graph
7. Store in DynamoDB

**Timeout**: 25 seconds (5s buffer for Lambda's 30s limit)

### Search Service

Scrapes DuckDuckGo search results (no API key needed):

```typescript
const searcher = new DuckDuckGoSearcher();
const results = await searcher.search(topic, maxResults);
// Returns: Array<{ url, title, snippet }>
```

**Features:**
- HTML scraping (POST request)
- Cheerio parsing
- Result deduplication

### Scraper Service

Fetches and extracts article content:

```typescript
const scraper = new ScraperService(fetcher, extractor);
const content = await scraper.scrapeAll(urls, maxConcurrent);
// Returns: Array<{ url, title, content, wordCount }>
```

**Features:**
- Parallel fetching (5 concurrent)
- Mozilla Readability for content extraction
- Retry with exponential backoff
- Content validation (min/max length)

### Entity Extractor

Extracts and ranks entities using Compromise NLP:

```typescript
const extractor = new EntityExtractor(/* deps */);
const entities = await extractor.extractEntities(contents, maxEntities);
// Returns: Array<{ name, type, frequency, importance }>
```

**Entity Types:**
- Technology, Framework, Library
- Language, Platform, Tool
- Organization, Person, Place

**Ranking Algorithm:**
- Base score: frequency
- Bonus: co-occurrence with other entities
- Bonus: appears in multiple sources
- Total: weighted sum

### Relationship Builder

Discovers relationships via co-occurrence analysis:

```typescript
const builder = new RelationshipBuilder(/* deps */);
const relationships = await builder.buildRelationships(entities, contents);
// Returns: Array<{ source, target, type, weight }>
```

**Relationship Types:**
- `built-on`: foundational dependency
- `used-with`: commonly used together
- `related-to`: general association
- `part-of`: component relationship

**Co-occurrence Levels:**
- **Sentence**: entities in same sentence (weight 1.0)
- **Paragraph**: entities in same paragraph (weight 0.5)

### Graph Builder

Constructs final directed graph:

```typescript
const builder = new GraphBuilder(metricsCalculator, layoutEngine);
const graph = await builder.buildGraph(topic, entities, relationships);
// Returns: Graph with nodes, edges, metadata
```

**Features:**
- Node importance (degree centrality)
- Graph statistics (node count, edge count, avg degree)
- Connected components analysis
- Layout coordinates

## 🗄️ Database Schema

### Nodes Table

```
PK: TOPIC#{normalized-topic}
SK: NODE#{node-id}
Attributes:
  - id, type, label, description
  - importance, frequency, sources
  - metadata, createdAt
GSI: NodeTypeIndex (pk, nodeType)
GSI: ImportanceIndex (pk, importance)
```

### Edges Table

```
PK: TOPIC#{normalized-topic}
SK: EDGE#{source-id}#{target-id}
Attributes:
  - id, source, target, type
  - weight, coOccurrences, metadata
  - createdAt
GSI: RelationTypeIndex (pk, relationType)
GSI: WeightIndex (pk, weight)
```

### Cache Table

```
PK: CACHE#{normalized-topic}
SK: GRAPH
Attributes:
  - graphData (JSON)
  - ttl (Unix timestamp)
  - cachedAt
TTL: Automatic expiration
```

See [DYNAMODB_SCHEMA.md](../DYNAMODB_SCHEMA.md) for full schema documentation.

## 🔧 Configuration Options

### Search Configuration

```typescript
MAX_SEARCH_RESULTS=15      // Number of URLs to search
MAX_CONCURRENT_SCRAPES=5   // Parallel scraping limit
```

**Trade-offs:**
- Higher = more comprehensive
- Lower = faster execution
- Balance for <10s generation time

### Entity Extraction

```typescript
MAX_ENTITIES=50            // Top N entities to keep
```

**Trade-offs:**
- Higher = more detailed graph
- Lower = cleaner visualization
- 50 is optimal for readability

### Caching

```typescript
CACHE_TTL_HOURS=24         // DynamoDB cache expiration
```

**Trade-offs:**
- Longer = fewer regenerations, stale data
- Shorter = fresher data, higher costs
- 24 hours balances freshness and costs

### Pipeline

```typescript
PIPELINE_TIMEOUT_SECONDS=25  // Max execution time
```

**Must be < Lambda timeout (30s)**

## 📝 Logging

Structured JSON logging with log levels:

```typescript
import { logger } from '@/utils/logger';

logger.info('Processing request', { topic, requestId });
logger.warn('Slow scrape detected', { url, duration });
logger.error('Failed to extract entities', error);
```

**Log Levels:**
- `debug`: Verbose debugging information
- `info`: General information
- `warn`: Warning conditions
- `error`: Error conditions

**View logs:**
```bash
# Stream logs in real-time
aws logs tail /aws/lambda/knowledge-map-generate-dev --follow

# Filter errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/knowledge-map-generate-dev \
  --filter-pattern "ERROR"
```

## 🐛 Debugging

### Enable Debug Logging

Update Lambda environment:
```bash
aws lambda update-function-configuration \
  --function-name knowledge-map-generate-dev \
  --environment Variables={LOG_LEVEL=debug,...}
```

### Test Individual Services

```typescript
// Test search service
const searcher = new DuckDuckGoSearcher();
const results = await searcher.search('AI Agents', 10);
console.log(results);

// Test entity extraction
const extractor = new EntityExtractor(/* deps */);
const entities = await extractor.extractEntities(contents, 50);
console.log(entities);
```

### Local DynamoDB GUI

Use DynamoDB Admin:
```bash
npm install -g dynamodb-admin
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin
# Open http://localhost:8001
```

## 🔒 Security

- **Input Validation**: Topic length, format, characters
- **Sanitization**: SQL injection, XSS prevention
- **Error Handling**: No sensitive data in error messages
- **IAM Roles**: Least-privilege access
- **Encryption**: DynamoDB encryption at rest

## 📈 Performance Optimization

### Current Performance

- **Cold Start**: ~2-3 seconds
- **Warm Start**: ~5-10 seconds (end-to-end)
- **Search**: ~1-2 seconds
- **Scraping**: ~3-5 seconds (parallel)
- **Entity Extraction**: ~1-2 seconds
- **Graph Building**: <1 second

### Optimization Tips

1. **Reduce dependencies**: Minimize package size
2. **Increase memory**: 512MB → 1024MB (faster CPU)
3. **Use layers**: Share dependencies across functions
4. **Cache results**: DynamoDB + client caching
5. **Parallel processing**: Already implemented for scraping

## 📊 Monitoring

Key metrics to track:

- **Invocations**: Request volume
- **Duration**: Execution time distribution
- **Errors**: Error rate and types
- **Throttles**: Concurrency limits reached
- **DynamoDB**: Read/write capacity usage

Create CloudWatch dashboard:
```bash
# See cloudwatch-dashboard.json template
aws cloudwatch put-dashboard --dashboard-name knowledge-map --dashboard-body file://cloudwatch-dashboard.json
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Test with mock DynamoDB
npm run test:integration

# Test with real AWS services
npm run test:e2e
```

### Load Testing

```bash
# Using Artillery
npm install -g artillery
artillery run loadtest.yml
```

## 📚 Further Reading

- [Architecture Documentation](../ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [DynamoDB Schema](../DYNAMODB_SCHEMA.md)
- [Frontend Documentation](../client/README.md)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use ESLint and Prettier
3. Add JSDoc comments to public APIs
4. Write unit tests for new features
5. Update documentation

## 📄 License

MIT License - see [LICENSE](../LICENSE) file.
