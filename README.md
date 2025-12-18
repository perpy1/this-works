# Twitter Breakout Analyzer

A powerful web tool that analyzes Twitter topics and returns a "breakout score" indicating opportunity level for creators to create content in that niche. The tool scrapes recent Twitter data, analyzes engagement patterns, competition levels, and trend velocity, then suggests 3 specific subtopic angles within the main topic.

![Twitter Breakout Analyzer](docs/screenshot.png)

## Features

- **Breakout Score (0-10)**: Overall opportunity rating based on multiple market signals
- **Competition Analysis**: Identifies how many creators are actively posting in this space
- **Trend Velocity**: Compares last 7 days vs previous 23 days to detect growing/declining topics
- **Engagement Quality**: Analyzes like/retweet/reply ratios to gauge audience interest
- **Subtopic Recommendations**: Uses NLP to extract and score 3 specific content angles
- **Result Caching**: PostgreSQL database caches results for 24 hours to reduce API calls
- **Clean UI**: Simple, beautiful interface built with React

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Modern CSS with gradients and animations

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL for data persistence
- Natural language processing libraries (natural, compromise, stopword)

### APIs & Services
- Twitter API v2 for data collection
- PostgreSQL for caching and analytics

## Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Port 3000)   │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────┐
│  Express API    │
│   (Port 3001)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│ Twitter │ │  PostgreSQL  │
│  API v2 │ │   Database   │
└─────────┘ └──────────────┘
```

## Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Twitter API v2 Bearer Token (get from [Twitter Developer Portal](https://developer.twitter.com/))

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd twitter-breakout-analyzer
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 3: Set Up PostgreSQL Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE twitter_breakout;"

# Run schema
psql -U postgres -d twitter_breakout -f backend/src/database/schema.sql
```

### Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your credentials:

```env
PORT=3001
NODE_ENV=development

# Twitter API v2 Credentials
TWITTER_BEARER_TOKEN=your_actual_bearer_token_here

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=twitter_breakout
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### Step 5: Run the Application

#### Development Mode (Both Frontend & Backend)

```bash
# From root directory
npm run dev
```

This will start:
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:3000`

#### Or Run Separately

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 6: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Enter a Topic**: Type any topic you want to analyze (e.g., "crypto marketing", "AI content creation")
2. **Click Analyze**: The tool will fetch 500-2000 recent tweets from the last 30 days
3. **Wait 20-30 seconds**: The analysis processes tweets, calculates scores, and extracts subtopics
4. **View Results**: See your breakout score, competition level, market signals, and 3 recommended subtopic angles

## Scoring Algorithm

The breakout score is calculated using a weighted formula:

```
Breakout Score = (
  Conversation Volume Score × 0.15 +
  Trend Velocity Score × 0.25 +
  Engagement Quality Score × 0.20 +
  Creator Saturation Score × 0.25 +
  Content Quality Gap Score × 0.15
)
```

### Score Interpretation

- **8.0-10.0**: HIGH OPPORTUNITY (Green) - Strong breakout potential
- **5.0-7.9**: MEDIUM OPPORTUNITY (Yellow) - Moderate potential, find unique angle
- **0-4.9**: LOW OPPORTUNITY (Red) - Oversaturated or declining interest

### Competition Levels

- **0-30 creators**: LOW (Green)
- **31-70 creators**: MEDIUM (Yellow)
- **71+ creators**: HIGH (Red)

## API Endpoints

### POST `/api/analyze`

Analyze a topic and get breakout score with subtopics.

**Request Body:**
```json
{
  "topic": "crypto marketing",
  "useCache": true
}
```

**Response:**
```json
{
  "cached": false,
  "topic": "crypto marketing",
  "breakoutScore": 7.2,
  "opportunityLevel": "MEDIUM OPPORTUNITY",
  "opportunityMessage": "Moderate potential, find unique angle",
  "competitionLevel": "MEDIUM",
  "tweetCount": 523,
  "creatorCount": 45,
  "metrics": {
    "conversationVolumeScore": 6.5,
    "trendVelocityScore": 8.1,
    "engagementQualityScore": 7.3,
    "creatorSaturationScore": 7.0,
    "contentQualityGapScore": 6.8
  },
  "subtopics": [
    {
      "name": "NFT Communities",
      "breakoutScore": 8.2,
      "reasoning": "High interest with strong engagement, only 87 tweets found - early opportunity",
      "tweetVolume": 87,
      "rank": 1
    }
  ]
}
```

### GET `/api/analyze/history?limit=10`

Get recent analysis history.

### GET `/health`

Health check endpoint.

## Deployment

### Deploy Backend to Railway

1. Create a Railway account at [railway.app](https://railway.app)
2. Create a new project and provision PostgreSQL
3. Connect your GitHub repository
4. Set environment variables in Railway dashboard
5. Deploy from `backend` directory
6. Railway will automatically use the `railway.json` configuration

### Deploy Frontend to Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Update `vercel.json` with your Railway backend URL
5. Deploy

### Environment Variables for Production

**Railway (Backend):**
- `TWITTER_BEARER_TOKEN`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (auto-configured if using Railway PostgreSQL)
- `NODE_ENV=production`
- `PORT=3001`

**Vercel (Frontend):**
- Update API proxy in `vercel.json` to point to your Railway backend URL

## Database Schema

The application uses three main tables:

1. **topic_analyses**: Stores analysis results with scores and metrics
2. **subtopic_recommendations**: Stores subtopic suggestions linked to analyses
3. **twitter_cache**: Caches raw Twitter data to reduce API calls

See `backend/src/database/schema.sql` for full schema.

## Rate Limiting

The Twitter API v2 has rate limits:
- **Search tweets**: 450 requests per 15 minutes (with Essential access)
- The app implements automatic pagination with 1-second delays between requests
- Results are cached for 24 hours to minimize API usage

## Development

### Project Structure

```
twitter-breakout-analyzer/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── db.ts
│   │   │   └── schema.sql
│   │   ├── routes/
│   │   │   └── analyze.ts
│   │   ├── services/
│   │   │   ├── twitterService.ts
│   │   │   ├── scoringEngine.ts
│   │   │   └── subtopicExtractor.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.tsx
│   │   │   └── ResultsPage.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── package.json
├── vercel.json
├── railway.json
└── README.md
```

### Key Files

- **backend/src/services/twitterService.ts**: Twitter API integration and data fetching
- **backend/src/services/scoringEngine.ts**: All scoring algorithm logic
- **backend/src/services/subtopicExtractor.ts**: NLP-based subtopic extraction
- **backend/src/routes/analyze.ts**: API endpoint handlers
- **frontend/src/components/ResultsPage.tsx**: Results visualization

## Troubleshooting

### "Failed to fetch tweets from Twitter API"

- Verify your `TWITTER_BEARER_TOKEN` is correct
- Check that you have access to Twitter API v2
- Ensure you haven't exceeded rate limits

### "Database connection failed"

- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### "Insufficient data" error

- The topic might be too niche (< 10 tweets found)
- Try a broader search term
- Check if the topic is being discussed on Twitter

## Future Enhancements

- [ ] Track topics over time (save and compare analyses)
- [ ] Email alerts for breakout score changes
- [ ] Export reports as PDF
- [ ] Support for multiple social platforms (Reddit, Instagram)
- [ ] Advanced filters (date range, language, location)
- [ ] User accounts and saved topics
- [ ] Historical trend charts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Built with ❤️ for content creators and marketers
