import natural from 'natural';
import { removeStopwords } from 'stopword';
import { Tweet, User } from './twitterService';
import scoringEngine from './scoringEngine';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

export interface Subtopic {
  name: string;
  breakoutScore: number;
  reasoning: string;
  tweetVolume: number;
  rank: number;
  keywords: string[];
}

export class SubtopicExtractor {
  private readonly MIN_KEYWORD_LENGTH = 3;
  private readonly MIN_TERM_FREQUENCY = 3;
  private readonly BIGRAM_THRESHOLD = 2;

  extractKeywords(tweets: Tweet[]): Map<string, number> {
    const keywordFrequency = new Map<string, number>();

    tweets.forEach(tweet => {
      let text = tweet.text
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[@#]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const tokens = tokenizer.tokenize(text) || [];
      const filtered = removeStopwords(tokens);

      filtered.forEach(token => {
        if (token.length >= this.MIN_KEYWORD_LENGTH && !/^\d+$/.test(token)) {
          const count = keywordFrequency.get(token) || 0;
          keywordFrequency.set(token, count + 1);
        }
      });
    });

    return keywordFrequency;
  }

  extractBigrams(tweets: Tweet[]): Map<string, number> {
    const bigramFrequency = new Map<string, number>();

    tweets.forEach(tweet => {
      let text = tweet.text
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[@#]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const tokens = tokenizer.tokenize(text) || [];
      const filtered = removeStopwords(tokens);

      for (let i = 0; i < filtered.length - 1; i++) {
        const bigram = `${filtered[i]} ${filtered[i + 1]}`;
        if (
          filtered[i].length >= this.MIN_KEYWORD_LENGTH &&
          filtered[i + 1].length >= this.MIN_KEYWORD_LENGTH
        ) {
          const count = bigramFrequency.get(bigram) || 0;
          bigramFrequency.set(bigram, count + 1);
        }
      }
    });

    return bigramFrequency;
  }

  useTfIdf(tweets: Tweet[], topN: number = 20): string[] {
    const tfidf = new TfIdf();

    tweets.forEach(tweet => {
      let text = tweet.text
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[@#]/g, '')
        .replace(/[^\w\s]/g, ' ');

      tfidf.addDocument(text);
    });

    const termScores = new Map<string, number>();

    tfidf.listTerms(0).forEach((item: any) => {
      if (item.term.length >= this.MIN_KEYWORD_LENGTH) {
        const existingScore = termScores.get(item.term) || 0;
        termScores.set(item.term, existingScore + item.tfidf);
      }
    });

    const sortedTerms = Array.from(termScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([term]) => term);

    return sortedTerms;
  }

  clusterKeywordsIntoSubtopics(
    keywords: Map<string, number>,
    bigrams: Map<string, number>,
    mainTopic: string
  ): string[][] {
    const clusters: string[][] = [];
    const mainTopicLower = mainTopic.toLowerCase();

    const sortedBigrams = Array.from(bigrams.entries())
      .filter(([bigram, count]) => count >= this.BIGRAM_THRESHOLD)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    sortedBigrams.forEach(([bigram]) => {
      if (!bigram.includes(mainTopicLower)) {
        clusters.push([bigram]);
      }
    });

    const sortedKeywords = Array.from(keywords.entries())
      .filter(([word, count]) => count >= this.MIN_TERM_FREQUENCY)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    sortedKeywords.forEach(([keyword]) => {
      if (!keyword.includes(mainTopicLower) && keyword.length > 4) {
        let addedToCluster = false;
        for (const cluster of clusters) {
          if (cluster.length < 3) {
            cluster.push(keyword);
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster && clusters.length < 10) {
          clusters.push([keyword]);
        }
      }
    });

    return clusters.slice(0, 10);
  }

  async scoreSubtopic(
    subtopicTerms: string[],
    allTweets: Tweet[],
    users: Map<string, User>
  ): Promise<{ score: number; relevantTweets: Tweet[] }> {
    const relevantTweets = allTweets.filter(tweet => {
      const lowerText = tweet.text.toLowerCase();
      return subtopicTerms.some(term => lowerText.includes(term.toLowerCase()));
    });

    if (relevantTweets.length < 5) {
      return { score: 0, relevantTweets };
    }

    const analysis = scoringEngine.analyzeTopicBreakout(relevantTweets, users);
    return { score: analysis.breakoutScore, relevantTweets };
  }

  async extractSubtopics(
    mainTopic: string,
    tweets: Tweet[],
    users: Map<string, User>,
    topN: number = 3
  ): Promise<Subtopic[]> {
    if (tweets.length < 20) {
      return [];
    }

    const keywords = this.extractKeywords(tweets);
    const bigrams = this.extractBigrams(tweets);
    const clusters = this.clusterKeywordsIntoSubtopics(keywords, bigrams, mainTopic);

    const subtopicCandidates: Array<{
      name: string;
      score: number;
      tweetVolume: number;
      keywords: string[];
    }> = [];

    for (const cluster of clusters) {
      const { score, relevantTweets } = await this.scoreSubtopic(cluster, tweets, users);

      if (score > 0 && relevantTweets.length >= 5) {
        const name =
          cluster.length === 1 && cluster[0].includes(' ')
            ? cluster[0]
            : cluster.slice(0, 2).join(' ');

        subtopicCandidates.push({
          name: this.formatSubtopicName(name),
          score,
          tweetVolume: relevantTweets.length,
          keywords: cluster,
        });
      }
    }

    subtopicCandidates.sort((a, b) => b.score - a.score);

    const topSubtopics = subtopicCandidates.slice(0, topN).map((subtopic, index) => ({
      name: subtopic.name,
      breakoutScore: subtopic.score,
      reasoning: this.generateReasoning(subtopic.score, subtopic.tweetVolume),
      tweetVolume: subtopic.tweetVolume,
      rank: index + 1,
      keywords: subtopic.keywords,
    }));

    return topSubtopics;
  }

  formatSubtopicName(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  generateReasoning(score: number, tweetVolume: number): string {
    if (score >= 8.0) {
      return `High interest with strong engagement, only ${tweetVolume} tweets found - early opportunity`;
    } else if (score >= 6.0) {
      return `Growing interest with ${tweetVolume} tweets, moderate competition`;
    } else if (score >= 4.0) {
      return `Emerging topic with ${tweetVolume} tweets, needs unique angle`;
    } else {
      return `Limited activity (${tweetVolume} tweets), niche audience`;
    }
  }
}

export default new SubtopicExtractor();
