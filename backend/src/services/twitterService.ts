import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

export interface Tweet {
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
}

export interface User {
  id: string;
  username: string;
  name: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export interface TwitterSearchResponse {
  tweets: Tweet[];
  users: Map<string, User>;
  meta: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
    next_token?: string;
  };
}

class TwitterService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: TWITTER_API_BASE,
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async searchRecentTweets(
    query: string,
    maxResults: number = 100,
    startTime?: string,
    endTime?: string
  ): Promise<TwitterSearchResponse> {
    try {
      const params: any = {
        query: query,
        max_results: Math.min(maxResults, 100),
        'tweet.fields': 'created_at,public_metrics,author_id,conversation_id',
        'user.fields': 'username,name,public_metrics',
        'expansions': 'author_id',
      };

      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;

      const response = await this.axiosInstance.get('/tweets/search/recent', { params });

      const tweets: Tweet[] = response.data.data || [];
      const users = new Map<string, User>();

      if (response.data.includes?.users) {
        response.data.includes.users.forEach((user: User) => {
          users.set(user.id, user);
        });
      }

      return {
        tweets,
        users,
        meta: response.data.meta || { result_count: 0 },
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Twitter API rate limit exceeded. Please try again later.');
      }
      console.error('Twitter API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch tweets from Twitter API');
    }
  }

  async searchTweetsWithPagination(
    query: string,
    targetCount: number = 500,
    daysBack: number = 30
  ): Promise<TwitterSearchResponse> {
    const allTweets: Tweet[] = [];
    const allUsers = new Map<string, User>();
    let nextToken: string | undefined;
    let attempts = 0;
    const maxAttempts = Math.ceil(targetCount / 100);

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setDate(startTime.getDate() - daysBack);

    while (allTweets.length < targetCount && attempts < maxAttempts) {
      try {
        const params: any = {
          query: query,
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics,author_id,conversation_id',
          'user.fields': 'username,name,public_metrics',
          'expansions': 'author_id',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        };

        if (nextToken) {
          params.next_token = nextToken;
        }

        const response = await this.axiosInstance.get('/tweets/search/recent', { params });

        const tweets: Tweet[] = response.data.data || [];
        allTweets.push(...tweets);

        if (response.data.includes?.users) {
          response.data.includes.users.forEach((user: User) => {
            allUsers.set(user.id, user);
          });
        }

        nextToken = response.data.meta?.next_token;

        if (!nextToken || tweets.length === 0) {
          break;
        }

        attempts++;

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        if (error.response?.status === 429) {
          console.log('Rate limit hit, returning collected tweets');
          break;
        }
        throw error;
      }
    }

    return {
      tweets: allTweets.slice(0, Math.min(allTweets.length, 2000)),
      users: allUsers,
      meta: {
        result_count: allTweets.length,
      },
    };
  }
}

export default new TwitterService();
