# DynamoDB Schema Design

## Overview

The system uses three DynamoDB tables to store knowledge graph data:
1. **Nodes Table** - Stores graph nodes (entities)
2. **Edges Table** - Stores graph edges (relationships)
3. **Cache Table** - Stores complete graph JSON for fast retrieval

All tables use a single-table design pattern with composite keys.

---

## 1. Nodes Table

**Table Name**: `knowledge-map-nodes`

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String (Partition Key) | `TOPIC#{normalized-topic}` |
| SK | String (Sort Key) | `NODE#{node-id}` |
| id | String | Node identifier |
| name | String | Display name |
| type | String | Node type (technology, framework, etc.) |
| description | String | Description or context |
| frequency | Number | Occurrence frequency |
| importance | Number | Calculated importance score (0-1) |
| metadata | Map | Additional metadata |
| createdAt | String | ISO timestamp |

### Access Patterns

1. **Get all nodes for a topic**
   ```
   PK = TOPIC#{topic}
   SK begins_with NODE#
   ```

2. **Get a specific node**
   ```
   PK = TOPIC#{topic}
   SK = NODE#{node-id}
   ```

### Example Item

```json
{
  "PK": "TOPIC#ai-agents",
  "SK": "NODE#langchain",
  "id": "langchain",
  "name": "LangChain",
  "type": "framework",
  "description": "Framework for developing applications powered by language models",
  "frequency": 23,
  "importance": 0.85,
  "metadata": {
    "sources": [
      "https://python.langchain.com/",
      "https://blog.langchain.dev/"
    ],
    "cooccurrenceCount": 12
  },
  "createdAt": "2026-03-09T10:30:00.000Z"
}
```

---

## 2. Edges Table

**Table Name**: `knowledge-map-edges`

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String (Partition Key) | `TOPIC#{normalized-topic}` |
| SK | String (Sort Key) | `EDGE#{source-id}#{target-id}` |
| id | String | Edge identifier |
| source | String | Source node ID |
| target | String | Target node ID |
| relation | String | Relationship type |
| weight | Number | Relationship strength (0-1) |
| metadata | Map | Additional metadata |
| createdAt | String | ISO timestamp |

### Relationship Types

- `built-on` - One technology built on another
- `related-to` - General association
- `used-with` - Technologies used together
- `part-of` - Component of larger system
- `maintained-by` - Ownership relationship
- `implements` - Implementation relationship
- `extends` - Extension relationship
- `alternative-to` - Alternative technologies

### Access Patterns

1. **Get all edges for a topic**
   ```
   PK = TOPIC#{topic}
   SK begins_with EDGE#
   ```

2. **Get edges for a specific node**
   ```
   Query all edges where source or target matches the node ID
   ```

### Example Item

```json
{
  "PK": "TOPIC#ai-agents",
  "SK": "EDGE#langgraph#langchain",
  "id": "langgraph-langchain",
  "source": "langgraph",
  "target": "langchain",
  "relation": "built-on",
  "weight": 0.92,
  "metadata": {
    "cooccurrenceCount": 15,
    "contexts": ["LangGraph extends LangChain"]
  },
  "createdAt": "2026-03-09T10:30:00.000Z"
}
```

---

## 3. Cache Table

**Table Name**: `knowledge-map-cache`

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String (Partition Key) | `CACHE#{topic-key}` |
| SK | String (Sort Key) | `GRAPH` |
| graph | Map | Complete graph JSON |
| ttl | Number | TTL for automatic expiration (Unix timestamp) |
| createdAt | String | ISO timestamp |

### TTL Configuration

Enable DynamoDB TTL on the `ttl` attribute:
- Automatically deletes cached items after expiration
- Default TTL: 24 hours
- Reduces storage costs

### Access Pattern

1. **Get cached graph**
   ```
   PK = CACHE#{topic-key}
   SK = GRAPH
   ```

### Example Item

```json
{
  "PK": "CACHE#ai-agents",
  "SK": "GRAPH",
  "graph": {
    "topic": "AI Agents",
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "nodeCount": 25,
      "edgeCount": 48,
      "avgDegree": 3.84,
      "components": 1,
      "createdAt": "2026-03-09T10:30:00.000Z",
      "sources": ["https://..."],
      "generationTimeMs": 8500
    }
  },
  "ttl": 1709986800,
  "createdAt": "2026-03-09T10:30:00.000Z"
}
```

---

## Table Configuration

### Read/Write Capacity

**Development/Free Tier**:
- On-Demand billing mode
- No provisioned capacity needed

**Production**:
- Provisioned capacity with auto-scaling
- Read: 5-25 RCU
- Write: 5-25 WCU

### Global Secondary Indexes (GSI)

Currently, no GSIs are required for the primary access patterns.

Future GSIs could include:
- **NodeTypeIndex**: Query nodes by type across topics
- **PopularityIndex**: Query most important nodes

---

## Data Lifecycle

### Write Flow
1. Pipeline generates graph
2. Nodes and edges written in batches (BatchWriteItem)
3. Complete graph cached in Cache table
4. TTL set for automatic expiration

### Read Flow
1. Check Cache table first (fast)
2. If miss, query Nodes and Edges tables
3. Reconstruct graph from nodes and edges
4. Return to client

### Cleanup
- Cache items expire automatically via TTL
- Nodes and edges persist indefinitely
- Manual cleanup script can delete old topics

---

## Cost Estimation (Free Tier)

### Storage
- Average graph: ~100 KB
- 100 topics: ~10 MB
- Free tier: 25 GB
- **Cost**: $0/month

### Reads
- Cache hit: 1 RCU
- Cache miss: 20-50 RCU (nodes + edges)
- Free tier: 2.5M RCU/month
- **Cost**: $0/month

### Writes
- Graph generation: 50-100 WCU
- Free tier: 2.5M WCU/month
- **Cost**: $0/month

**Total Monthly Cost**: $0 (within free tier)

---

## CloudFormation Template

```yaml
Resources:
  NodesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: knowledge-map-nodes
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      Tags:
        - Key: Application
          Value: KnowledgeMap

  EdgesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: knowledge-map-edges
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      Tags:
        - Key: Application
          Value: KnowledgeMap

  CacheTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: knowledge-map-cache
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      Tags:
        - Key: Application
          Value: KnowledgeMap
```

---

## Local Development

Use DynamoDB Local for development:

```bash
# Run DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Set environment variable
export DYNAMODB_ENDPOINT=http://localhost:8000

# Create tables using AWS CLI
aws dynamodb create-table \
  --table-name knowledge-map-nodes \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

---

This schema design supports efficient queries, low costs, and scalable performance.
