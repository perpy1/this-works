# Quick Setup Guide

## For Local Development

### 1. Get Twitter API Access

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Navigate to "Keys and Tokens"
4. Generate a Bearer Token
5. Copy the Bearer Token (you'll need this for `.env`)

### 2. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [PostgreSQL.org](https://www.postgresql.org/download/windows/)

### 3. Create Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE twitter_breakout;

# Exit psql
\q

# Run schema
psql -U postgres -d twitter_breakout -f backend/src/database/schema.sql
```

### 4. Install Project Dependencies

```bash
# Install all dependencies at once
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 5. Configure Environment

```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit the .env file with your credentials
nano backend/.env  # or use your preferred editor
```

Required variables:
```env
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=twitter_breakout
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### 6. Start Development Servers

```bash
# From root directory, run both servers
npm run dev
```

**Or run separately:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 7. Test the Application

1. Open browser to `http://localhost:3000`
2. Enter a test topic like "AI tools"
3. Click "Analyze Topic"
4. Wait 20-30 seconds for results

## Common Issues

### Issue: "ECONNREFUSED" database error

**Solution:** Make sure PostgreSQL is running
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Check status
pg_isready
```

### Issue: "Twitter API rate limit exceeded"

**Solution:** Wait 15 minutes, or enable caching in the app (set `useCache: true`)

### Issue: Port 3000 or 3001 already in use

**Solution:** Kill the process using the port
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: TypeScript errors

**Solution:** Rebuild the project
```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Testing Twitter API Connection

Test your Twitter bearer token:

```bash
curl -X GET "https://api.twitter.com/2/tweets/search/recent?query=twitter&max_results=10" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

You should get a JSON response with tweets.

## Production Deployment Checklist

- [ ] Twitter API credentials configured
- [ ] PostgreSQL database provisioned
- [ ] Environment variables set in hosting platform
- [ ] Database schema applied
- [ ] Frontend build completed (`npm run build`)
- [ ] Backend build completed (`npm run build`)
- [ ] CORS configured for production domain
- [ ] Rate limiting configured
- [ ] Monitoring/logging set up

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review error logs in console/terminal
- Verify all environment variables are set correctly
- Ensure all npm packages are installed
