# Security Implementation Summary

## 🔒 Security Features Added

### 1. Input Validation & Sanitization

**Location:** `server/src/utils/validators.ts`

**Features:**
- ✅ **SQL Injection Prevention**: Blocks patterns like `SELECT`, `DROP`, `UNION`, `--`, etc.
- ✅ **XSS Attack Prevention**: Blocks `<script>`, `<iframe>`, `javascript:`, `onclick=`, etc.
- ✅ **HTML Entity Encoding**: Converts `<`, `>`, `"`, `'`, `/` to safe entities
- ✅ **Null Byte Removal**: Prevents null byte injection attacks
- ✅ **Path Traversal Prevention**: Validates URL formats and blocks internal IPs
- ✅ **Character Pattern Detection**: Blocks suspicious repetitive patterns

**Functions:**
```typescript
sanitizeInput(input: string): string
sanitizeHtml(html: string): string  
Validator.validateTopic(topic: string): string
Validator.validateUrl(url: string): boolean
Validator.validateNumber(value, min, max, fieldName): void
```

**Example Blocked Inputs:**
- `"AI Agents<script>alert('xss')</script>"` → ValidationError
- `"'; DROP TABLE nodes--"` → ValidationError
- `"test<img src=x onerror=alert(1)>"` → ValidationError

### 2. Rate Limiting

**Location:** `server/src/middleware/rateLimit.ts`

**Features:**
- ✅ **DynamoDB-backed** rate limiting (scalable, serverless)
- ✅ **Per-IP tracking** for anonymous users
- ✅ **Per-API-Key tracking** for authenticated users
- ✅ **Sliding window** algorithm (15-minute windows)
- ✅ **Automatic TTL cleanup** (DynamoDB expires old records)
- ✅ **Fail-open design** (allows requests if rate limiter fails)
- ✅ **Standard headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Configuration:**

| Endpoint | Window | Limit | Purpose |
|----------|--------|-------|---------|
| POST /generate-map | 15 min | 100 requests | Map generation |
| GET /graph/{topic} | 15 min | 200 requests | Cached retrieval (2x) |
| Burst limiter | 10 sec | 10 requests | DDoS prevention |
| Strict limiter | 1 hour | 10 requests | Expensive operations |

**Environment Variables:**
```bash
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window
DYNAMODB_RATE_LIMIT_TABLE=knowledge-map-rate-limits-dev
```

**Usage:**
```typescript
// In Lambda handler
await rateLimitMiddleware(event, {
  windowMs: 900000,
  maxRequests: 100,
  message: 'Too many requests'
});

// Get headers for response
const headers = await getRateLimitHeaders(event);
```

### 3. Updated Handlers

**Files Updated:**
- `server/src/handlers/generateMap.ts`
- `server/src/handlers/getGraph.ts`

**Security Additions:**
- ✅ Rate limiting applied before processing
- ✅ Input sanitization with logging
- ✅ IP address tracking in logs
- ✅ Security headers in responses:
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-XSS-Protection: 1; mode=block` (XSS filter)
- ✅ Enhanced error handling
- ✅ Suspicious pattern detection

### 4. DynamoDB Rate Limit Table

**Location:** `server/cloudformation/rate-limit-table.yaml`

**Schema:**
```
PK: "RATE_LIMIT#{ip or api-key}"
SK: "ENDPOINT#{endpoint}"
count: number
windowStart: timestamp
ttl: unix timestamp (auto-delete)
```

**Deployment:**
```bash
aws cloudformation deploy \
  --template-file server/cloudformation/rate-limit-table.yaml \
  --stack-name knowledge-map-rate-limit-dev \
  --parameter-overrides Environment=dev
```

## 🧪 Testing Security

### Test SQL Injection Prevention

```bash
# Should be blocked
curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI'; DROP TABLE nodes--"}'

# Expected: 400 Bad Request
# {"error": "Input contains potentially malicious SQL patterns"}
```

### Test XSS Prevention

```bash
# Should be blocked
curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI<script>alert(1)</script>"}'

# Expected: 400 Bad Request
# {"error": "Input contains potentially malicious script patterns"}
```

### Test Rate Limiting

```bash
# Run 101 times to hit rate limit
for i in {1..101}; do
  curl -X POST http://localhost:3001/generate-map \
    -H "Content-Type: application/json" \
    -d '{"topic": "AI Agents"}'
  echo "Request $i"
done

# After 100 requests, expect:
# {"error": "Too many requests, please try again later"}
# Status: 429 Too Many Requests
# Header: X-RateLimit-Limit: 100
# Header: X-RateLimit-Remaining: 0
# Header: X-RateLimit-Reset: <timestamp>
```

### Test Valid Inputs

```bash
# Should work fine
curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Agents"}'

curl -X POST http://localhost:3001/generate-map \
  -H "Content-Type: application/json" \
  -d '{"topic": "Machine-Learning_2024"}'

# Valid characters: letters, numbers, spaces, hyphens, underscores
```

## 🔐 Additional Security Best Practices Implemented

1. **Logging**: All suspicious inputs logged with IP address
2. **Error Messages**: No sensitive info leaked in errors
3. **URL Validation**: Blocks localhost/private IPs in production
4. **Character Limits**: Topic max 200 chars
5. **Pattern Detection**: Blocks excessive character repetition (AAAAAAAA)
6. **AWS Metadata Blocking**: Prevents SSRF to 169.254.169.254
7. **Protocol Restriction**: Only HTTP/HTTPS allowed
8. **HTML Encoding**: Special characters converted to entities

## 📊 Rate Limit Database

The rate limiter uses a dedicated DynamoDB table with:
- **Pay-per-request** billing (cost-effective)
- **TTL enabled** (auto-cleanup old records)
- **Point-in-time recovery** for data safety
- **Encryption at rest** (SSE)

**Estimated Cost:**
- ~$0.25 per million read/write requests
- Free tier: 25 read + 25 write units/month
- TTL cleanup: free

## 🚀 Deployment

### 1. Deploy Rate Limit Table

```bash
cd server/cloudformation
aws cloudformation deploy \
  --template-file rate-limit-table.yaml \
  --stack-name knowledge-map-rate-limit-dev \
  --parameter-overrides Environment=dev
```

### 2. Update Lambda IAM Permissions

Add to `server/cloudformation/lambda-functions.yaml`:

```yaml
- Effect: Allow
  Action:
    - dynamodb:GetItem
    - dynamodb:PutItem
    - dynamodb:UpdateItem
  Resource: !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/knowledge-map-rate-limits-${Environment}"
```

### 3. Update Environment Variables

Add to Lambda environment:

```yaml
Environment:
  Variables:
    RATE_LIMIT_WINDOW_MS: 900000
    RATE_LIMIT_MAX_REQUESTS: 100
    DYNAMODB_RATE_LIMIT_TABLE: !Ref RateLimitTable
```

### 4. Rebuild and Deploy

```bash
cd server
npm run build
serverless deploy --stage dev
```

## 📝 Configuration Options

### Adjust Rate Limits

Edit `.env`:
```bash
# More strict (10 requests per hour)
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=10

# More lenient (1000 requests per hour)
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Per-Endpoint Limits

```typescript
// Strict for expensive operations
await strictRateLimitMiddleware(event); // 10/hour

// Burst protection
await burstRateLimitMiddleware(event); // 10/10sec

// Custom
await rateLimitMiddleware(event, {
  windowMs: 60000,  // 1 minute
  maxRequests: 20,
});
```

## ✅ Checklist

- [x] SQL injection prevention implemented
- [x] XSS attack prevention implemented
- [x] Rate limiting with DynamoDB
- [x] Security headers in responses
- [x] Input validation enhanced
- [x] Suspicious pattern logging
- [x] CloudFormation template for rate limit table
- [x] Handler updates with rate limiting
- [x] Middleware export updated
- [x] Documentation created

## 🎯 Next Steps

1. **Test locally**: Use LOCAL_TESTING.md guide
2. **Deploy rate limit table**: CloudFormation template
3. **Update Lambda permissions**: Add DynamoDB access
4. **Deploy code**: Run `serverless deploy`
5. **Monitor**: Check CloudWatch for rate limit events
6. **Adjust limits**: Based on actual traffic patterns

Your application is now protected against common web attacks! 🛡️
