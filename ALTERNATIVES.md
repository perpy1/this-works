# Alternative Data Sources Guide

This guide explains how to use the Twitter Breakout Analyzer **without** the expensive Twitter API, using free or cheaper alternatives.

## 🎯 Quick Start with Reddit (100% FREE!)

The easiest way to get started is using Reddit's free API - **no API key required!**

### Setup (30 seconds)

1. **Set the platform** in `backend/.env`:
   ```env
   DATA_PLATFORM=reddit
   ```

2. **That's it!** Reddit requires no API authentication for read-only access.

3. **Run the app**:
   ```bash
   npm run dev
   ```

4. **Try a search** like "AI tools" or "crypto marketing"

### Reddit vs Twitter

| Feature | Reddit | Twitter |
|---------|--------|---------|
| **Cost** | FREE | $100+/month |
| **API Key** | Not needed | Required |
| **Rate Limit** | 60 req/min | Very limited |
| **Best For** | Tech, niche communities | General topics |
| **Data Quality** | High for tech/startup topics | Broader coverage |

---

## 📊 Platform Comparison

### 1. Reddit (RECOMMENDED - FREE)

**Pros:**
- ✅ Completely free
- ✅ No API key registration
- ✅ Generous rate limits (60 requests/min)
- ✅ High-quality discussions
- ✅ Works great for tech, startups, finance, gaming

**Cons:**
- ❌ Smaller user base than Twitter
- ❌ Less real-time than Twitter
- ❌ Better for niche communities than mainstream topics

**Best Use Cases:**
- Developer tools analysis
- Startup ideas validation
- Tech product research
- Gaming content opportunities
- Finance/crypto topics

**Setup:**
```env
DATA_PLATFORM=reddit
```
No other configuration needed!

---

### 2. Twitter API v2

**Pros:**
- ✅ Real-time data
- ✅ Massive user base
- ✅ Official API
- ✅ Broad topic coverage

**Cons:**
- ❌ Expensive ($100-$5,000/month)
- ❌ Strict rate limits on free tier
- ❌ Requires application approval
- ❌ Free tier essentially unusable

**Pricing:**
- Free: 1,500 tweets/month (unusable for this app)
- Basic: $100/month - 10,000 tweets/month
- Pro: $5,000/month - 1M tweets/month

**Setup:**
```env
DATA_PLATFORM=twitter
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

**Get Token:** [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)

---

### 3. Multi-Platform (Reddit + Twitter)

Combine both platforms for the most comprehensive analysis.

**Pros:**
- ✅ Best data coverage
- ✅ Cross-platform insights
- ✅ Falls back to Reddit if Twitter fails

**Cons:**
- ❌ Slower (fetches from both)
- ❌ Still need Twitter API key

**Setup:**
```env
DATA_PLATFORM=multi
TWITTER_BEARER_TOKEN=your_token_here
```

---

## 💰 Paid Twitter Alternatives

If you need Twitter data but don't want to pay for the official API:

### 1. Apify Twitter Scraper

**Best for:** Occasional use, small projects

**Pricing:**
- $5/month free credit
- ~$0.25-$1 per 1,000 tweets
- Pay-as-you-go

**Setup:**
1. Sign up at [Apify.com](https://apify.com/)
2. Get API token from dashboard
3. Add to `.env`:
   ```env
   APIFY_API_TOKEN=your_token_here
   ```

**Code Example:**
```typescript
// backend/src/services/apifyTwitterService.ts
import axios from 'axios';

export async function scrapeWithApify(query: string) {
  const response = await axios.post(
    `https://api.apify.com/v2/acts/apidojo~tweet-scraper/runs?token=${process.env.APIFY_API_TOKEN}`,
    {
      searchTerms: [query],
      maxTweets: 500,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  );
  return response.data;
}
```

---

### 2. RapidAPI Twitter Services

**Best for:** Medium usage, multiple apps

**Pricing:**
- Free tier: 100-500 requests/month
- Pro: $10-50/month for 10,000-100,000 requests

**Popular RapidAPI Twitter Scrapers:**
- Twitter API v2 (by API Dojo)
- Twitter Data (by Fresh Data)
- Twitter Scraper (by various providers)

**Setup:**
1. Sign up at [RapidAPI.com](https://rapidapi.com/)
2. Subscribe to a Twitter scraper
3. Add to `.env`:
   ```env
   RAPIDAPI_KEY=your_key_here
   ```

**Code Example:**
```typescript
import axios from 'axios';

const options = {
  method: 'GET',
  url: 'https://twitter-api45.p.rapidapi.com/search.php',
  params: { query: 'crypto marketing', count: '100' },
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com'
  }
};

const response = await axios.request(options);
```

---

### 3. ScraperAPI + Custom Scraper

**Best for:** Developers who want full control

**Pricing:**
- Free tier: 5,000 API credits
- Hobby: $29/month for 100,000 credits
- Startup: $99/month for 1M credits

**Setup:**
1. Sign up at [ScraperAPI.com](https://www.scraperapi.com/)
2. Get API key
3. Add to `.env`:
   ```env
   SCRAPER_API_KEY=your_key_here
   ```

**Pros:**
- Handles proxies, CAPTCHAs, rate limiting
- Works with any website
- Cheaper than official APIs

**Cons:**
- Requires HTML parsing (brittle)
- Twitter actively blocks scrapers
- May violate Twitter ToS

---

## 🆓 Other Free Platforms

### YouTube API

**Use for:** Video content, tutorials, product reviews

**Rate Limit:** 10,000 quota units/day (generous!)

**Setup:**
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env`:
   ```env
   YOUTUBE_API_KEY=your_key_here
   ```

**Code:**
```typescript
// Search YouTube comments/videos
const response = await axios.get(
  'https://www.googleapis.com/youtube/v3/search',
  {
    params: {
      part: 'snippet',
      q: 'AI tools tutorial',
      type: 'video',
      maxResults: 50,
      key: process.env.YOUTUBE_API_KEY
    }
  }
);
```

---

### Hacker News API

**Use for:** Tech topics, developer tools, startups

**Rate Limit:** Unlimited!

**Setup:** No API key needed

**Code:**
```typescript
// backend/src/services/hackerNewsService.ts
const response = await axios.get(
  'https://hn.algolia.com/api/v1/search',
  {
    params: {
      query: 'AI tools',
      tags: 'story',
      numericFilters: 'created_at_i>' + (Date.now()/1000 - 30*24*60*60)
    }
  }
);
```

---

### Product Hunt API

**Use for:** Product launches, tech products

**Rate Limit:** 100 requests/hour

**Setup:**
1. Create app at [Product Hunt](https://www.producthunt.com/v2/oauth/applications)
2. Get API token

---

### Dev.to API

**Use for:** Developer content, coding tutorials

**Rate Limit:** Generous (no public limit)

**Setup:** No API key needed

**Code:**
```typescript
const response = await axios.get(
  'https://dev.to/api/articles',
  {
    params: {
      tag: 'javascript',
      per_page: 100
    }
  }
);
```

---

## 🔧 Implementation Examples

### Switch Platforms via Environment Variable

Already implemented! Just change `DATA_PLATFORM` in `.env`:

```env
# Use Reddit (FREE)
DATA_PLATFORM=reddit

# Use Twitter (Requires API key)
DATA_PLATFORM=twitter

# Use both (Requires Twitter API key)
DATA_PLATFORM=multi
```

The app automatically uses the configured platform.

---

### Create a Custom Multi-Platform Analyzer

You can extend the platform adapter to include more sources:

```typescript
// backend/src/services/platformAdapter.ts

async searchMultiPlatform(query: string) {
  const results = await Promise.allSettled([
    redditService.search(query, 200),
    hackerNewsService.search(query, 100),
    devToService.search(query, 100),
    productHuntService.search(query, 100),
  ]);

  // Combine and normalize all results
  const allPosts = [];
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value.posts);
    }
  });

  return { posts: allPosts, ... };
}
```

---

## 💡 Recommendations by Use Case

### For Beginners / Testing
**→ Use Reddit (Free)**
- No setup required
- Start analyzing immediately
- Great for most topics

### For Production / Business
**→ Use Twitter API (Official)**
- Most reliable
- Best data quality
- Worth the cost if budget allows

### For Budget-Conscious Developers
**→ Use Multi-Platform (Reddit + Others)**
- Combine free APIs
- Reddit + Hacker News + Dev.to
- Better coverage than Twitter alone

### For Infrequent Use
**→ Use Apify or RapidAPI**
- Pay per use
- No monthly commitment
- $5-10/month for occasional analysis

---

## 🚀 Getting Started NOW (Free)

**1. Clone the repo**
```bash
git clone <repo-url>
cd twitter-breakout-analyzer
```

**2. Install dependencies**
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

**3. Set up database**
```bash
psql -U postgres -c "CREATE DATABASE twitter_breakout;"
psql -U postgres -d twitter_breakout -f backend/src/database/schema.sql
```

**4. Configure for Reddit (FREE!)**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set:
# DATA_PLATFORM=reddit
```

**5. Run the app**
```bash
npm run dev
```

**6. Open browser**
```
http://localhost:3000
```

**7. Search a topic!**
Try: "AI tools", "crypto trading", "SaaS marketing"

---

## 📈 Cost Comparison

| Solution | Setup Time | Monthly Cost | Tweets/Posts | Best For |
|----------|-----------|--------------|--------------|----------|
| **Reddit** | 30 seconds | $0 | Unlimited | Tech/startup topics |
| **Hacker News** | 1 minute | $0 | Unlimited | Developer content |
| **YouTube API** | 5 minutes | $0 | ~10K videos/day | Video content |
| **Apify** | 10 minutes | $5-20 | 5K-20K tweets | Occasional use |
| **RapidAPI** | 10 minutes | $0-50 | 100-100K | Medium usage |
| **Twitter API** | 1-7 days | $100-5000 | 10K-1M | Enterprise |

---

## ❓ FAQ

**Q: Can I use Reddit for all topics?**
A: Reddit works great for tech, gaming, finance, startups. For mainstream/celebrity topics, Twitter is better.

**Q: Is web scraping legal?**
A: Scraping public data is generally legal (LinkedIn v. hiQ case), but may violate ToS. Use official APIs when possible.

**Q: Which is most accurate?**
A: Twitter has the most real-time data. Reddit has deeper discussions. Best results = combine both.

**Q: Can I switch platforms later?**
A: Yes! Just change `DATA_PLATFORM` in `.env`. The scoring algorithm works the same.

**Q: What about Instagram/TikTok?**
A: Both have very restrictive APIs. Consider using Apify scrapers for these platforms.

---

## 🎯 Conclusion

**Start with Reddit (free)** → Test the tool and validate your use case

**If you need Twitter data:**
- Small budget: Use Apify or RapidAPI ($5-20/month)
- Medium budget: Twitter Basic API ($100/month)
- Enterprise: Twitter Pro API ($5,000/month)

**Best value: Multi-platform approach**
- Reddit (free) for tech topics
- Hacker News (free) for developer content
- YouTube (free) for video/tutorial topics
- = Comprehensive analysis at $0/month!

---

Need help? Check the main [README.md](README.md) or open an issue!
