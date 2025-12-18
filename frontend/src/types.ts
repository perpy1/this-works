export interface Subtopic {
  name: string;
  breakoutScore: number;
  reasoning: string;
  tweetVolume: number;
  rank: number;
}

export interface Metrics {
  conversationVolumeScore: number;
  trendVelocityScore: number;
  engagementQualityScore: number;
  creatorSaturationScore: number;
  contentQualityGapScore: number;
}

export interface DetailedMetrics {
  avgEngagementRate: number;
  recentTweetCount: number;
  olderTweetCount: number;
  growthRate: number;
  avgTweetLength: number;
  retweetRatio: number;
  questionRatio: number;
}

export interface AnalysisResult {
  cached: boolean;
  topic: string;
  breakoutScore: number;
  opportunityLevel: 'HIGH OPPORTUNITY' | 'MEDIUM OPPORTUNITY' | 'LOW OPPORTUNITY';
  opportunityMessage: string;
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tweetCount: number;
  creatorCount: number;
  metrics: Metrics;
  detailedMetrics: DetailedMetrics;
  subtopics: Subtopic[];
  analyzedAt: string;
}
