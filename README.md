# Internet Knowledge Map 🗺️

Generate interactive knowledge graphs from any topic using AI-powered web scraping and NLP entity extraction.

![Knowledge Map Demo](https://via.placeholder.com/800x400?text=Knowledge+Map+Demo)

## 🌟 Features

- **Zero-Config Intelligence**: Enter any topic and get a knowledge graph in seconds
- **Real-Time Web Scraping**: Pulls fresh data from top search results
- **NLP Entity Extraction**: Uses Compromise NLP to identify key entities and relationships
- **Interactive Visualization**: Explore graphs with zoom, pan, and node selection
- **Smart Caching**: Three-tier caching strategy (client → DynamoDB → generated)
- **Serverless Architecture**: Built on AWS Lambda for automatic scaling
- **AWS Free Tier Optimized**: Designed to stay within free tier limits

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- AWS Account (for deployment)
- Docker (optional, for local DynamoDB)

### Local Development

1. **Clone repository**:
   ```bash
   git clone <your-repo-url>
   cd knowledge-map
   ```

2. **Backend setup**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start local DynamoDB** (optional):
   ```bash
   docker run -p 8000:8000 amazon/dynamodb-local
   npm run create-tables-local
   ```

4. **Start backend**:
   ```bash
   npm run dev
   # API available at http://localhost:3001
   ```

5. **Frontend setup** (in new terminal):
   ```bash
   cd client
   npm install
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
   npm run dev
   # Frontend available at http://localhost:3000
   ```

6. **Open browser** to `http://localhost:3000` and search for a topic!

### Deploy to AWS

```bash
cd server
./scripts/deploy.sh dev us-east-1
# Script will output your API Gateway URL
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
knowledge-map/
├── server/                 # Backend (AWS Lambda)
│   ├── src/
│   │   ├── handlers/      # Lambda entry points
│   │   ├── services/      # Business logic
│   │   ├── db/            # DynamoDB repositories
│   │   ├── models/        # TypeScript types
│   │   ├── utils/         # Helpers
│   │   └── middleware/    # Request/response handling
│   ├── cloudformation/    # Infrastructure as Code
│   ├── scripts/           # Deployment scripts
│   └── package.json
├── client/                # Frontend (Next.js)
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   ├── services/         # API client
│   ├── types/            # TypeScript types
│   └── package.json
├── ARCHITECTURE.md        # System architecture
├── DEPLOYMENT.md          # Deployment guide
├── DYNAMODB_SCHEMA.md     # Database schema
└── README.md             # This file
```

## 🏗️ Architecture

```
┌─────────────┐
│   Next.js   │  Frontend: Search UI + Graph Visualization
│  (Vercel)   │  Tech: React Flow, TailwindCSS
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────┐
│ API Gateway │  REST API: /generate-map, /graph/{topic}
│   (REST)    │  Features: CORS, Validation, Rate limiting
└──────┬──────┘
       │
       ├────────────┬────────────┐
       │            │            │
┌──────▼─────┐ ┌───▼─────┐  ┌───▼─────┐
│ Lambda:    │ │ Lambda: │  │ Cache   │
│ Generate   │ │ Get     │  │ Layer   │
│ Map (30s)  │ │ Graph   │  │ (24hr)  │
└─────┬──────┘ └────┬────┘  └────┬────┘
      │             │            │
      │    ┌────────▼────────────▼───┐
      │    │    DynamoDB (NoSQL)     │
      │    │  • Nodes table (GSIs)   │
      │    │  • Edges table (GSIs)   │
      │    │  • Cache table (TTL)    │
      │    └─────────────────────────┘
      │
┌─────▼──────────────────────┐
│  Pipeline Orchestrator     │
│  1. Search DuckDuckGo      │
│  2. Scrape top 15 URLs     │
│  3. Extract entities (NLP) │
│  4. Build relationships    │
│  5. Compute graph metrics  │
└────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Graph Viz**: React Flow
- **HTTP Client**: Axios
- **Language**: TypeScript 5

### Backend
- **Runtime**: Node.js 18 (AWS Lambda)
- **Language**: TypeScript 5
- **NLP**: Compromise 14
- **Scraping**: Cheerio, Mozilla Readability, JSDOM
- **Database**: AWS DynamoDB
- **API**: AWS API Gateway (REST)

### Infrastructure
- **IaC**: CloudFormation / Serverless Framework
- **Compute**: AWS Lambda (serverless)
- **Database**: DynamoDB (NoSQL)
- **Storage**: S3 (deployments)
- **Monitoring**: CloudWatch Logs
- **Deployment**: AWS CLI / Serverless CLI

## 📊 How It Works

### 1. Search Phase
- User enters a topic (e.g., "AI Agents")
- Backend searches DuckDuckGo for top results
- Scrapes HTML from top 15 URLs in parallel

### 2. Extraction Phase
- Cleans HTML using Mozilla Readability
- Extracts entities with Compromise NLP:
  - People, Organizations, Places
  - Technologies, Frameworks, Libraries
  - Acronyms and proper nouns
- Ranks entities by frequency + co-occurrence + source diversity

### 3. Relationship Phase
- Analyzes entity co-occurrences in sentences/paragraphs
- Scores relationships by proximity and frequency
- Infers relationship types (built-on, used-with, related-to)

### 4. Graph Building Phase
- Constructs directed graph with weighted edges
- Computes node importance (degree centrality)
- Applies layout algorithm (circular/hierarchical)
- Calculates graph statistics

### 5. Caching & Response
- Stores in DynamoDB (nodes, edges)
- Caches full graph for 24 hours
- Client caches for 1 hour
- Returns JSON to frontend

### 6. Visualization
- Transforms data to React Flow format
- Renders interactive graph with:
  - Color-coded nodes by type
  - Weighted edge thickness
  - Pan, zoom, drag interactions
  - Node selection panel
  - Graph statistics overlay

## 🎯 Example Topics

Try these topics to see the system in action:

- **Technology**: "Next.js", "Rust Programming", "WebAssembly"
- **AI/ML**: "AI Agents", "Large Language Models", "Machine Learning"
- **Concepts**: "Serverless Architecture", "Microservices", "JAMstack"
- **Frameworks**: "React", "Vue.js", "Tailwind CSS"
- **Languages**: "TypeScript", "Python", "Go"

## 💡 Use Cases

- **Research**: Quickly understand relationships in a new domain
- **Learning**: Visualize connections between concepts
- **Documentation**: Generate knowledge graphs for technical topics
- **Content Creation**: Find related topics for articles/videos
- **SEO**: Discover keyword relationships and entity networks

## 🔒 Security

- **Input Validation**: All inputs sanitized and validated
- **Error Handling**: Graceful degradation with user-friendly messages
- **Rate Limiting**: Configurable via API Gateway usage plans
- **CORS**: Properly configured for cross-origin requests
- **IAM**: Least-privilege roles for Lambda functions
- **Encryption**: DynamoDB encryption at rest enabled

## 💰 Cost Analysis

### AWS Free Tier (Monthly)
- **Lambda**: 1M requests, 400,000 GB-seconds → ~16K graphs
- **DynamoDB**: 25 GB storage, 200M requests → ~5K unique graphs
- **API Gateway**: 1M calls (first 12 months) → ~330K graphs
- **CloudWatch**: 5 GB logs → ~100K graphs

### Beyond Free Tier
- ~$0.0055 per graph generation
- $55/month for 10K graphs
- $550/month for 100K graphs

See [DEPLOYMENT.md](./DEPLOYMENT.md#cost-optimization) for optimization tips.

## 📈 Performance

- **Generation Time**: 5-10 seconds per graph
- **Lambda Memory**: 512 MB (generateMap), 256 MB (getGraph)
- **Lambda Timeout**: 30s (generateMap), 10s (getGraph)
- **Cache Hit Rate**: ~70-80% for popular topics
- **Concurrent Scrapes**: 5 parallel requests
- **Max Entities**: Top 50 most relevant

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```bash
AWS_REGION=us-east-1
DYNAMODB_NODES_TABLE=knowledge-map-nodes-prod
DYNAMODB_EDGES_TABLE=knowledge-map-edges-prod
DYNAMODB_CACHE_TABLE=knowledge-map-cache-prod
MAX_SEARCH_RESULTS=15
MAX_CONCURRENT_SCRAPES=5
MAX_ENTITIES=50
CACHE_TTL_HOURS=24
LOG_LEVEL=info
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_KEY=optional
```

## 📚 Documentation

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Detailed system architecture
- [**DEPLOYMENT.md**](./DEPLOYMENT.md) - Deployment guide (local & AWS)
- [**DYNAMODB_SCHEMA.md**](./DYNAMODB_SCHEMA.md) - Database schema design
- [**server/README.md**](./server/README.md) - Backend documentation
- [**client/README.md**](./client/README.md) - Frontend documentation

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Roadmap

### Phase 1: Core MVP ✅
- [x] DuckDuckGo search integration
- [x] Web scraping pipeline
- [x] NLP entity extraction
- [x] Relationship discovery
- [x] DynamoDB storage
- [x] Interactive graph visualization
- [x] Three-tier caching

### Phase 2: Enhanced Intelligence (Q2 2025)
- [ ] OpenAI GPT-4 integration for entity classification
- [ ] Anthropic Claude for relationship inference
- [ ] Semantic similarity clustering
- [ ] Multi-language support

### Phase 3: Advanced Features (Q3 2025)
- [ ] User accounts and saved graphs
- [ ] Graph versioning and history
- [ ] Export formats (PNG, SVG, JSON)
- [ ] Collaborative editing
- [ ] Graph merging

### Phase 4: Enterprise (Q4 2025)
- [ ] Custom data sources
- [ ] Private knowledge bases
- [ ] API webhooks
- [ ] Advanced analytics

## 🐛 Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Lambda timeout | Reduce MAX_SEARCH_RESULTS or MAX_CONCURRENT_SCRAPES |
| Few entities extracted | Topic may be too broad; try more specific queries |
| CORS errors | Ensure API Gateway CORS is enabled |
| DynamoDB throttling | Switch to PAY_PER_REQUEST billing mode |

See [DEPLOYMENT.md#troubleshooting](./DEPLOYMENT.md#troubleshooting) for detailed solutions.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Compromise NLP** - Natural language processing
- **Mozilla Readability** - Content extraction
- **React Flow** - Graph visualization
- **Next.js** - React framework
- **AWS** - Cloud infrastructure

## 📧 Contact

- **Issues**: https://github.com/yourusername/knowledge-map/issues
- **Email**: your.email@example.com
- **Twitter**: @yourusername

---

**Built with ❤️ using Next.js, TypeScript, and AWS**

**⭐ If you find this project useful, please star it on GitHub!**