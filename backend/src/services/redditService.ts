import axios from 'axios';

export interface RedditPost {
  id: string;
  text: string;
  author: string;
  created_at: string;
  public_metrics: {
    score: number;
    num_comments: number;
    upvote_ratio: number;
  };
  subreddit: string;
  url: string;
}

export interface RedditSearchResponse {
  posts: RedditPost[];
  meta: {
    result_count: number;
    after?: string;
  };
}

class RedditService {
  private readonly BASE_URL = 'https://www.reddit.com';

  async searchPosts(
    query: string,
    limit: number = 100,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month',
    sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'new'
  ): Promise<RedditSearchResponse> {
    try {
      const response = await axios.get(`${this.BASE_URL}/search.json`, {
        params: {
          q: query,
          limit: Math.min(limit, 100),
          sort: sort,
          t: timeframe,
          type: 'link'
        },
        headers: {
          'User-Agent': 'BreakoutAnalyzer/1.0 (Content Analysis Tool)'
        }
      });

      const posts: RedditPost[] = response.data.data.children.map((child: any) => {
        const post = child.data;
        return {
          id: post.id,
          text: post.title + ' ' + (post.selftext || ''),
          author: post.author,
          created_at: new Date(post.created_utc * 1000).toISOString(),
          public_metrics: {
            score: post.score,
            num_comments: post.num_comments,
            upvote_ratio: post.upvote_ratio
          },
          subreddit: post.subreddit,
          url: `https://reddit.com${post.permalink}`
        };
      });

      return {
        posts,
        meta: {
          result_count: posts.length,
          after: response.data.data.after
        }
      };
    } catch (error: any) {
      console.error('Reddit API error:', error.message);
      throw new Error('Failed to fetch posts from Reddit');
    }
  }

  async searchPostsWithPagination(
    query: string,
    targetCount: number = 500
  ): Promise<RedditSearchResponse> {
    const allPosts: RedditPost[] = [];
    let after: string | undefined;
    let attempts = 0;
    const maxAttempts = Math.ceil(targetCount / 100);

    while (allPosts.length < targetCount && attempts < maxAttempts) {
      try {
        const params: any = {
          q: query,
          limit: 100,
          sort: 'new',
          t: 'month'
        };

        if (after) {
          params.after = after;
        }

        const response = await axios.get(`${this.BASE_URL}/search.json`, {
          params,
          headers: {
            'User-Agent': 'BreakoutAnalyzer/1.0'
          }
        });

        const posts: RedditPost[] = response.data.data.children.map((child: any) => {
          const post = child.data;
          return {
            id: post.id,
            text: post.title + ' ' + (post.selftext || ''),
            author: post.author,
            created_at: new Date(post.created_utc * 1000).toISOString(),
            public_metrics: {
              score: post.score,
              num_comments: post.num_comments,
              upvote_ratio: post.upvote_ratio
            },
            subreddit: post.subreddit,
            url: `https://reddit.com${post.permalink}`
          };
        });

        allPosts.push(...posts);
        after = response.data.data.after;

        if (!after || posts.length === 0) {
          break;
        }

        attempts++;

        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error('Reddit pagination error:', error.message);
        break;
      }
    }

    return {
      posts: allPosts.slice(0, Math.min(allPosts.length, targetCount)),
      meta: {
        result_count: allPosts.length
      }
    };
  }

  // Get comments from a specific subreddit
  async getSubredditPosts(
    subreddit: string,
    limit: number = 100,
    timeframe: 'day' | 'week' | 'month' = 'month'
  ): Promise<RedditSearchResponse> {
    try {
      const response = await axios.get(`${this.BASE_URL}/r/${subreddit}/new.json`, {
        params: {
          limit: Math.min(limit, 100),
          t: timeframe
        },
        headers: {
          'User-Agent': 'BreakoutAnalyzer/1.0'
        }
      });

      const posts: RedditPost[] = response.data.data.children.map((child: any) => {
        const post = child.data;
        return {
          id: post.id,
          text: post.title + ' ' + (post.selftext || ''),
          author: post.author,
          created_at: new Date(post.created_utc * 1000).toISOString(),
          public_metrics: {
            score: post.score,
            num_comments: post.num_comments,
            upvote_ratio: post.upvote_ratio
          },
          subreddit: post.subreddit,
          url: `https://reddit.com${post.permalink}`
        };
      });

      return {
        posts,
        meta: {
          result_count: posts.length
        }
      };
    } catch (error: any) {
      console.error('Reddit subreddit error:', error.message);
      throw new Error(`Failed to fetch posts from r/${subreddit}`);
    }
  }
}

export default new RedditService();
