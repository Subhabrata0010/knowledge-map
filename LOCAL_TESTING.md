# Local Testing Guide

Complete guide to testing the Knowledge Map system locally before AWS deployment.

## 🚀 Quick Start

### 1. Start Local DynamoDB

**Prerequisites:**
- Docker Desktop must be installed and **running** on Windows
- Or use the JAR file alternative below

**Option A: Using Docker (Recommended)**

First, ensure Docker Desktop is running:
```powershell
# Check if Docker is running
docker --version

# If you get an error, start Docker Desktop from Windows Start Menu
# Wait ~30 seconds for Docker to fully start
```

Then start DynamoDB Local:
```bash
# Start DynamoDB Local
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

# Create tables
cd server
npm run create-tables-local
```

**If Docker fails with "cannot find pipe" error:**
1. Open Docker Desktop from Windows Start Menu
2. Wait for Docker to fully start (whale icon in system tray stops animating)
3. Try the docker run command again

**Option B: Using Docker Compose**

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'
services:
  dynamodb-local:
    image: amazon/dynamodb-local
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
    volumes:
      - ./dynamodb-data:/home/dynamodblocal/data
```

```bash
docker-compose up -d
cd server
npm run create-tables-local
```

**Option C: Without Docker (Download JAR)**

If you can't use Docker:

1. **Download DynamoDB Local:**
   ```powershell
   # Create directory
   New-Item -ItemType Directory -Path "$env:USERPROFILE\dynamodb-local" -Force
   
   # Download (requires Java 8+ installed)
   Invoke-WebRequest -Uri "https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz" -OutFile "$env:USERPROFILE\dynamodb-local\dynamodb.tar.gz"
   
   # Extract (requires tar - built into Windows 10+)
   tar -xzf "$env:USERPROFILE\dynamodb-local\dynamodb.tar.gz" -C "$env:USERPROFILE\dynamodb-local"
   ```

2. **Start DynamoDB Local:**
   ```powershell
   cd "$env:USERPROFILE\dynamodb-local"
   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
   ```
   Leave this terminal open.

3. **Create tables (new terminal):**
   ```powershell
   cd d:\knowledge-map\server
   npm run create-tables-local
   ```

### 2. Configure Backend

```bash
cd server

# Create .env file
cp .env.example .env
```

Edit `.env`:
```bash
NODE_ENV=development
AWS_REGION=us-east-1

# Local DynamoDB endpoint
DYNAMODB_ENDPOINT=http://localhost:8000

# Table names
DYNAMODB_NODES_TABLE=knowledge-map-nodes-dev
DYNAMODB_EDGES_TABLE=knowledge-map-edges-dev
DYNAMODB_CACHE_TABLE=knowledge-map-cache-dev

# Search & scraping
MAX_SEARCH_RESULTS=15
MAX_CONCURRENT_SCRAPES=5
MAX_ENTITIES=50

# Caching
CACHE_TTL_HOURS=24
PIPELINE_TIMEOUT_SECONDS=25

# Logging
LOG_LEVEL=debug

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start Backend

```bash
cd server

# Install dependencies (if not already done)
npm install

# Build TypeScript
npm run build

# Start local server
npm run dev
```

Backend will be available at `http://localhost:3001`

### 4. Configure Frontend

```bash
cd client

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

### 5. Start Frontend

```bash
cd client

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 6. Test the System

Open browser to `http://localhost:3000`:

1. **Test Search**:
   - Enter "AI Agents" in search box
   - Click "Generate Map"
   - Watch loading state

2. **Verify Generation**:
   - Should complete in 5-10 seconds
   - Graph should display with nodes and edges
   - Node details panel should appear on click

3. **Test Caching**:
   - Search for same topic again
   - Should load instantly from cache
   - Check browser DevTools Network tab

4. **Test Different Topics**:
   - Try "Rust Programming"
   - Try "Next.js"
   - Try "Machine Learning"

## 🧪 Testing Individual Components

### Test Backend API Directly

**Generate Map:**
```bash
curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Agents"}'
```

**Get Cached Graph:**
```bash
curl http://localhost:3001/graph/ai-agents
```

**PowerShell:**
```powershell
# Generate Map
$body = @{topic = "AI Agents"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3001/generate-map -Body $body -ContentType "application/json"

# Get Graph
Invoke-RestMethod -Uri http://localhost:3001/graph/ai-agents
```

### Test DynamoDB Tables

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# Scan nodes table
aws dynamodb scan \
  --table-name knowledge-map-nodes-dev \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Scan cache table
aws dynamodb scan \
  --table-name knowledge-map-cache-dev \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### View DynamoDB Data with GUI

**DynamoDB Admin:**
```bash
npm install -g dynamodb-admin
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin
```
Open `http://localhost:8001` in browser

**NoSQL Workbench:**
- Download: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html
- Connect to localhost:8000

## 🐛 Debugging

### Backend Logs

The backeDocker error "cannot find pipe"**
```
docker: error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```
**Solution:**
1. Docker Desktop is not running
2. Open **Docker Desktop** from Windows Start Menu
3. Wait for Docker to fully start (~30 seconds)
4. System tray should show Docker whale icon (not animating)
5. Try docker command again
6. If still failing, restart Docker Desktop or use **Option C** (JAR file) above

**Issue: nd outputs structured JSON logs:

```bash
# View logs in terminal where backend is running
# Look for:
# - [INFO] messages for normal operations
# - [WARN] messages for slow operations
# - [ERROR] messages for failures
```

### Frontend DevTools

1. **Network Tab**:
   - Monitor API calls
   - Check request/response payloads
   - Verify caching behavior

2. **Console Tab**:
   - View frontend logs
   - Check for JavaScript errors
   - Monitor state changes

3. **React DevTools**:
   - Install browser extension
   - Inspect component tree
   - View props and state

### Common Issues

**Issue: Cannot connect to DynamoDB**
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Solution:**
- Ensure Docker container is running: `docker ps`
- Check port 8000 is not in use: `netstat -an | findstr 8000`
- Restart container: `docker restart dynamodb-local`

**Issue: Tables not found**
```
Error: Requested resource not found: Table: knowledge-map-nodes-dev
```
**Solution:**
- Create tables: `npm run create-tables-local`
- Verify: `aws dynamodb list-tables --endpoint-url http://localhost:8000`

**Issue: CORS errors in browser**
```
Access to fetch has been blocked by CORS policy
```
**Solution:**
- Backend should have CORS middleware enabled
- Check `server/src/middleware/cors.ts`
- Verify `Access-Control-Allow-Origin: *` in response headers

**Issue: Frontend can't reach backend**
```
Network Error or Failed to fetch
```
**Solution:**
- Check backend is running on port 3001
- Verify `.env.local` has correct API URL
- Check no firewall blocking localhost

**Issue: Generation times out**
```
Error: Pipeline timeout after 25 seconds
```
**Solution:**
- Some websites may be slow to scrape
- Try a different topic
- Reduce MAX_SEARCH_RESULTS in .env
- Reduce MAX_CONCURRENT_SCRAPES

**Issue: Few entities extracted**
```
Graph has only 2-3 nodes
```
**Solution:**
- Topic may be too broad or obscure
- Try more specific technical topics
- Check LOG_LEVEL=debug to see entity extraction details

## 🧪 Testing Checklist

### Functional Tests
- [ ] Search returns results
- [ ] Graph generates successfully
- [ ] Nodes display with correct types
- [ ] Edges connect nodes properly
- [ ] Node selection shows details
- [ ] Graph statistics are accurate
- [ ] Cache works (second load instant)
- [ ] Error handling for invalid topics
- [ ] Loading states show correctly
- [ ] Example topics work

### Performance Tests
- [ ] Generation completes in <10 seconds
- [ ] Cached retrieval is instant
- [ ] Frontend loads quickly
- [ ] No memory leaks (use Chrome DevTools)
- [ ] React rendering is smooth

### Security Tests
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Rate limiting works
- [ ] Invalid input rejected
- [ ] Error messages don't leak info

### Edge Cases
- [ ] Empty topic input
- [ ] Very long topic (>200 chars)
- [ ] Special characters in topic
- [ ] Concurrent requests
- [ ] Network failures
- [ ] DynamoDB failures

## 📊 Performance Profiling

### Backend Performance

Add timing to requests:

```typescript
const start = Date.now();
const graph = await pipeline.generateGraph(topic);
const duration = Date.now() - start;
logger.info('Generation completed', { topic, duration });
```

### Frontend Performance

Use React DevTools Profiler:
1. Open React DevTools
2. Click "Profiler" tab
3. Click record button
4. Perform actions
5. Stop recording
6. Analyze render times

### Lighthouse Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

## 🔄 Hot Reload Testing

Both frontend and backend support hot reload:

**Frontend:**
- Edit any component in `client/components/`
- Save file
- Browser auto-refreshes
- No restart needed

**Backend:**
- Edit any service in `server/src/services/`
- Save file
- TypeScript recompiles
- Restart server: `npm run dev`

## 🧹 Cleanup

### Stop Services

```bash
# Stop frontend
# Press Ctrl+C in terminal

# Stop backend
# Press Ctrl+C in terminal

# Stop DynamoDB
docker stop dynamodb-local
docker rm dynamodb-local

# Or with docker-compose
docker-compose down
```

### Clear Data

```bash
# Clear DynamoDB data
rm -rf dynamodb-data/

# Clear frontend cache
# In browser: DevTools > Application > Local Storage > Clear

# Clear backend cache
# Delete .dynamodb-local-data/ folder
```

## 🚀 Next Steps

Once local testing is successful:

1. **Run Tests**: `npm test` (if tests are written)
2. **Build Production**: `npm run build`
3. **Deploy Backend**: `./scripts/deploy.sh dev us-east-1`
4. **Deploy Frontend**: `vercel --prod`
5. **Test Production**: Verify with production URLs

## 📚 Additional Tools

### Postman Collection

Import for easy API testing:
- Generate Map: POST http://localhost:3001/generate-map
- Get Graph: GET http://localhost:3001/graph/{topic}

### VS Code Extensions

Recommended:
- **REST Client**: Test APIs from .http files
- **DynamoDB Local**: Manage local DynamoDB
- **ESLint**: Check code quality
- **Prettier**: Format code

### Monitoring

**Watch logs continuously:**
```bash
# Backend logs
tail -f server/logs/app.log

# Frontend logs
# Check browser console

# DynamoDB logs
docker logs -f dynamodb-local
```

## 🎯 Success Criteria

Local testing is complete when:
- ✅ Backend responds to API calls
- ✅ DynamoDB stores data correctly
- ✅ Frontend displays graphs
- ✅ Caching works as expected
- ✅ No console errors
- ✅ Performance is acceptable
- ✅ All test topics work
- ✅ Error handling is graceful

---

**Happy Testing! 🚀**
