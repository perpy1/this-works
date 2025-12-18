import { Tweet, User } from './twitterService';

export interface MetricScores {
  conversationVolumeScore: number;
  trendVelocityScore: number;
  engagementQualityScore: number;
  creatorSaturationScore: number;
  contentQualityGapScore: number;
}

export interface BreakoutAnalysis {
  breakoutScore: number;
  metrics: MetricScores;
  tweetCount: number;
  creatorCount: number;
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  opportunityLevel: 'HIGH OPPORTUNITY' | 'MEDIUM OPPORTUNITY' | 'LOW OPPORTUNITY';
  opportunityMessage: string;
  detailedMetrics: {
    avgEngagementRate: number;
    recentTweetCount: number;
    olderTweetCount: number;
    growthRate: number;
    avgTweetLength: number;
    retweetRatio: number;
    questionRatio: number;
  };
}

export class ScoringEngine {
  private readonly BASELINE_TWEETS_PER_TOPIC = 200;
  private readonly BASELINE_ENGAGEMENT_RATE = 0.02; // 2%
  private readonly SATURATION_THRESHOLD = 100;

  calculateConversationVolumeScore(tweetCount: number): number {
    const scalingFactor = 5;
    const score = (tweetCount / this.BASELINE_TWEETS_PER_TOPIC) * scalingFactor;
    return Math.min(Math.round(score * 10) / 10, 10);
  }

  calculateTrendVelocityScore(
    recentTweets: Tweet[],
    olderTweets: Tweet[]
  ): { score: number; growthRate: number } {
    const recentCount = recentTweets.length;
    const olderCount = olderTweets.length || 1;

    const growthRate = ((recentCount - olderCount) / olderCount) * 100;

    let score: number;
    if (growthRate > 50) {
      score = 10;
    } else if (growthRate >= 25) {
      score = 7 + ((growthRate - 25) / 25) * 2;
    } else if (growthRate >= 0) {
      score = 5 + (growthRate / 25) * 2;
    } else if (growthRate >= -25) {
      score = 3 + ((growthRate + 25) / 25) * 2;
    } else {
      score = Math.max(1, 3 + (growthRate + 25) / 25);
    }

    return {
      score: Math.round(score * 10) / 10,
      growthRate: Math.round(growthRate * 10) / 10,
    };
  }

  calculateEngagementQualityScore(tweets: Tweet[]): { score: number; avgRate: number } {
    if (tweets.length === 0) return { score: 0, avgRate: 0 };

    let totalEngagementRate = 0;
    let validTweets = 0;

    tweets.forEach(tweet => {
      const { like_count, retweet_count, reply_count, impression_count } = tweet.public_metrics;
      const engagements = like_count + retweet_count + reply_count;
      const impressions = impression_count || (engagements * 50);

      if (impressions > 0) {
        const rate = engagements / impressions;
        totalEngagementRate += rate;
        validTweets++;
      }
    });

    const avgEngagementRate = validTweets > 0 ? totalEngagementRate / validTweets : 0;
    let score = (avgEngagementRate / this.BASELINE_ENGAGEMENT_RATE) * 5;

    const replyRatio = this.calculateReplyRatio(tweets);
    if (replyRatio > 0.3) {
      score += 2;
    }

    return {
      score: Math.min(Math.round(score * 10) / 10, 10),
      avgRate: Math.round(avgEngagementRate * 1000) / 10,
    };
  }

  calculateReplyRatio(tweets: Tweet[]): number {
    if (tweets.length === 0) return 0;

    const totalReplies = tweets.reduce(
      (sum, tweet) => sum + tweet.public_metrics.reply_count,
      0
    );
    const totalEngagements = tweets.reduce(
      (sum, tweet) =>
        sum +
        tweet.public_metrics.like_count +
        tweet.public_metrics.retweet_count +
        tweet.public_metrics.reply_count,
      0
    );

    return totalEngagements > 0 ? totalReplies / totalEngagements : 0;
  }

  calculateCreatorSaturationScore(creatorCount: number): number {
    const score = 10 - creatorCount / this.SATURATION_THRESHOLD * 10;
    return Math.max(0, Math.min(Math.round(score * 10) / 10, 10));
  }

  getCompetitionLevel(creatorCount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (creatorCount <= 30) return 'LOW';
    if (creatorCount <= 70) return 'MEDIUM';
    return 'HIGH';
  }

  calculateContentQualityGapScore(tweets: Tweet[]): {
    score: number;
    avgLength: number;
    retweetRatio: number;
    questionRatio: number;
  } {
    if (tweets.length === 0) {
      return { score: 0, avgLength: 0, retweetRatio: 0, questionRatio: 0 };
    }

    let totalLength = 0;
    let retweetCount = 0;
    let questionCount = 0;

    tweets.forEach(tweet => {
      totalLength += tweet.text.length;
      if (tweet.text.startsWith('RT @')) retweetCount++;
      if (tweet.text.includes('?')) questionCount++;
    });

    const avgLength = totalLength / tweets.length;
    const retweetRatio = retweetCount / tweets.length;
    const questionRatio = questionCount / tweets.length;

    let score = 0;

    if (avgLength < 100) score += 3;
    if (retweetRatio > 0.4) score += 2;
    if (questionRatio > 0.2) score += 2;

    const topTweets = [...tweets]
      .sort((a, b) => {
        const aEngagement =
          a.public_metrics.like_count +
          a.public_metrics.retweet_count +
          a.public_metrics.reply_count;
        const bEngagement =
          b.public_metrics.like_count +
          b.public_metrics.retweet_count +
          b.public_metrics.reply_count;
        return bEngagement - aEngagement;
      })
      .slice(0, 10);

    if (topTweets.length > 0) {
      const topAvgEngagement =
        topTweets.reduce(
          (sum, t) =>
            sum +
            t.public_metrics.like_count +
            t.public_metrics.retweet_count +
            t.public_metrics.reply_count,
          0
        ) / topTweets.length;

      if (topAvgEngagement > 100) score += 3;
    }

    return {
      score: Math.min(Math.round(score * 10) / 10, 10),
      avgLength: Math.round(avgLength),
      retweetRatio: Math.round(retweetRatio * 100) / 100,
      questionRatio: Math.round(questionRatio * 100) / 100,
    };
  }

  identifyCreators(tweets: Tweet[], users: Map<string, User>): number {
    const authorPostCount = new Map<string, number>();

    tweets.forEach(tweet => {
      const count = authorPostCount.get(tweet.author_id) || 0;
      authorPostCount.set(tweet.author_id, count + 1);
    });

    let creatorCount = 0;
    authorPostCount.forEach(count => {
      if (count >= 3) creatorCount++;
    });

    return creatorCount;
  }

  splitTweetsByTimeframe(tweets: Tweet[]): { recent: Tweet[]; older: Tweet[] } {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent: Tweet[] = [];
    const older: Tweet[] = [];

    tweets.forEach(tweet => {
      const tweetDate = new Date(tweet.created_at);
      if (tweetDate >= sevenDaysAgo) {
        recent.push(tweet);
      } else {
        older.push(tweet);
      }
    });

    return { recent, older };
  }

  calculateBreakoutScore(metrics: MetricScores): number {
    const score =
      metrics.conversationVolumeScore * 0.15 +
      metrics.trendVelocityScore * 0.25 +
      metrics.engagementQualityScore * 0.2 +
      metrics.creatorSaturationScore * 0.25 +
      metrics.contentQualityGapScore * 0.15;

    return Math.round(score * 10) / 10;
  }

  getOpportunityLevel(
    breakoutScore: number
  ): { level: 'HIGH OPPORTUNITY' | 'MEDIUM OPPORTUNITY' | 'LOW OPPORTUNITY'; message: string } {
    if (breakoutScore >= 8.0) {
      return {
        level: 'HIGH OPPORTUNITY',
        message: 'Strong breakout potential',
      };
    } else if (breakoutScore >= 5.0) {
      return {
        level: 'MEDIUM OPPORTUNITY',
        message: 'Moderate potential, find unique angle',
      };
    } else {
      return {
        level: 'LOW OPPORTUNITY',
        message: 'Oversaturated or declining interest',
      };
    }
  }

  analyzeTopicBreakout(tweets: Tweet[], users: Map<string, User>): BreakoutAnalysis {
    const { recent, older } = this.splitTweetsByTimeframe(tweets);

    const conversationVolumeScore = this.calculateConversationVolumeScore(tweets.length);
    const { score: trendVelocityScore, growthRate } = this.calculateTrendVelocityScore(
      recent,
      older
    );
    const { score: engagementQualityScore, avgRate } = this.calculateEngagementQualityScore(
      tweets
    );
    const creatorCount = this.identifyCreators(tweets, users);
    const creatorSaturationScore = this.calculateCreatorSaturationScore(creatorCount);
    const {
      score: contentQualityGapScore,
      avgLength,
      retweetRatio,
      questionRatio,
    } = this.calculateContentQualityGapScore(tweets);

    const metrics: MetricScores = {
      conversationVolumeScore,
      trendVelocityScore,
      engagementQualityScore,
      creatorSaturationScore,
      contentQualityGapScore,
    };

    const breakoutScore = this.calculateBreakoutScore(metrics);
    const { level: opportunityLevel, message: opportunityMessage } =
      this.getOpportunityLevel(breakoutScore);
    const competitionLevel = this.getCompetitionLevel(creatorCount);

    return {
      breakoutScore,
      metrics,
      tweetCount: tweets.length,
      creatorCount,
      competitionLevel,
      opportunityLevel,
      opportunityMessage,
      detailedMetrics: {
        avgEngagementRate: avgRate,
        recentTweetCount: recent.length,
        olderTweetCount: older.length,
        growthRate,
        avgTweetLength: avgLength,
        retweetRatio,
        questionRatio,
      },
    };
  }
}

export default new ScoringEngine();
