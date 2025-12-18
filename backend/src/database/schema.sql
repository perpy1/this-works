-- Twitter Breakout Analyzer Database Schema

-- Table to cache topic analysis results
CREATE TABLE IF NOT EXISTS topic_analyses (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    search_query VARCHAR(500) NOT NULL,
    breakout_score DECIMAL(3, 1) NOT NULL,
    conversation_volume_score DECIMAL(3, 1),
    trend_velocity_score DECIMAL(3, 1),
    engagement_quality_score DECIMAL(3, 1),
    creator_saturation_score DECIMAL(3, 1),
    content_quality_gap_score DECIMAL(3, 1),
    opportunity_level VARCHAR(20),
    tweet_count INTEGER,
    creator_count INTEGER,
    competition_level VARCHAR(20),
    analysis_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store subtopic recommendations
CREATE TABLE IF NOT EXISTS subtopic_recommendations (
    id SERIAL PRIMARY KEY,
    topic_analysis_id INTEGER REFERENCES topic_analyses(id) ON DELETE CASCADE,
    subtopic_name VARCHAR(255) NOT NULL,
    breakout_score DECIMAL(3, 1) NOT NULL,
    reasoning TEXT,
    tweet_volume INTEGER,
    rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to cache raw Twitter data
CREATE TABLE IF NOT EXISTS twitter_cache (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(500) NOT NULL,
    tweet_data JSONB NOT NULL,
    fetch_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_topic_analyses_topic ON topic_analyses(topic);
CREATE INDEX IF NOT EXISTS idx_topic_analyses_created_at ON topic_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subtopic_recommendations_topic_id ON subtopic_recommendations(topic_analysis_id);
CREATE INDEX IF NOT EXISTS idx_twitter_cache_query ON twitter_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_twitter_cache_expires ON twitter_cache(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_topic_analyses_updated_at BEFORE UPDATE ON topic_analyses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
