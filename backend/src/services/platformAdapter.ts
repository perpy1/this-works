/**
 * Platform Adapter - Unified interface for multiple data sources
 * Allows switching between Twitter, Reddit, and other platforms without changing core logic
 */

import twitterService, { Tweet, User, TwitterSearchResponse } from './twitterService';
import redditService, { RedditPost, RedditSearchResponse } from './redditService';

export type Platform = 'twitter' | 'reddit' | 'multi';

export interface UnifiedPost {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
  platform: Platform;
  url?: string;
}

export interface UnifiedUser {
  id: string;
  username: string;
  name: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export interface UnifiedResponse {
  posts: UnifiedPost[];
  users: Map<string, UnifiedUser>;
  meta: {
    result_count: number;
    platform: Platform;
  };
}

class PlatformAdapter {
  private platform: Platform;

  constructor() {
    this.platform = (process.env.DATA_PLATFORM as Platform) || 'reddit';
  }

  setPlatform(platform: Platform) {
    this.platform = platform;
  }

  /**
   * Convert Twitter Tweet to UnifiedPost
   */
  private tweetToUnified(tweet: Tweet): UnifiedPost {
    return {
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      created_at: tweet.created_at,
      public_metrics: tweet.public_metrics,
      platform: 'twitter',
    };
  }

  /**
   * Convert Reddit Post to UnifiedPost
   * Maps Reddit metrics to Twitter-like structure for compatibility
   */
  private redditToUnified(post: RedditPost): UnifiedPost {
    const score = post.public_metrics.score;
    const comments = post.public_metrics.num_comments;

    // Estimate engagement metrics from Reddit's scoring system
    const estimatedLikes = Math.max(0, score);
    const estimatedRetweets = Math.floor(score * 0.1); // Assume 10% share rate
    const estimatedImpressions = score * 50; // Rough estimate: 50 views per upvote

    return {
      id: post.id,
      text: post.text,
      author_id: post.author,
      created_at: post.created_at,
      public_metrics: {
        like_count: estimatedLikes,
        retweet_count: estimatedRetweets,
        reply_count: comments,
        quote_count: 0,
        impression_count: estimatedImpressions,
      },
      platform: 'reddit',
      url: post.url,
    };
  }

  /**
   * Convert Twitter User to UnifiedUser
   */
  private twitterUserToUnified(user: User): UnifiedUser {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      public_metrics: user.public_metrics,
    };
  }

  /**
   * Create placeholder user for Reddit (Reddit API doesn't provide detailed user metrics)
   */
  private redditUserToUnified(username: string): UnifiedUser {
    return {
      id: username,
      username: username,
      name: username,
      public_metrics: {
        followers_count: 0,
        following_count: 0,
        tweet_count: 0,
      },
    };
  }

  /**
   * Search for content across the configured platform
   */
  async search(
    query: string,
    targetCount: number = 500,
    daysBack: number = 30
  ): Promise<UnifiedResponse> {
    console.log(`Searching ${this.platform} for: "${query}"`);

    switch (this.platform) {
      case 'twitter':
        return await this.searchTwitter(query, targetCount, daysBack);

      case 'reddit':
        return await this.searchReddit(query, targetCount);

      case 'multi':
        return await this.searchMultiPlatform(query, targetCount);

      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Search Twitter
   */
  private async searchTwitter(
    query: string,
    targetCount: number,
    daysBack: number
  ): Promise<UnifiedResponse> {
    const response: TwitterSearchResponse = await twitterService.searchTweetsWithPagination(
      query,
      targetCount,
      daysBack
    );

    const posts = response.tweets.map(tweet => this.tweetToUnified(tweet));
    const users = new Map<string, UnifiedUser>();

    response.users.forEach((user, id) => {
      users.set(id, this.twitterUserToUnified(user));
    });

    return {
      posts,
      users,
      meta: {
        result_count: posts.length,
        platform: 'twitter',
      },
    };
  }

  /**
   * Search Reddit
   */
  private async searchReddit(
    query: string,
    targetCount: number
  ): Promise<UnifiedResponse> {
    const response: RedditSearchResponse = await redditService.searchPostsWithPagination(
      query,
      targetCount
    );

    const posts = response.posts.map(post => this.redditToUnified(post));
    const users = new Map<string, UnifiedUser>();

    // Create placeholder users for Reddit authors
    response.posts.forEach(post => {
      if (!users.has(post.author)) {
        users.set(post.author, this.redditUserToUnified(post.author));
      }
    });

    return {
      posts,
      users,
      meta: {
        result_count: posts.length,
        platform: 'reddit',
      },
    };
  }

  /**
   * Search multiple platforms and combine results
   */
  private async searchMultiPlatform(
    query: string,
    targetCount: number
  ): Promise<UnifiedResponse> {
    const perPlatform = Math.floor(targetCount / 2);

    try {
      const [redditResults, twitterResults] = await Promise.allSettled([
        this.searchReddit(query, perPlatform),
        this.searchTwitter(query, perPlatform, 30),
      ]);

      const allPosts: UnifiedPost[] = [];
      const allUsers = new Map<string, UnifiedUser>();

      if (redditResults.status === 'fulfilled') {
        allPosts.push(...redditResults.value.posts);
        redditResults.value.users.forEach((user, id) => allUsers.set(id, user));
      } else {
        console.warn('Reddit search failed:', redditResults.reason);
      }

      if (twitterResults.status === 'fulfilled') {
        allPosts.push(...twitterResults.value.posts);
        twitterResults.value.users.forEach((user, id) => allUsers.set(id, user));
      } else {
        console.warn('Twitter search failed:', twitterResults.reason);
      }

      // Sort by date (most recent first)
      allPosts.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return {
        posts: allPosts.slice(0, targetCount),
        users: allUsers,
        meta: {
          result_count: allPosts.length,
          platform: 'multi',
        },
      };
    } catch (error) {
      console.error('Multi-platform search error:', error);
      throw error;
    }
  }
}

export default new PlatformAdapter();
