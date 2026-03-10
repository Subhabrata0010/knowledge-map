# 🚀 Pre-Scraping Setup Guide

## What is Pre-Scraping?

Pre-scraping caches popular topics in advance so they load **instantly** (<1s instead of 10s).

---

## ✅ Setup Complete!

I've added 3 commands to cache your data:

### 1. **One-Time Pre-Scraping** (Run Now)
```powershell
cd server
npm run prescrape
```
**What it does:** Scrapes all topics from `.env` once and caches them

**Topics cached:** (from your `.env`)
- javascript
- python
- react
- nodejs
- aws
- docker
- kubernetes
- typescript
- ai
- machine learning
- ai agents

---

### 2. **Scheduled Pre-Scraping** (Keep Running)
```powershell
cd server
npm run scheduler
```
**What it does:** 
- Scrapes all topics immediately
- Re-scrapes every 24 hours automatically
- Keeps running until you stop it (Ctrl+C)

**Perfect for:** Keeping cache fresh in the background

---

### 3. **Auto-Rebuild on Changes** (Development)
```powershell
cd server
npm run prescrape:watch
```
**What it does:** Re-runs pre-scraping when you modify code

---

## 📝 How to Use

### Option A: Cache Everything Now (Recommended)
```powershell
# Terminal 1: Server (already running)
cd server
npm run dev

# Terminal 2: Run pre-scraping
cd server
npm run prescrape
```

**Result:** All 11 topics cached → instant responses!

---

### Option B: Run Scheduler (Background Caching)
```powershell
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Scheduler (runs every 24h)
cd server
npm run scheduler
```

**Result:** Topics stay cached and fresh automatically

---

## ⚙️ Configuration

Edit `server/.env` to change topics:

```env
# Add/remove topics here:
PRE_SCRAPE_TOPICS=javascript,python,react,nodejs,aws,docker,kubernetes,typescript,ai,machine learning,ai agents,graphql,mongodb,postgres

# Change interval (hours):
PRE_SCRAPE_INTERVAL_HOURS=24
```

---

## 🎯 Testing Cache

After pre-scraping, test the speed:

```powershell
# First request (should be instant if cached!)
curl -X POST http://localhost:3000/dev/generate-map `
  -H "Content-Type: application/json" `
  -Body '{"topic": "javascript"}'

# Should return in <1 second! 🚀
```

---

## 📊 What Happens

```
Before Pre-Scraping:
  User searches "javascript" → 10-15s (real-time scraping)

After Pre-Scraping:
  User searches "javascript" → <1s (from cache!) ⚡
  
Uncached topics still work:
  User searches "rust" → 10-15s (scrapes on-demand)
```

---

## 💡 Tips

1. **Start with popular topics** - Cache what users search most
2. **Run scheduler overnight** - Pre-scrape while you sleep
3. **Check logs** - See what's cached: `npm run prescrape` shows progress
4. **Adjust interval** - 6 hours for active topics, 48 hours for stable ones

---

## 🔥 Next Steps

1. Run: `npm run prescrape` (cache everything now)
2. Test: Search "javascript" → should be instant!
3. Add more topics to `.env` if needed
4. (Optional) Run `npm run scheduler` to keep cache fresh

You now have **Perplexity-style instant responses** for popular topics! 🎉
