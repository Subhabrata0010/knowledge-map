# Knowledge Map API Documentation

Complete API reference for the Internet Knowledge Map backend.

## Base URL

```
Production: https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
Development: http://localhost:3001
```

## Authentication

API keys are optional. If enabled:

```bash
curl -H "X-API-Key: your-api-key" https://api.example.com/generate-map
```

## Endpoints

### POST /generate-map

Generate a new knowledge graph from a topic query.

#### Request

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key (optional)
```

**Body:**
```json
{
  "topic": "AI Agents"
}
```

**Parameters:**

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| topic | string | Yes | Topic to generate graph for | 1-200 characters, alphanumeric + spaces |

#### Response

**Success (200 OK):**

```json
{
  "graph": {
    "metadata": {
      "topic": "AI Agents",
      "generatedAt": "2025-01-15T10:30:00.000Z",
      "nodeCount": 42,
      "edgeCount": 68,
      "averageDegree": 3.2,
      "maxDepth": 4,
      "connectedComponents": 1
    },
    "nodes": [
      {
        "id": "ai-agents",
        "type": "technology",
        "label": "AI Agents",
        "description": "Autonomous artificial intelligence systems that can perceive, reason, and act in dynamic environments",
        "importance": 0.95,
        "frequency": 127,
        "sources": 12,
        "metadata": {
          "category": "Artificial Intelligence",
          "relatedTopics": ["Machine Learning", "Natural Language Processing"]
        }
      },
      {
        "id": "machine-learning",
        "type": "technology",
        "label": "Machine Learning",
        "description": "Field of study enabling computers to learn without explicit programming",
        "importance": 0.88,
        "frequency": 95,
        "sources": 11
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "ai-agents",
        "target": "machine-learning",
        "type": "built-on",
        "weight": 0.87,
        "coOccurrences": 45,
        "metadata": {
          "strength": "strong",
          "context": "AI agents leverage machine learning algorithms"
        }
      },
      {
        "id": "edge-2",
        "source": "ai-agents",
        "target": "reinforcement-learning",
        "type": "used-with",
        "weight": 0.72,
        "coOccurrences": 32
      }
    ]
  },
  "cached": false,
  "processingTime": 8.234
}
```

**Error Responses:**

*400 Bad Request:*
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Topic must be between 1 and 200 characters",
    "details": {
      "field": "topic",
      "value": "",
      "constraint": "length"
    }
  }
}
```

*500 Internal Server Error:*
```json
{
  "error": {
    "code": "PIPELINE_ERROR",
    "message": "Failed to generate knowledge graph",
    "details": {
      "stage": "entity_extraction",
      "reason": "NLP processing timeout"
    }
  }
}
```

#### Examples

**cURL:**
```bash
curl -X POST https://api.example.com/generate-map \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"topic": "AI Agents"}'
```

**JavaScript (Axios):**
```javascript
import axios from 'axios';

const response = await axios.post(
  'https://api.example.com/generate-map',
  { topic: 'AI Agents' },
  {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    }
  }
);

console.log(response.data.graph);
```

**Python (Requests):**
```python
import requests

response = requests.post(
    'https://api.example.com/generate-map',
    json={'topic': 'AI Agents'},
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key'
    }
)

graph = response.json()['graph']
print(f"Generated graph with {graph['metadata']['nodeCount']} nodes")
```

**PowerShell:**
```powershell
$headers = @{
    'Content-Type' = 'application/json'
    'X-API-Key' = 'your-api-key'
}

$body = @{
    topic = 'AI Agents'
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Method Post `
    -Uri 'https://api.example.com/generate-map' `
    -Headers $headers `
    -Body $body

$response.graph.metadata
```

---

### GET /graph/{topic}

Retrieve a previously generated knowledge graph from cache.

#### Request

**Headers:**
```
X-API-Key: your-api-key (optional)
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| topic | string | Yes | Normalized topic name (lowercase, hyphens) |

#### Response

**Success (200 OK):**

```json
{
  "graph": {
    // Same structure as generate-map response
  },
  "cached": true,
  "cacheAge": 7200,
  "expiresIn": 79200
}
```

**Additional Fields:**

| Field | Type | Description |
|-------|------|-------------|
| cached | boolean | Always true for this endpoint |
| cacheAge | number | Age of cached data in seconds |
| expiresIn | number | Seconds until cache expires |

**Error Responses:**

*404 Not Found:*
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Knowledge graph not found for topic: ai-agents",
    "details": {
      "topic": "ai-agents",
      "suggestion": "Use POST /generate-map to create this graph"
    }
  }
}
```

*500 Internal Server Error:*
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to retrieve graph from database",
    "details": {
      "operation": "query",
      "table": "cache"
    }
  }
}
```

#### Examples

**cURL:**
```bash
curl https://api.example.com/graph/ai-agents \
  -H "X-API-Key: your-api-key"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get(
  'https://api.example.com/graph/ai-agents',
  {
    headers: { 'X-API-Key': 'your-api-key' }
  }
);

console.log(`Cache age: ${response.data.cacheAge}s`);
```

**Python (Requests):**
```python
response = requests.get(
    'https://api.example.com/graph/ai-agents',
    headers={'X-API-Key': 'your-api-key'}
)

if response.status_code == 404:
    print("Graph not cached, need to generate")
else:
    graph = response.json()['graph']
```

---

## Data Models

### Graph

The main graph object containing metadata, nodes, and edges.

```typescript
interface Graph {
  metadata: GraphMetadata;
  nodes: Node[];
  edges: Edge[];
}
```

### GraphMetadata

Statistics about the generated graph.

```typescript
interface GraphMetadata {
  topic: string;              // Original topic query
  generatedAt: string;        // ISO 8601 timestamp
  nodeCount: number;          // Total nodes
  edgeCount: number;          // Total edges
  averageDegree: number;      // Avg edges per node
  maxDepth: number;           // Max distance from root
  connectedComponents: number; // Number of subgraphs
}
```

### Node

Represents an entity in the knowledge graph.

```typescript
interface Node {
  id: string;                 // Unique identifier (kebab-case)
  type: NodeType;             // Entity type
  label: string;              // Display name
  description?: string;       // Description/definition
  importance: number;         // 0-1, centrality score
  frequency: number;          // Mention count
  sources: number;            // Number of sources
  metadata?: Record<string, any>; // Additional data
}
```

**NodeType Enum:**
```typescript
type NodeType =
  | 'technology'
  | 'framework'
  | 'library'
  | 'language'
  | 'platform'
  | 'tool'
  | 'concept'
  | 'organization'
  | 'person'
  | 'place'
  | 'other';
```

### Edge

Represents a relationship between nodes.

```typescript
interface Edge {
  id: string;                 // Unique identifier
  source: string;             // Source node ID
  target: string;             // Target node ID
  type: RelationType;         // Relationship type
  weight: number;             // 0-1, strength score
  coOccurrences: number;      // Co-occurrence count
  metadata?: Record<string, any>; // Additional data
}
```

**RelationType Enum:**
```typescript
type RelationType =
  | 'built-on'       // Foundational dependency
  | 'used-with'      // Commonly used together
  | 'related-to'     // General association
  | 'part-of'        // Component relationship
  | 'extends'        // Inheritance/extension
  | 'implements'     // Interface implementation
  | 'depends-on'     // Runtime dependency
  | 'similar-to';    // Semantic similarity
```

---

## Error Codes

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| VALIDATION_ERROR | 400 | Invalid request parameters | No |
| NOT_FOUND | 404 | Graph not found in cache | No |
| SCRAPING_ERROR | 500 | Failed to scrape web content | Yes |
| EXTRACTION_ERROR | 500 | Entity extraction failed | Yes |
| PIPELINE_ERROR | 500 | Pipeline processing failed | Yes |
| DATABASE_ERROR | 500 | DynamoDB operation failed | Yes |
| TIMEOUT_ERROR | 500 | Operation timed out | Yes |
| INTERNAL_ERROR | 500 | Unexpected server error | Yes |

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp?: string;
    requestId?: string;
  };
}
```

---

## Rate Limiting

### Default Limits

- **Free Tier**: 100 requests/hour per IP
- **API Key**: 1,000 requests/hour
- **Burst**: 10 requests/second

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1704067200
```

### Exceeded Response

**429 Too Many Requests:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "resetAt": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

---

## Caching Strategy

### Three-Tier Cache

1. **Client (localStorage)**: 1 hour TTL
2. **DynamoDB Cache Table**: 24 hour TTL
3. **DynamoDB Nodes/Edges**: Permanent storage

### Cache Headers

```
Cache-Control: public, max-age=3600
ETag: "graph-ai-agents-20250115"
Last-Modified: Wed, 15 Jan 2025 10:30:00 GMT
```

### Cache Invalidation

Cached graphs expire after 24 hours. To force regeneration:

```bash
# Delete cached graph (admin only)
curl -X DELETE https://api.example.com/graph/ai-agents \
  -H "X-API-Key: admin-key"
```

---

## Webhooks

### Register Webhook

Subscribe to graph generation events:

```bash
POST /webhooks
{
  "url": "https://your-app.com/webhook",
  "events": ["graph.generated", "graph.failed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "graph.generated",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": {
    "topic": "AI Agents",
    "nodeCount": 42,
    "edgeCount": 68
  }
}
```

---

## Best Practices

### 1. Check Cache First

Always check GET /graph/{topic} before generating:

```javascript
async function getOrGenerateGraph(topic) {
  try {
    // Try to get cached graph
    return await GraphApi.getGraph(topic);
  } catch (error) {
    if (error.response?.status === 404) {
      // Not cached, generate new
      return await GraphApi.generateMap(topic);
    }
    throw error;
  }
}
```

### 2. Handle Timeouts

Generation can take up to 30 seconds:

```javascript
const response = await axios.post(
  '/generate-map',
  { topic },
  { timeout: 35000 } // 35s timeout
);
```

### 3. Implement Retry Logic

Use exponential backoff for 5xx errors:

```javascript
async function generateWithRetry(topic, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await GraphApi.generateMap(topic);
    } catch (error) {
      if (error.response?.status >= 500 && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      throw error;
    }
  }
}
```

### 4. Validate Topics

Validate before sending:

```javascript
function isValidTopic(topic) {
  return topic.length > 0 &&
         topic.length <= 200 &&
         /^[a-zA-Z0-9\s\-_]+$/.test(topic);
}
```

### 5. Monitor Performance

Track response times:

```javascript
const start = Date.now();
const response = await GraphApi.generateMap(topic);
const duration = Date.now() - start;

if (duration > 10000) {
  console.warn(`Slow generation: ${duration}ms`);
}
```

---

## SDK Examples

### TypeScript SDK

```typescript
import { KnowledgeMapClient } from 'knowledge-map-sdk';

const client = new KnowledgeMapClient({
  apiUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
});

// Generate graph
const graph = await client.generateGraph('AI Agents');

// Get cached graph
const cachedGraph = await client.getGraph('ai-agents');

// Stream generation (future)
client.generateGraphStream('AI Agents', (event) => {
  console.log(`Progress: ${event.stage}`);
});
```

### React Hook

```typescript
function useKnowledgeMap(topic: string) {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGraph() {
      setLoading(true);
      try {
        // Try cache first
        const response = await GraphApi.getGraph(topic);
        setGraph(response.graph);
      } catch (err) {
        if (err.response?.status === 404) {
          // Generate new
          const response = await GraphApi.generateMap(topic);
          setGraph(response.graph);
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, [topic]);

  return { graph, loading, error };
}
```

---

## Testing

### Postman Collection

Import this collection for easy testing:

[Download Postman Collection](./postman_collection.json)

### Test Topics

Good topics for testing:

- **Fast (<5s)**: "React", "Python", "Docker"
- **Medium (5-10s)**: "Machine Learning", "Microservices"
- **Slow (10-25s)**: "Artificial Intelligence", "Quantum Computing"

### Curl Test Script

```bash
#!/bin/bash

API_URL="https://api.example.com"
API_KEY="your-api-key"
TOPIC="AI Agents"

echo "Testing generate-map endpoint..."
curl -X POST "$API_URL/generate-map" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"topic\": \"$TOPIC\"}" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

echo "\nTesting get-graph endpoint..."
NORMALIZED=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
curl "$API_URL/graph/$NORMALIZED" \
  -H "X-API-Key: $API_KEY" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"
```

---

## Support

- **Documentation**: https://docs.knowledgemap.io
- **API Status**: https://status.knowledgemap.io
- **Issues**: https://github.com/yourusername/knowledge-map/issues
- **Email**: api-support@knowledgemap.io

---

**Version**: 1.0.0  
**Last Updated**: January 15, 2025
