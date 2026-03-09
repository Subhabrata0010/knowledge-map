# Internet Knowledge Map - System Architecture

## Overview

The Internet Knowledge Map is a serverless, cloud-native system that transforms topic queries into interactive knowledge graphs by scraping, analyzing, and visualizing web content.

## Architecture Principles

- **Serverless-First**: All compute runs on AWS Lambda (free tier optimized)
- **Event-Driven**: Asynchronous processing pipeline
- **Cost-Optimized**: No paid APIs, uses free search methods
- **Scalable**: Parallel processing for scraping and extraction
- **Stateless**: Lambda functions are stateless, state stored in DynamoDB

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                    (Next.js Frontend)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     AWS API Gateway                          │
│              (REST API + CORS + Rate Limiting)               │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
               │                       │
       ┌───────▼────────┐     ┌───────▼────────┐
       │  POST /generate │     │  GET /graph    │
       │   AWS Lambda    │     │  AWS Lambda    │
       └───────┬─────────┘     └───────┬────────┘
               │                       │
               │                       │
               ├───────────────────────┘
               │
    ┌──────────▼──────────────┐
    │  Pipeline Orchestrator  │
    │    (Lambda Function)    │
    └──────────┬──────────────┘
               │
               │ Spawns Parallel Processing
               │
    ┏━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃                                              ┃
┌───▼──────────┐  ┌──────────────┐  ┌─────────────▼──┐
│Search Service│  │Scraper Service│  │Entity Extractor│
│  (Lambda)    │  │   (Lambda)    │  │   (Lambda)     │
└───┬──────────┘  └──────┬───────┘  └─────────┬──────┘
    │                    │                     │
    │                    │                     │
    └────────────────────┼─────────────────────┘
                         │
              ┌──────────▼───────────┐
              │ Relationship Builder │
              │      (Lambda)        │
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │   Graph Builder      │
              │      (Lambda)        │
              └──────────┬───────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
    ┌────▼────┐                    ┌─────▼─────┐
    │DynamoDB │                    │    S3     │
    │  Tables │                    │  Bucket   │
    │         │                    │           │
    │ • Nodes │                    │ • Cache   │
    │ • Edges │                    │ • Content │
    │ • Cache │                    │           │
    └─────────┘                    └───────────┘
```

## Service Responsibilities

### Frontend Layer (Next.js)

**Purpose**: User interface and visualization

**Responsibilities**:
- Render search interface
- Display knowledge graph using React Flow
- Handle user interactions (zoom, pan, node selection)
- Make API calls to backend
- Manage client-side state
- Provide responsive UI with TailwindCSS

**Technology**: Next.js 14+ (App Router), React Flow, TypeScript

---

### API Gateway

**Purpose**: Single entry point for all backend requests

**Responsibilities**:
- Route requests to appropriate Lambda functions
- Handle CORS configuration
- Apply rate limiting
- Validate request format
- Return standardized responses

**Configuration**:
- REST API
- Regional endpoint (cost optimization)
- Custom domain support (optional)

---

### Lambda Functions

#### 1. Generate Map Handler (`POST /generate-map`)

**Purpose**: Orchestrate the entire knowledge graph generation pipeline

**Responsibilities**:
- Receive topic query
- Check cache for existing graph
- Trigger search service
- Coordinate scraping pipeline
- Monitor progress
- Return graph data

**Timeout**: 30 seconds (API Gateway max)
**Memory**: 512 MB
**Cold Start Optimization**: Keep warm with CloudWatch Events

#### 2. Graph Retrieval Handler (`GET /graph/{topic}`)

**Purpose**: Fetch existing knowledge graph from database

**Responsibilities**:
- Query DynamoDB for nodes and edges
- Format response for frontend
- Cache frequently requested graphs
- Return 404 if not found

**Timeout**: 10 seconds
**Memory**: 256 MB

#### 3. Search Service

**Purpose**: Discover relevant web content for a topic

**Responsibilities**:
- Search the web using DuckDuckGo scraping
- Extract URLs and titles
- Rank results by relevance
- Return top N results (10-15)
- Handle search failures gracefully

**Strategy**:
- Use HTTP requests to DuckDuckGo HTML
- Parse search results page
- No API keys required

#### 4. Scraper Service

**Purpose**: Download and extract content from web pages

**Responsibilities**:
- Fetch HTML content using Axios
- Handle redirects and timeouts
- Extract main article content
- Remove ads, scripts, navigation
- Convert HTML to clean text
- Store raw content in S3 (optional)

**Libraries**:
- Axios for HTTP
- Cheerio for HTML parsing
- Mozilla Readability for content extraction

**Concurrency**: Process 5 pages in parallel

#### 5. Entity Extraction Service

**Purpose**: Identify important entities from text content

**Responsibilities**:
- Parse text using NLP
- Extract named entities (technologies, companies, concepts)
- Score entities by relevance and frequency
- Deduplicate similar entities
- Return structured entity list

**Strategy**:
- Use Compromise NLP for entity recognition
- Apply custom rules for technology terms
- Filter by frequency and co-occurrence
- Identify entity types (tool, framework, concept, company)

#### 6. Relationship Builder Service

**Purpose**: Discover connections between entities

**Responsibilities**:
- Analyze entity co-occurrence in sentences
- Identify relationship types
- Calculate relationship strength
- Build edge list with weights
- Filter weak relationships

**Relationship Types**:
- `built-on`: One technology built on another
- `related-to`: General association
- `used-with`: Technologies used together
- `part-of`: Component of larger system
- `maintained-by`: Ownership relationship

**Algorithm**:
- Sentence-level co-occurrence analysis
- Proximity scoring (closer = stronger relationship)
- Frequency weighting across multiple sources

#### 7. Graph Builder Service

**Purpose**: Construct final knowledge graph structure

**Responsibilities**:
- Combine all entities into nodes
- Combine all relationships into edges
- Calculate node importance (centrality)
- Apply graph layout hints
- Store in DynamoDB
- Generate cache key

**Graph Metrics**:
- Node count
- Edge count
- Average degree
- Connected components

---

## Request Lifecycle

### Generate New Knowledge Map

```
1. User enters topic: "AI Agents"
   ↓
2. Next.js sends: POST /generate-map { topic: "AI Agents" }
   ↓
3. API Gateway validates request
   ↓
4. Lambda: Generate Map Handler starts
   ↓
5. Check DynamoDB cache (key: "ai-agents")
   │
   ├─ If found → Return cached graph (< 500ms)
   │
   └─ If not found → Continue pipeline
      ↓
6. Search Service: Find 10-15 URLs
   ↓
7. Scraper Service: Download & extract content (parallel)
   ↓
8. Entity Extraction: Identify entities from all sources
   ↓
9. Relationship Builder: Find connections
   ↓
10. Graph Builder: Create nodes & edges
    ↓
11. Store in DynamoDB (Nodes + Edges tables)
    ↓
12. Return graph JSON to frontend
    ↓
13. React Flow renders visualization
```

**Total Time**: 8-12 seconds for new graph

---

### Retrieve Existing Graph

```
1. User requests existing graph
   ↓
2. GET /graph/ai-agents
   ↓
3. API Gateway routes to Graph Retrieval Lambda
   ↓
4. Query DynamoDB:
   - Fetch all nodes for topic
   - Fetch all edges for topic
   ↓
5. Format as { nodes: [], edges: [] }
   ↓
6. Return to frontend (< 200ms)
```

---

## Data Flow Between Components

### Search → Scraper

```
Input:  topic: "WebAssembly"
        ↓
Output: [
  { url: "https://...", title: "..." },
  { url: "https://...", title: "..." }
]
        ↓
Scraper receives URL list
```

### Scraper → Entity Extractor

```
Input:  [
  { url: "...", html: "..." },
  { url: "...", html: "..." }
]
        ↓
Output: [
  { url: "...", text: "cleaned article text..." }
]
        ↓
Entity Extractor receives text array
```

### Entity Extractor → Relationship Builder

```
Input:  [
  { url: "...", text: "..." }
]
        ↓
Output: [
  { name: "WebAssembly", type: "technology", frequency: 45 },
  { name: "Rust", type: "language", frequency: 23 },
  ...
]
        ↓
Relationship Builder analyzes co-occurrence
```

### Relationship Builder → Graph Builder

```
Input:  entities: [...],
        sources: [{ text: "...", url: "..." }]
        ↓
Output: edges: [
  { source: "WebAssembly", target: "Rust", relation: "used-with", weight: 0.8 },
  { source: "WebAssembly", target: "JavaScript", relation: "related-to", weight: 0.9 }
]
        ↓
Graph Builder creates final structure
```

### Graph Builder → DynamoDB

```
Input:  nodes: [...],
        edges: [...]
        ↓
Operations:
  - BatchWriteItem to Nodes table
  - BatchWriteItem to Edges table
  - PutItem to Cache table
```

---

## Serverless Design Decisions

### Why Lambda?

1. **Cost**: Pay-per-execution, free tier includes 1M requests/month
2. **Scalability**: Auto-scales to handle concurrent requests
3. **No server management**: Focus on code, not infrastructure
4. **Fast deployment**: Update functions without downtime

### Lambda Configuration

| Function | Timeout | Memory | Concurrency |
|----------|---------|--------|-------------|
| Generate Map | 30s | 512 MB | 10 |
| Graph Retrieval | 10s | 256 MB | 50 |
| Search Service | 15s | 256 MB | 10 |
| Scraper Service | 20s | 512 MB | 20 |
| Entity Extraction | 15s | 512 MB | 10 |
| Relationship Builder | 10s | 256 MB | 10 |
| Graph Builder | 10s | 256 MB | 10 |

### Cold Start Mitigation

- Keep functions warm with CloudWatch Events (ping every 5 minutes)
- Use provisioned concurrency for critical functions
- Optimize bundle size (< 5 MB)
- Minimize dependencies

---

## Caching Strategy

### Three-Tier Caching

#### 1. Client-Side Cache (Browser)

- Store recently viewed graphs in localStorage
- Cache for 1 hour
- Reduces API calls

#### 2. DynamoDB Cache Table

- Store complete graph JSON
- TTL: 24 hours
- Key: normalized topic string
- Faster than re-querying nodes + edges

Schema:
```
PK: topic_key (e.g., "ai-agents")
SK: "CACHE"
graph: { nodes: [], edges: [] }
ttl: Unix timestamp
created_at: ISO timestamp
```

#### 3. CloudFront CDN (Optional)

- Cache GET /graph/{topic} responses
- TTL: 1 hour
- Reduces Lambda invocations

---

## Error Handling Strategy

### Search Service Failures

- **Problem**: DuckDuckGo blocks request
- **Solution**: Retry with exponential backoff, fall back to cached search results

### Scraper Failures

- **Problem**: Website times out or blocks scraper
- **Solution**: Skip URL, continue with remaining sources (require minimum 5 successful)

### Entity Extraction Failures

- **Problem**: Text is too short or incomprehensible
- **Solution**: Skip source, ensure minimum 3 sources analyzed

### Complete Pipeline Failure

- **Problem**: Cannot generate graph
- **Solution**: Return error with partial data if available, suggest retrying

---

## Concurrency & Performance Optimizations

### Parallel Scraping

```
URLs: [url1, url2, url3, ..., url10]
       ↓
Run 5 concurrent scrapes at a time:
  Batch 1: [url1, url2, url3, url4, url5]  → Parallel
  Batch 2: [url6, url7, url8, url9, url10] → Parallel
```

### Parallel Entity Extraction

Process each source independently, then merge results.

### Database Batch Operations

Use DynamoDB BatchWriteItem to write up to 25 items at once.

---

## Security Considerations

### API Gateway

- CORS configuration for frontend domain
- Rate limiting: 100 requests/minute per IP
- API key (optional for production)

### Lambda

- IAM roles with least privilege
- No hardcoded credentials
- Environment variables for configuration

### Input Validation

- Sanitize topic input (max 100 chars)
- Validate URLs before scraping
- Block dangerous domains (localhost, internal IPs)

### DynamoDB

- Encryption at rest enabled
- VPC endpoints for private access (optional)

---

## Monitoring & Observability

### CloudWatch Metrics

- Lambda invocation count
- Lambda error rate
- Lambda duration (p50, p90, p99)
- API Gateway 4xx/5xx errors

### Custom Metrics

- Graph generation success rate
- Average graph size (nodes + edges)
- Cache hit rate
- Scraping failure rate

### Logging

- Structured JSON logs
- Log levels: INFO, WARN, ERROR
- Include request ID for tracing

### Alarms

- Alert on error rate > 5%
- Alert on Lambda timeout > 10%
- Alert on DynamoDB throttling

---

## Cost Optimization

### AWS Free Tier Usage

| Service | Free Tier | Expected Usage |
|---------|-----------|----------------|
| Lambda | 1M requests, 400K GB-seconds | ~50K requests/month |
| API Gateway | 1M requests | ~50K requests/month |
| DynamoDB | 25 GB storage, 25 WCU, 25 RCU | ~5 GB storage |
| S3 | 5 GB storage, 20K GET, 2K PUT | ~2 GB storage |
| CloudWatch | 10 custom metrics, 5GB logs | Within limits |

**Expected Monthly Cost**: $0 (within free tier)

### After Free Tier

- Lambda: ~$0.50/month
- DynamoDB: ~$1-2/month
- S3: ~$0.50/month
- **Total**: ~$3/month for moderate usage

---

## Scalability Considerations

### Current Architecture Handles

- **Users**: 100-500 concurrent users
- **Requests**: 100K graphs/month
- **Data**: 10K topics, 100K nodes, 500K edges

### Scaling Beyond Free Tier

1. Enable DynamoDB auto-scaling
2. Increase Lambda concurrency limits
3. Add CloudFront CDN
4. Implement SQS queue for async processing
5. Use Step Functions for complex workflows

---

## Technology Choices: Rationale

| Technology | Reason |
|------------|--------|
| Next.js | Fast, SEO-friendly, great DX, App Router for modern patterns |
| React Flow | Best graph visualization library for React |
| AWS Lambda | Serverless, cost-effective, no server management |
| DynamoDB | Fast, serverless, predictable performance, NoSQL fits graph data |
| Cheerio | Fast HTML parsing, jQuery-like API |
| Mozilla Readability | Best content extraction algorithm |
| Compromise NLP | Lightweight NLP, runs in Node.js, no Python required |
| TypeScript | Type safety, better DX, fewer runtime errors |

---

## Alternative Architectural Patterns Considered

### 1. Synchronous Pipeline (Rejected)

- **Problem**: Would exceed API Gateway 30s timeout
- **Solution**: Async with immediate response + polling

### 2. Container-Based (ECS/Fargate) (Rejected)

- **Problem**: Higher cost, always-on containers
- **Solution**: Lambda for pay-per-use model

### 3. Python Backend (Rejected)

- **Problem**: Harder to share types with frontend
- **Solution**: TypeScript end-to-end

### 4. GraphQL API (Rejected)

- **Problem**: Overkill for simple API
- **Solution**: REST API with clear endpoints

---

## Future Architecture Enhancements

### Phase 2: ML-Enhanced Extraction

- Add optional LLM-based entity extraction
- Semantic relationship inference
- Automatic summarization

### Phase 3: Real-Time Updates

- WebSocket support for progress updates
- Stream results as they're discovered

### Phase 4: Advanced Analytics

- Trend detection across topics
- Topic clustering
- Graph comparison

### Phase 5: Multi-Region

- Deploy to multiple AWS regions
- Route 53 for geo-routing
- Global DynamoDB tables

---

## Development vs Production Architecture

### Development (Local)

```
Next.js (localhost:3000)
     ↓
Local API (localhost:3001)
     ↓
Local DynamoDB (docker)
     ↓
Mock data / sample responses
```

### Production (AWS)

```
Next.js (Vercel)
     ↓
API Gateway (AWS)
     ↓
Lambda Functions
     ↓
DynamoDB (AWS)
```

---

This architecture ensures the system is production-ready, cost-optimized, and scalable while maintaining simplicity and developer experience.
