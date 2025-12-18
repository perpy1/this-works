import { Router, Request, Response } from 'express';
import twitterService from '../services/twitterService';
import scoringEngine from '../services/scoringEngine';
import subtopicExtractor from '../services/subtopicExtractor';
import db from '../database/db';

const router = Router();

interface AnalyzeRequest {
  topic: string;
  useCache?: boolean;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { topic, useCache = true }: AnalyzeRequest = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const cleanTopic = topic.trim();

    if (useCache) {
      const cachedResult = await db.query(
        `SELECT
          ta.*,
          json_agg(
            json_build_object(
              'name', sr.subtopic_name,
              'breakoutScore', sr.breakout_score,
              'reasoning', sr.reasoning,
              'tweetVolume', sr.tweet_volume,
              'rank', sr.rank
            ) ORDER BY sr.rank
          ) as subtopics
        FROM topic_analyses ta
        LEFT JOIN subtopic_recommendations sr ON ta.id = sr.topic_analysis_id
        WHERE LOWER(ta.topic) = LOWER($1)
          AND ta.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY ta.id
        ORDER BY ta.created_at DESC
        LIMIT 1`,
        [cleanTopic]
      );

      if (cachedResult.rows.length > 0) {
        const cached = cachedResult.rows[0];
        return res.json({
          cached: true,
          topic: cached.topic,
          breakoutScore: parseFloat(cached.breakout_score),
          opportunityLevel: cached.opportunity_level,
          opportunityMessage: getOpportunityMessage(cached.opportunity_level),
          competitionLevel: cached.competition_level,
          tweetCount: cached.tweet_count,
          creatorCount: cached.creator_count,
          metrics: {
            conversationVolumeScore: parseFloat(cached.conversation_volume_score),
            trendVelocityScore: parseFloat(cached.trend_velocity_score),
            engagementQualityScore: parseFloat(cached.engagement_quality_score),
            creatorSaturationScore: parseFloat(cached.creator_saturation_score),
            contentQualityGapScore: parseFloat(cached.content_quality_gap_score),
          },
          detailedMetrics: cached.analysis_data?.detailedMetrics || {},
          subtopics: cached.subtopics.filter((s: any) => s.name !== null),
          analyzedAt: cached.created_at,
        });
      }
    }

    console.log(`Analyzing topic: ${cleanTopic}`);

    const searchResponse = await twitterService.searchTweetsWithPagination(
      cleanTopic,
      500,
      30
    );

    if (searchResponse.tweets.length < 10) {
      return res.status(404).json({
        error: 'Insufficient data',
        message: `Only found ${searchResponse.tweets.length} tweets for this topic. Need at least 10 tweets for analysis.`,
      });
    }

    const analysis = scoringEngine.analyzeTopicBreakout(
      searchResponse.tweets,
      searchResponse.users
    );

    const subtopics = await subtopicExtractor.extractSubtopics(
      cleanTopic,
      searchResponse.tweets,
      searchResponse.users,
      3
    );

    const insertResult = await db.query(
      `INSERT INTO topic_analyses (
        topic, search_query, breakout_score,
        conversation_volume_score, trend_velocity_score,
        engagement_quality_score, creator_saturation_score,
        content_quality_gap_score, opportunity_level,
        tweet_count, creator_count, competition_level,
        analysis_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        cleanTopic,
        cleanTopic,
        analysis.breakoutScore,
        analysis.metrics.conversationVolumeScore,
        analysis.metrics.trendVelocityScore,
        analysis.metrics.engagementQualityScore,
        analysis.metrics.creatorSaturationScore,
        analysis.metrics.contentQualityGapScore,
        analysis.opportunityLevel,
        analysis.tweetCount,
        analysis.creatorCount,
        analysis.competitionLevel,
        JSON.stringify({ detailedMetrics: analysis.detailedMetrics }),
      ]
    );

    const topicAnalysisId = insertResult.rows[0].id;

    for (const subtopic of subtopics) {
      await db.query(
        `INSERT INTO subtopic_recommendations (
          topic_analysis_id, subtopic_name, breakout_score,
          reasoning, tweet_volume, rank
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          topicAnalysisId,
          subtopic.name,
          subtopic.breakoutScore,
          subtopic.reasoning,
          subtopic.tweetVolume,
          subtopic.rank,
        ]
      );
    }

    return res.json({
      cached: false,
      topic: cleanTopic,
      breakoutScore: analysis.breakoutScore,
      opportunityLevel: analysis.opportunityLevel,
      opportunityMessage: analysis.opportunityMessage,
      competitionLevel: analysis.competitionLevel,
      tweetCount: analysis.tweetCount,
      creatorCount: analysis.creatorCount,
      metrics: analysis.metrics,
      detailedMetrics: analysis.detailedMetrics,
      subtopics: subtopics,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Analysis error:', error);

    if (error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Twitter API rate limit reached. Please try again later.',
      });
    }

    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'An unexpected error occurred',
    });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await db.query(
      `SELECT
        id, topic, breakout_score, opportunity_level,
        tweet_count, creator_count, competition_level,
        created_at
      FROM topic_analyses
      ORDER BY created_at DESC
      LIMIT $1`,
      [limit]
    );

    return res.json({
      history: result.rows.map(row => ({
        id: row.id,
        topic: row.topic,
        breakoutScore: parseFloat(row.breakout_score),
        opportunityLevel: row.opportunity_level,
        tweetCount: row.tweet_count,
        creatorCount: row.creator_count,
        competitionLevel: row.competition_level,
        analyzedAt: row.created_at,
      })),
    });
  } catch (error: any) {
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch analysis history' });
  }
});

function getOpportunityMessage(level: string): string {
  switch (level) {
    case 'HIGH OPPORTUNITY':
      return 'Strong breakout potential';
    case 'MEDIUM OPPORTUNITY':
      return 'Moderate potential, find unique angle';
    case 'LOW OPPORTUNITY':
      return 'Oversaturated or declining interest';
    default:
      return 'Unknown opportunity level';
  }
}

export default router;
