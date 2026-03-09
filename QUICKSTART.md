# 🧪 Quick Start: Local Testing Guide

## Prerequisites Checklist

- [ ] Docker installed (for DynamoDB Local)
- [ ] Node.js 18+ installed
- [ ] npm or bun installed
- [ ] Git repository cloned

## Step-by-Step Setup (10 minutes)

### 1️⃣ Start DynamoDB Local (2 min)

**⚠️ Important: Docker Desktop must be running!**

Check if Docker is running:
```powershell
docker --version
```

If you get an error, **start Docker Desktop from Windows Start Menu** and wait ~30 seconds.

**Option A: Quick Docker Command**
```bash
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local
```

**Option B: Docker Compose** (create `docker-compose.yml` in project root)
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
```

**Option C: Without Docker (Java required)**

Download and run DynamoDB Local JAR:
```powershell
# Download
New-Item -ItemType Directory -Path "$env:USERPROFILE\dynamodb-local" -Force
Invoke-WebRequest -Uri "https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz" -OutFile "$env:USERPROFILE\dynamodb-local\dynamodb.tar.gz"
tar -xzf "$env:USERPROFILE\dynamodb-local\dynamodb.tar.gz" -C "$env:USERPROFILE\dynamodb-local"

# Run (keep terminal open)
cd "$env:USERPROFILE\dynamodb-local"
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
```

**Verify it's running:**
```bash
docker ps | findstr dynamodb
```

### 2️⃣ Create DynamoDB Tables (1 min)

```bash
cd server
npm run create-tables-local
```

**Expected output:**
```
✓ Created table: knowledge-map-nodes-dev
✓ Created table: knowledge-map-edges-dev
✓ Created table: knowledge-map-cache-dev
✓ Created table: knowledge-map-rate-limits-dev
```

### 3️⃣ Configure Backend (1 min)

```bash
cd server
cp .env.example .env
```

Edit `.env` (or use default values):
```bash
NODE_ENV=development
DYNAMODB_ENDPOINT=http://localhost:8000
MAX_SEARCH_RESULTS=15
MAX_CONCURRENT_SCRAPES=5
LOG_LEVEL=debug
RATE_LIMIT_MAX_REQUESTS=100
```

### 4️⃣ Start Backend Server (1 min)

```bash
cd server
npm install  # Already done ✅
npm run dev
```

**Expected output:**
```
✓ Offline listening on http://localhost:3001
✓ POST /generate-map
✓ GET /graph/{topic}
```

### 5️⃣ Configure Frontend (1 min)

```bash
cd client
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

### 6️⃣ Start Frontend Server (1 min)

**New terminal window:**
```bash
cd client
npm install  # Already done ✅
npm run dev
```

**Expected output:**
```
✓ Ready on http://localhost:3000
```

### 7️⃣ Test in Browser (3 min)

1. **Open** http://localhost:3000
2. **Enter topic**: "AI Agents"
3. **Click** "Generate Map"
4. **Wait** 5-10 seconds
5. **See** interactive graph with nodes and edges
6. **Click nodes** to see details
7. **Try caching**: Search same topic again (instant!)

## 🧪 Test Commands

### Test Backend API Directly

**PowerShell:**
```powershell
# Generate Map
$body = @{topic = "AI Agents"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3001/generate-map -Body $body -ContentType "application/json"

# Get Cached Graph
Invoke-RestMethod -Uri http://localhost:3001/graph/ai-agents
```

**Curl (Git Bash):**
```bash
# Generate Map
curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Agents"}'

# Get Graph
curl http://localhost:3001/graph/ai-agents
```

### Test Security Features

**Test SQL Injection Prevention:**
```powershell
$body = @{topic = "AI'; DROP TABLE nodes--"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3001/generate-map -Body $body -ContentType "application/json"
```
**Expected:** 400 Bad Request - "Input contains potentially malicious SQL patterns"

**Test XSS Prevention:**
```powershell
$body = @{topic = "AI<script>alert(1)</script>"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3001/generate-map -Body $body -ContentType "application/json"
```
**Expected:** 400 Bad Request - "Input contains potentially malicious script patterns"

**Test Rate Limiting:**
```powershell
# Run 101 times to hit rate limit
1..101 | ForEach-Object {
    $body = @{topic = "AI Agents"} | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri http://localhost:3001/generate-map -Body $body -ContentType "application/json"
    Write-Host "Request $_"
}
```
**Expected:** After 100 requests: 429 Too Many Requests

## 📊 View DynamoDB Data

**AWS CLI:**
```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# View nodes
aws dynamodb scan --table-name knowledge-map-nodes-dev --endpoint-url http://localhost:8000 --region us-east-1

# View cache
aws dynamodb scan --table-name knowledge-map-cache-dev --endpoint-url http://localhost:8000 --region us-east-1
```

**DynamoDB Admin (GUI):**
```bash
npm install -g dynamodb-admin
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin
```
Open http://localhost:8001

## 🐛 Troubleshooting

### Issue: Docker error "cannot find pipe"
```
docker: error during connect: open //./pipe/dockerDesktopLinuxEngine
```
**Solution:** Docker Desktop is not running
1. Open **Docker Desktop** from Windows Start Menu
2. Wait ~30 seconds for it to fully start
3. Look for whale icon in system tray (should stop animating)
4. Try docker command again

### Issue: "Cannot connect to DynamoDB"
**Solution:**
```bash
# Check if Docker is running
docker ps

# Restart DynamoDB container
docker restart dynamodb-local

# Check port 8000
netstat -an | findstr 8000
```

### Issue: "Table not found"
**Solution:**
```bash
cd server
npm run create-tables-local
```

### Issue: "CORS error in browser"
**Solution:** Backend should auto-handle CORS. Check browser console and verify backend is running on port 3001.

### Issue: "Frontend can't reach backend"
**Solution:**
```bash
# Check .env.local
cat client/.env.local
# Should show: NEXT_PUBLIC_API_URL=http://localhost:3001

# Verify backend is running
curl http://localhost:3001/health  # or your health endpoint
```

## 🧹 Cleanup

**Stop Everything:**
```bash
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)

# Stop DynamoDB
docker stop dynamodb-local
docker rm dynamodb-local

# Clear data
rm -rf dynamodb-data/
```

## 🚀 Ready for Production?

Once local testing passes:

1. ✅ **Build Backend:**
   ```bash
   cd server
   npm run build
   ```

2. ✅ **Deploy Backend:**
   ```bash
   ./scripts/deploy.sh dev us-east-1
   ```

3. ✅ **Update Frontend Config:**
   ```bash
   # Copy API URL from deployment output
   echo "NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev" > client/.env.local
   ```

4. ✅ **Deploy Frontend:**
   ```bash
   cd client
   vercel --prod
   ```

## 📚 More Documentation

- **Full Testing Guide**: [LOCAL_TESTING.md](LOCAL_TESTING.md)
- **Security Features**: [SECURITY.md](SECURITY.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Reference**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

**Estimated Time:** 10 minutes setup + 5 minutes testing = 15 minutes total

**Status:**
- ✅ Backend dependencies installed (593 packages)
- ✅ Frontend dependencies installed (415 packages)
- ✅ Security features implemented (SQL injection, XSS, rate limiting)
- ✅ All code complete and ready to run

**Next:** Start Docker, create tables, run servers, test! 🚀
