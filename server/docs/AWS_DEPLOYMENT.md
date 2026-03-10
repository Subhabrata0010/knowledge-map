# Deploy FREE HuggingFace Models on AWS
# Two options: SageMaker (easier) or Lambda Container (cheaper)

## OPTION 1: AWS SageMaker (Recommended - easiest)

### 1. Deploy model to SageMaker
```bash
# Install dependencies
pip install sagemaker huggingface_hub

# Deploy script
python deploy-hf-sagemaker.py
```

### 2. Update .env with endpoint
```env
USE_HF_MODEL=true
HF_ENDPOINT_URL=https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/knowledge-map-llama/invocations
HF_MODEL_NAME=meta-llama/Llama-3.2-3B-Instruct
```

### 3. Cost: ~$0.10/hour with ml.g4dn.xlarge instance
- Can use spot instances for 70% discount
- Auto-scale down to 0 when not in use

---

## OPTION 2: Lambda Container (Cheapest - pay per use)

### 1. Build Lambda container with HuggingFace model
```bash
cd server/docker
docker build -f Dockerfile.hf-lambda -t knowledge-map-hf:latest .

# Push to ECR
aws ecr create-repository --repository-name knowledge-map-hf
docker tag knowledge-map-hf:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/knowledge-map-hf:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/knowledge-map-hf:latest
```

### 2. Create Lambda with container
```bash
aws lambda create-function \
  --function-name knowledge-map-hf-inference \
  --package-type Image \
  --code ImageUri=123456789.dkr.ecr.us-east-1.amazonaws.com/knowledge-map-hf:latest \
  --role arn:aws:iam::123456789:role/lambda-execution-role \
  --memory-size 10240 \
  --timeout 60 \
  --ephemeral-storage Size=10240
```

### 3. Update .env
```env
USE_HF_MODEL=true
HF_ENDPOINT_URL=https://lambda-url.us-east-1.on.aws/invoke
HF_LOCAL_MODEL=true
```

### 4. Cost: $0.0009 per request (WAY cheaper!)
- Only pay when generating graphs
- No idle costs

---

## RECOMMENDED FREE MODELS

### Best for Knowledge Extraction:
1. **meta-llama/Llama-3.2-3B-Instruct** (3B params)
   - Fast, accurate, free
   - Best balance of speed/quality

2. **mistralai/Mistral-7B-Instruct-v0.3** (7B params)
   - Higher quality
   - Slightly slower

3. **microsoft/Phi-3-mini-4k-instruct** (3.8B params)
   - Very fast
   - Good for simple topics

### Smallest/Fastest:
4. **TinyLlama/TinyLlama-1.1B-Chat-v1.0** (1.1B params)
   - Super fast
   - Lower quality but good enough

---

## PRE-SCRAPING SETUP

### 1. Add cron job to serverless.yml
```yaml
functions:
  preScrape:
    handler: src/handlers/preScrape.handler
    timeout: 900  # 15 minutes
    memorySize: 2048
    events:
      - schedule:
          rate: rate(24 hours)
          enabled: true
          description: 'Pre-scrape popular topics daily'
```

### 2. Configure topics in .env
```env
ENABLE_PRE_SCRAPING=true
PRE_SCRAPE_TOPICS=javascript,python,react,nodejs,aws,docker,kubernetes,typescript,ai,machine learning,web development,cloud computing,devops,microservices,api design
PRE_SCRAPE_INTERVAL_HOURS=24
```

### 3. Deploy
```bash
cd server
npm run deploy
```

### Result: INSTANT responses for pre-scraped topics!
- First user: <1s (served from cache)
- New topics: 5-8s (real-time scraping)
- Popular topics: Always cached

---

## WHY THIS IS LIKE PERPLEXITY

Perplexity's architecture:
1. ✅ Pre-indexed content (you: pre-scraped topics)
2. ✅ LLM for entity extraction (you: HuggingFace models)
3. ✅ Fast caching layer (you: DynamoDB cache)
4. ✅ Real-time scraping fallback (you: on-demand scraping)

Your system now does the same thing - FREE!
