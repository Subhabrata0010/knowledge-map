# Complete Folder Structure

## Overview

The project follows **clean architecture principles** with clear separation between:
- Business logic
- Infrastructure
- API layer
- Presentation

---

## Backend Structure (`/server`)

```
server/
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── .env.example                         # Environment variables template
├── index.ts                             # Local development server (optional)
│
├── src/
│   ├── handlers/                        # AWS Lambda handlers
│   │   ├── generateMap.ts              # POST /generate-map handler
│   │   ├── getGraph.ts                 # GET /graph/{topic} handler
│   │   └── index.ts                    # Export all handlers
│   │
│   ├── services/                        # Core business logic services
│   │   ├── search/
│   │   │   ├── SearchService.ts        # Search orchestration
│   │   │   ├── DuckDuckGoSearcher.ts   # DuckDuckGo scraper
│   │   │   └── index.ts
│   │   │
│   │   ├── scraper/
│   │   │   ├── ScraperService.ts       # Web scraping orchestration
│   │   │   ├── ContentExtractor.ts     # Mozilla Readability wrapper
│   │   │   ├── HTMLFetcher.ts          # Axios-based fetcher
│   │   │   └── index.ts
│   │   │
│   │   ├── entity/
│   │   │   ├── EntityExtractor.ts      # Entity extraction orchestration
│   │   │   ├── NLPProcessor.ts         # Compromise NLP wrapper
│   │   │   ├── EntityRanker.ts         # Score and rank entities
│   │   │   └── index.ts
│   │   │
│   │   ├── relationship/
│   │   │   ├── RelationshipBuilder.ts  # Relationship detection
│   │   │   ├── CooccurrenceAnalyzer.ts # Co-occurrence patterns
│   │   │   ├── RelationshipScorer.ts   # Weight relationships
│   │   │   └── index.ts
│   │   │
│   │   ├── graph/
│   │   │   ├── GraphBuilder.ts         # Graph construction
│   │   │   ├── GraphMetrics.ts         # Calculate graph metrics
│   │   │   ├── LayoutEngine.ts         # Graph layout hints
│   │   │   └── index.ts
│   │   │
│   │   └── pipeline/
│   │       ├── PipelineOrchestrator.ts # Main pipeline coordinator
│   │       ├── PipelineState.ts        # Pipeline state management
│   │       └── index.ts
│   │
│   ├── db/                              # Database layer
│   │   ├── DynamoDBClient.ts           # DynamoDB connection
│   │   ├── repositories/
│   │   │   ├── NodeRepository.ts       # Node CRUD operations
│   │   │   ├── EdgeRepository.ts       # Edge CRUD operations
│   │   │   ├── CacheRepository.ts      # Cache operations
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── models/                          # TypeScript types and interfaces
│   │   ├── Graph.ts                    # Node, Edge, Graph types
│   │   ├── Entity.ts                   # Entity types
│   │   ├── SearchResult.ts             # Search result types
│   │   ├── ScrapedContent.ts           # Content types
│   │   └── index.ts
│   │
│   ├── utils/                           # Utility functions
│   │   ├── logger.ts                   # Structured logging
│   │   ├── validators.ts               # Input validation
│   │   ├── errors.ts                   # Custom error classes
│   │   ├── normalizer.ts               # String normalization
│   │   ├── retry.ts                    # Retry logic
│   │   ├── parallel.ts                 # Parallel execution helpers
│   │   └── index.ts
│   │
│   ├── config/                          # Configuration
│   │   ├── aws.ts                      # AWS SDK configuration
│   │   ├── environment.ts              # Environment variables
│   │   └── index.ts
│   │
│   └── middleware/                      # Lambda middleware
│       ├── errorHandler.ts             # Error handling middleware
│       ├── validator.ts                # Request validation
│       ├── cors.ts                     # CORS headers
│       └── index.ts
│
├── scripts/                             # Deployment and utility scripts
│   ├── deploy.sh                       # Deploy Lambda functions
│   ├── create-tables.ts                # Create DynamoDB tables
│   ├── seed-data.ts                    # Sample data for testing
│   └── test-pipeline.ts                # Test the full pipeline
│
├── tests/                               # Unit and integration tests
│   ├── unit/
│   │   ├── services/
│   │   ├── db/
│   │   └── utils/
│   └── integration/
│       ├── pipeline.test.ts
│       └── api.test.ts
│
└── serverless.yml                       # Serverless Framework config (optional)
```

---

## Frontend Structure (`/client`)

```
client/
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── next.config.ts                       # Next.js configuration
├── tailwind.config.ts                   # TailwindCSS configuration
├── postcss.config.mjs                   # PostCSS configuration
├── .env.local                           # Environment variables
│
├── app/                                 # Next.js App Router
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Home page (search interface)
│   ├── globals.css                     # Global styles
│   │
│   ├── graph/
│   │   └── [topic]/
│   │       └── page.tsx                # Graph visualization page
│   │
│   └── api/                            # API routes (optional proxies)
│       └── health/
│           └── route.ts                # Health check
│
├── components/                          # React components
│   ├── search/
│   │   ├── SearchBar.tsx               # Search input component
│   │   ├── SearchButton.tsx            # Submit button
│   │   └── index.ts
│   │
│   ├── graph/
│   │   ├── GraphCanvas.tsx             # React Flow wrapper
│   │   ├── CustomNode.tsx              # Custom node component
│   │   ├── CustomEdge.tsx              # Custom edge component
│   │   ├── GraphControls.tsx           # Zoom/pan controls
│   │   ├── MiniMap.tsx                 # Mini map component
│   │   └── index.ts
│   │
│   ├── ui/                             # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   │
│   └── panels/
│       ├── NodeDetailsPanel.tsx        # Show node information
│       ├── GraphStatsPanel.tsx         # Graph statistics
│       └── index.ts
│
├── services/                            # API service layer
│   ├── api/
│   │   ├── client.ts                   # Axios client configuration
│   │   ├── graphApi.ts                 # Graph API calls
│   │   └── index.ts
│   │
│   └── cache/
│       ├── graphCache.ts               # Client-side caching
│       └── index.ts
│
├── hooks/                               # Custom React hooks
│   ├── useGraph.ts                     # Fetch and manage graph data
│   ├── useGraphLayout.ts               # Graph layout logic
│   ├── useNodeSelection.ts             # Node selection state
│   ├── useDebounce.ts                  # Debounce hook
│   └── index.ts
│
├── types/                               # TypeScript types
│   ├── graph.ts                        # Graph data types
│   ├── api.ts                          # API response types
│   ├── node.ts                         # Node types
│   ├── edge.ts                         # Edge types
│   └── index.ts
│
├── lib/                                 # Utility libraries
│   ├── graphTransformer.ts             # Transform API data to React Flow format
│   ├── layoutAlgorithm.ts              # Graph layout calculation
│   ├── colorScheme.ts                  # Node coloring based on type
│   └── index.ts
│
├── constants/                           # Application constants
│   ├── api.ts                          # API endpoints
│   ├── graph.ts                        # Graph configuration
│   └── index.ts
│
└── public/                              # Static assets
    ├── favicon.ico
    └── images/
```

---

## Shared Types (Optional)

For type safety between frontend and backend, you can create a shared types package:

```
shared/
├── package.json
├── tsconfig.json
└── src/
    ├── graph.ts                        # Shared graph types
    ├── api.ts                          # Shared API types
    └── index.ts
```

This can be published as a local npm package or used via path references.

---

## Infrastructure (`/infrastructure`)

```
infrastructure/
├── cloudformation/                      # CloudFormation templates
│   ├── dynamodb.yml                    # DynamoDB tables
│   ├── lambda.yml                      # Lambda functions
│   ├── api-gateway.yml                 # API Gateway
│   └── iam.yml                         # IAM roles and policies
│
├── terraform/                           # Terraform (alternative)
│   ├── main.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   └── variables.tf
│
└── scripts/
    ├── deploy-all.sh                   # Deploy entire stack
    └── destroy-all.sh                  # Tear down stack
```

---

## Root Level Files

```
knowledge-map/
├── README.md                            # Project overview and setup
├── ARCHITECTURE.md                      # System architecture (created above)
├── FOLDER_STRUCTURE.md                  # This file
├── DEPLOYMENT.md                        # Deployment guide (to be created)
├── API_DOCUMENTATION.md                 # API specs (to be created)
├── .gitignore                          # Git ignore rules
├── LICENSE                             # License file
│
├── client/                             # Frontend code
├── server/                             # Backend code
├── infrastructure/                     # IaC templates
└── docs/                               # Additional documentation
    ├── api-examples.md
    ├── local-development.md
    └── troubleshooting.md
```

---

## File Naming Conventions

### TypeScript Files

- **PascalCase** for classes and React components: `GraphCanvas.tsx`, `SearchService.ts`
- **camelCase** for utilities and hooks: `graphTransformer.ts`, `useGraph.ts`
- **kebab-case** for configuration: `api-gateway.yml`

### Folders

- **lowercase** for folders: `services/`, `components/`
- **kebab-case** for multi-word folders: `node-modules/`

### Index Files

Every folder should have an `index.ts` that exports public APIs:

```typescript
// services/search/index.ts
export { SearchService } from './SearchService';
export { DuckDuckGoSearcher } from './DuckDuckGoSearcher';
```

This enables clean imports:
```typescript
import { SearchService } from '@/services/search';
```

---

## Import Aliases

### Backend (`server/tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/handlers/*": ["handlers/*"],
      "@/services/*": ["services/*"],
      "@/db/*": ["db/*"],
      "@/models/*": ["models/*"],
      "@/utils/*": ["utils/*"],
      "@/config/*": ["config/*"]
    }
  }
}
```

### Frontend (`client/tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"],
      "@/services/*": ["services/*"],
      "@/hooks/*": ["hooks/*"],
      "@/types/*": ["types/*"],
      "@/lib/*": ["lib/*"],
      "@/constants/*": ["constants/*"]
    }
  }
}
```

---

## Key Architectural Patterns

### 1. Clean Architecture Layers

```
Handlers (API) → Services (Business Logic) → Repositories (Data) → Database
```

- **Handlers**: Entry points, validation, response formatting
- **Services**: Core business logic, orchestration
- **Repositories**: Data access abstraction
- **Database**: DynamoDB, S3

### 2. Dependency Injection

Services receive dependencies via constructor:

```typescript
class EntityExtractor {
  constructor(
    private nlpProcessor: NLPProcessor,
    private ranker: EntityRanker
  ) {}
}
```

### 3. Interface-Based Design

All services implement interfaces for testability:

```typescript
interface ISearchService {
  search(topic: string): Promise<SearchResult[]>;
}
```

### 4. Single Responsibility

Each service/component has one clear purpose.

---

## Environment Variables

### Backend (`server/.env`)

```
AWS_REGION=us-east-1
DYNAMODB_NODES_TABLE=knowledge-map-nodes
DYNAMODB_EDGES_TABLE=knowledge-map-edges
DYNAMODB_CACHE_TABLE=knowledge-map-cache
S3_BUCKET=knowledge-map-content
LOG_LEVEL=info
MAX_SEARCH_RESULTS=15
MAX_CONCURRENT_SCRAPES=5
CACHE_TTL_HOURS=24
```

### Frontend (`client/.env.local`)

```
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_API_KEY=optional-api-key
```

---

## Development Workflow

### Backend Development

```bash
cd server
npm install
npm run dev          # Run local server
npm run build        # Compile TypeScript
npm run test         # Run tests
npm run deploy       # Deploy to AWS
```

### Frontend Development

```bash
cd client
npm install
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Full Stack Development

Run both simultaneously:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

---

This structure ensures maintainability, scalability, and clear separation of concerns.
