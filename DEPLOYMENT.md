# Knowledge Map - Deployment Guide

This comprehensive guide covers deploying the Internet Knowledge Map system to AWS using serverless infrastructure.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Local Development Setup](#local-development-setup)
- [AWS Deployment](#aws-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Configuration](#configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)

## Prerequisites

### Required Tools

1. **Node.js 18+** - Runtime for Lambda functions and Next.js
   ```bash
   node --version
   ```

2. **AWS CLI** - For deploying infrastructure
   ```bash
   aws --version
   aws configure
   ```

3. **Docker** (Optional) - For local DynamoDB
   ```bash
   docker --version
   ```

4. **Git** - Version control
   ```bash
   git --version
   ```

### AWS Account Setup

1. **Create AWS Account** - If you don't have one: https://aws.amazon.com/
2. **Create IAM User** with permissions for:
   - DynamoDB (full access)
   - Lambda (full access)
   - API Gateway (full access)
   - CloudFormation (full access)
   - S3 (full access for deployments)
   - CloudWatch Logs (write access)
   - IAM (role creation)

3. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
   ```

4. **Verify credentials**:
   ```bash
   aws sts get-caller-identity
   ```

## Architecture Overview

The system consists of:

- **Frontend**: Next.js application hosted on Vercel/Netlify
- **API Layer**: AWS API Gateway (REST API)
- **Compute**: AWS Lambda functions (Node.js 18)
- **Database**: DynamoDB (3 tables: nodes, edges, cache)
- **Monitoring**: CloudWatch Logs

### Infrastructure Stacks

1. **DynamoDB Stack** (`dynamodb-tables.yaml`)
   - Nodes table with GSIs for NodeType and Importance
   - Edges table with GSIs for RelationType and Weight
   - Cache table with TTL enabled

2. **Lambda Stack** (`lambda-functions.yaml`)
   - generateMap function (30s timeout, 512MB memory)
   - getGraph function (10s timeout, 256MB memory)
   - IAM execution role with DynamoDB permissions

3. **API Gateway Stack** (`api-gateway.yaml`)
   - REST API with CORS enabled
   - POST /generate-map endpoint
   - GET /graph/{topic} endpoint
   - Request validation

## Local Development Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd knowledge-map
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# For local development:
# DYNAMODB_ENDPOINT=http://localhost:8000
# AWS_REGION=us-east-1
# DYNAMODB_NODES_TABLE=knowledge-map-nodes-dev
# DYNAMODB_EDGES_TABLE=knowledge-map-edges-dev
# DYNAMODB_CACHE_TABLE=knowledge-map-cache-dev
```

### 3. Start Local DynamoDB

**Option A: Using Docker (Recommended)**

```bash
# Linux/Mac
chmod +x scripts/local-dynamodb.sh
./scripts/local-dynamodb.sh

# Select option 1 to start DynamoDB Local
# Select option 4 to create tables
```

**Option B: Using DynamoDB Downloadable**

```bash
# Download DynamoDB Local
wget https://d1ni2b6xgvw0s0.cloudfront.net/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz

# Start DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -dbPath ./data

# In another terminal, create tables
npm run create-tables-local
```

### 4. Build and Test Backend

```bash
# Compile TypeScript
npm run build

# Run tests (if available)
npm test

# Start local API (using serverless-offline)
npm run dev
```

The API will be available at `http://localhost:3001`

### 5. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 6. Test Locally

```bash
# Test generate-map endpoint
curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Agents"}'

# Test get-graph endpoint
curl http://localhost:3001/graph/ai-agents
```

## AWS Deployment

### Deployment Options

#### Option 1: Automated Deployment Script (Recommended)

**Linux/Mac:**
```bash
cd server
chmod +x scripts/deploy.sh
./scripts/deploy.sh dev us-east-1
```

**Windows (PowerShell):**
```powershell
cd server
.\scripts\deploy.ps1 -Environment dev -AwsRegion us-east-1
```

The script will:
1. Build Lambda functions
2. Package code
3. Upload to S3
4. Deploy CloudFormation stacks
5. Output API Gateway URL

#### Option 2: Manual CloudFormation Deployment

**Step 1: Build Lambda Package**

```bash
cd server

# Install dependencies
npm ci --production=false

# Build TypeScript
npm run build

# Install production dependencies only
rm -rf node_modules
npm ci --production

# Create deployment package
zip -r knowledge-map-lambda-dev.zip dist/ node_modules/
```

**Step 2: Upload to S3**

```bash
# Create S3 bucket
aws s3 mb s3://knowledge-map-deployments-us-east-1 --region us-east-1

# Upload package
aws s3 cp knowledge-map-lambda-dev.zip s3://knowledge-map-deployments-us-east-1/dev/knowledge-map-lambda-dev.zip
```

**Step 3: Deploy DynamoDB Stack**

```bash
aws cloudformation deploy \
  --template-file cloudformation/dynamodb-tables.yaml \
  --stack-name knowledge-map-dynamodb-dev \
  --parameter-overrides \
    Environment=dev \
    BillingMode=PAY_PER_REQUEST \
  --region us-east-1 \
  --tags Environment=dev Application=knowledge-map \
  --no-fail-on-empty-changeset
```

**Step 4: Deploy Lambda Stack**

```bash
aws cloudformation deploy \
  --template-file cloudformation/lambda-functions.yaml \
  --stack-name knowledge-map-lambda-dev \
  --parameter-overrides \
    Environment=dev \
    LambdaCodeBucket=knowledge-map-deployments-us-east-1 \
    LambdaCodeKey=dev/knowledge-map-lambda-dev.zip \
    DynamoDBStackName=knowledge-map-dynamodb-dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags Environment=dev Application=knowledge-map \
  --no-fail-on-empty-changeset
```

**Step 5: Deploy API Gateway Stack**

```bash
aws cloudformation deploy \
  --template-file cloudformation/api-gateway.yaml \
  --stack-name knowledge-map-api-dev \
  --parameter-overrides \
    Environment=dev \
    LambdaStackName=knowledge-map-lambda-dev \
    ApiKeysRequired=false \
  --region us-east-1 \
  --tags Environment=dev Application=knowledge-map \
  --no-fail-on-empty-changeset
```

**Step 6: Get API URL**

```bash
aws cloudformation describe-stacks \
  --stack-name knowledge-map-api-dev \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text \
  --region us-east-1
```

#### Option 3: Serverless Framework

```bash
cd server

# Install Serverless Framework
npm install -g serverless

# Install plugins
npm install --save-dev serverless-plugin-typescript serverless-offline

# Deploy
serverless deploy --stage dev --region us-east-1

# Get outputs
serverless info --stage dev
```

### Verify Deployment

```bash
# Get API URL from CloudFormation
API_URL=$(aws cloudformation describe-stacks \
  --stack-name knowledge-map-api-dev \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text \
  --region us-east-1)

# Test generate-map endpoint
curl -X POST $API_URL/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "Rust Programming"}'

# Should return JSON with graph data
```

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd client
   
   # Login to Vercel
   vercel login
   
   # Set environment variable
   vercel env add NEXT_PUBLIC_API_URL
   # Enter your API Gateway URL
   
   # Deploy
   vercel --prod
   ```

3. **Configure Environment**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = Your API Gateway URL

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**:
   ```bash
   cd client
   
   # Login to Netlify
   netlify login
   
   # Build
   npm run build
   
   # Deploy
   netlify deploy --prod --dir=.next
   ```

3. **Configure Environment**:
   - Go to Netlify Dashboard → Your Site → Site settings → Environment variables
   - Add: `NEXT_PUBLIC_API_URL` = Your API Gateway URL

### Option 3: AWS Amplify

1. **Create Amplify App**:
   ```bash
   # Push code to GitHub
   git push origin main
   ```

2. **Connect to Amplify**:
   - Go to AWS Amplify Console
   - Click "New App" → "Host web app"
   - Connect your GitHub repository
   - Select `client` as root directory
   - Add environment variable: `NEXT_PUBLIC_API_URL`
   - Deploy

## Configuration

### Environment Variables

#### Backend (.env)

```bash
# AWS Configuration
AWS_REGION=us-east-1
NODE_ENV=production

# DynamoDB Tables
DYNAMODB_NODES_TABLE=knowledge-map-nodes-prod
DYNAMODB_EDGES_TABLE=knowledge-map-edges-prod
DYNAMODB_CACHE_TABLE=knowledge-map-cache-prod

# For local development only
DYNAMODB_ENDPOINT=http://localhost:8000

# Search Configuration
MAX_SEARCH_RESULTS=15
MAX_CONCURRENT_SCRAPES=5

# Entity Extraction
MAX_ENTITIES=50

# Caching
CACHE_TTL_HOURS=24

# Pipeline
PIPELINE_TIMEOUT_SECONDS=25

# Logging
LOG_LEVEL=info
```

#### Frontend (.env.local / .env.production)

```bash
# API Gateway URL (from CloudFormation output)
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod

# Optional: API Key if you enabled API key authentication
NEXT_PUBLIC_API_KEY=your-api-key
```

### Custom Domain Setup

#### API Gateway Custom Domain

1. **Register domain** in Route 53
2. **Request ACM certificate** for your domain
3. **Create custom domain** in API Gateway:
   ```bash
   aws apigateway create-domain-name \
     --domain-name api.yourdomain.com \
     --certificate-arn arn:aws:acm:us-east-1:xxxxx:certificate/xxxxx \
     --endpoint-configuration types=REGIONAL
   ```
4. **Create base path mapping**:
   ```bash
   aws apigateway create-base-path-mapping \
     --domain-name api.yourdomain.com \
     --rest-api-id xxxxxxxxxx \
     --stage prod
   ```
5. **Update Route 53** with API Gateway endpoint

## Monitoring and Logging

### CloudWatch Logs

View Lambda logs:
```bash
# generateMap function logs
aws logs tail /aws/lambda/knowledge-map-generate-prod --follow --region us-east-1

# getGraph function logs
aws logs tail /aws/lambda/knowledge-map-get-graph-prod --follow --region us-east-1

# Filter by error level
aws logs filter-log-events \
  --log-group-name /aws/lambda/knowledge-map-generate-prod \
  --filter-pattern "ERROR" \
  --region us-east-1
```

### CloudWatch Metrics

Key metrics to monitor:
- **Lambda Invocations**: Track request volume
- **Lambda Duration**: Monitor execution time (<10s target)
- **Lambda Errors**: Track error rate
- **DynamoDB Read/Write Capacity**: Monitor table usage
- **API Gateway 4xx/5xx Errors**: Track client/server errors

Create CloudWatch Dashboard:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name knowledge-map-prod \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Alarms

Create alarm for Lambda errors:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name knowledge-map-lambda-errors \
  --alarm-description "Alert when Lambda errors exceed threshold" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=knowledge-map-generate-prod
```

## Troubleshooting

### Common Issues

#### 1. Lambda Timeout

**Symptom**: Function times out after 30 seconds

**Solutions**:
- Check CloudWatch logs for slow operations
- Reduce MAX_SEARCH_RESULTS or MAX_CONCURRENT_SCRAPES
- Some websites may be slow to respond
- Consider increasing memory (more memory = faster CPU)

#### 2. DynamoDB Throttling

**Symptom**: ProvisionedThroughputExceededException

**Solutions**:
- Switch to PAY_PER_REQUEST billing mode (default)
- If using PROVISIONED, increase read/write capacity
- Implement exponential backoff (already included)

#### 3. CORS Errors

**Symptom**: Browser blocks requests with CORS error

**Solutions**:
- Ensure API Gateway has CORS enabled
- Check OPTIONS methods are deployed
- Verify frontend domain is allowed in CORS headers

#### 4. API Gateway 403 Forbidden

**Symptom**: 403 error when calling API

**Solutions**:
- If API keys enabled, ensure key is included in header
- Check IAM permissions for Lambda execution role
- Verify API Gateway resource policies

#### 5. Entity Extraction Returns Few Results

**Symptom**: Graph has very few nodes

**Solutions**:
- Topic may be too broad or obscure
- Search results may not contain structured content
- Try more specific or technical topics
- Check entity extraction thresholds in EntityRanker

### Debug Mode

Enable debug logging:

```bash
# Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name knowledge-map-generate-prod \
  --environment Variables={LOG_LEVEL=debug,...}
```

### Testing Individual Components

```bash
# Test Lambda function directly
aws lambda invoke \
  --function-name knowledge-map-generate-prod \
  --payload '{"body": "{\"topic\": \"AI Agents\"}"}' \
  --region us-east-1 \
  response.json

cat response.json
```

## Cost Optimization

### AWS Free Tier Coverage

The system is designed to stay within AWS Free Tier limits for moderate usage:

#### DynamoDB
- **Free Tier**: 25 GB storage, 25 read/write capacity units
- **Usage**: ~1-5 MB per graph, cache with 24hr TTL
- **Estimate**: ~5,000 graphs within free tier

#### Lambda
- **Free Tier**: 1M requests, 400,000 GB-seconds compute
- **Usage**: ~15-25s execution time per graph generation
- **Estimate**: ~16,000 graph generations per month

#### API Gateway
- **Free Tier**: 1M API calls per month (first 12 months)
- **Usage**: 2-3 API calls per graph (generate + get)
- **Estimate**: ~330,000 graph generations per month

#### CloudWatch Logs
- **Free Tier**: 5 GB ingestion, 5 GB storage
- **Usage**: ~50 KB logs per graph
- **Estimate**: ~100,000 graphs per month

### Production Cost Estimates

Beyond free tier:

- **DynamoDB**: $1.25/million writes, $0.25/million reads
- **Lambda**: $0.20 per 1M requests + $0.0000166667 per GB-second
- **API Gateway**: $3.50 per million requests
- **Data Transfer**: $0.09/GB (out of AWS)

**Monthly cost for 100K graphs**:
- DynamoDB: ~$15
- Lambda: ~$25
- API Gateway: ~$10
- CloudWatch: ~$5
- **Total**: ~$55/month

### Optimization Tips

1. **Caching**: 24hr cache reduces repeated queries by 70-80%
2. **Concurrency Limits**: Prevents runaway costs from scraping
3. **Timeout Caps**: 30s max prevents long-running charges
4. **PAY_PER_REQUEST**: No charges when idle
5. **TTL on Cache**: Automatic cleanup prevents storage bloat

### Cost Monitoring

Set up billing alerts:
```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

Example budget.json:
```json
{
  "BudgetName": "knowledge-map-monthly",
  "BudgetLimit": {
    "Amount": "10",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "TagKeyValue": ["user:Application$knowledge-map"]
  }
}
```

## Environment Management

### Multiple Environments

Deploy separate stacks for dev/staging/prod:

```bash
# Development
./scripts/deploy.sh dev us-east-1

# Staging
./scripts/deploy.sh staging us-east-1

# Production
./scripts/deploy.sh prod us-east-1
```

Each environment has:
- Separate DynamoDB tables
- Separate Lambda functions
- Separate API Gateway stages
- Isolated data and configuration

### Stack Updates

To update existing stacks:

```bash
# Make code changes
# Rebuild and redeploy
./scripts/deploy.sh prod us-east-1

# CloudFormation will create a changeset and apply updates
```

### Rollback

If deployment fails:
```bash
# Manual rollback
aws cloudformation cancel-update-stack --stack-name knowledge-map-lambda-prod

# Or delete and redeploy
aws cloudformation delete-stack --stack-name knowledge-map-lambda-prod
./scripts/deploy.sh prod us-east-1
```

## Security Best Practices

1. **API Keys**: Enable for production
2. **Rate Limiting**: Configure in API Gateway usage plans
3. **Input Validation**: Already implemented in validators
4. **HTTPS Only**: Enforced by API Gateway
5. **IAM Roles**: Least privilege (read/write only to specific tables)
6. **Secrets Management**: Use AWS Secrets Manager for sensitive data
7. **VPC**: Consider VPC for Lambda if scraping internal resources

## Next Steps

1. **Set up CI/CD**: Automate deployments with GitHub Actions
2. **Add monitoring dashboard**: Create CloudWatch dashboard
3. **Enable X-Ray**: Add distributed tracing
4. **Configure alerts**: Set up SNS notifications
5. **Add analytics**: Track usage patterns
6. **Implement caching CDN**: Add CloudFront for frontend

## Support

- **Documentation**: See README.md files
- **Architecture**: See ARCHITECTURE.md
- **Schema**: See DYNAMODB_SCHEMA.md
- **Issues**: File GitHub issues

---

**Congratulations!** Your Knowledge Map system is now deployed and ready to generate knowledge graphs! 🚀
