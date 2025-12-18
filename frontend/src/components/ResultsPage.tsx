import { AnalysisResult } from '../types';
import './ResultsPage.css';

interface ResultsPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

function ResultsPage({ result, onReset }: ResultsPageProps) {
  const getScoreColor = (level: string) => {
    switch (level) {
      case 'HIGH OPPORTUNITY':
        return '#10b981';
      case 'MEDIUM OPPORTUNITY':
        return '#f59e0b';
      case 'LOW OPPORTUNITY':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return '#10b981';
      case 'MEDIUM':
        return '#f59e0b';
      case 'HIGH':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatMetricName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace('Score', '');
  };

  return (
    <div className="results-page">
      <div className="results-container">
        <button onClick={onReset} className="back-button">
          ← Analyze Another Topic
        </button>

        <div className="results-header">
          <h1 className="topic-title">{result.topic}</h1>
          {result.cached && <span className="cached-badge">Cached Result</span>}
        </div>

        <div className="score-section">
          <div className="breakout-score">
            <div
              className="score-circle"
              style={{ borderColor: getScoreColor(result.opportunityLevel) }}
            >
              <span className="score-number">{result.breakoutScore}</span>
              <span className="score-label">/ 10</span>
            </div>
            <div className="score-info">
              <h2
                className="opportunity-level"
                style={{ color: getScoreColor(result.opportunityLevel) }}
              >
                {result.opportunityLevel}
              </h2>
              <p className="opportunity-message">{result.opportunityMessage}</p>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tweets</div>
            <div className="stat-value">{result.tweetCount.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Creators</div>
            <div className="stat-value">{result.creatorCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Competition Level</div>
            <div
              className="stat-value"
              style={{ color: getCompetitionColor(result.competitionLevel) }}
            >
              {result.competitionLevel}
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h3 className="section-title">Market Signals Breakdown</h3>
          <div className="metrics-grid">
            {Object.entries(result.metrics).map(([key, value]) => (
              <div key={key} className="metric-item">
                <div className="metric-header">
                  <span className="metric-name">{formatMetricName(key)}</span>
                  <span className="metric-score">{value.toFixed(1)}</span>
                </div>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{
                      width: `${(value / 10) * 100}%`,
                      backgroundColor:
                        value >= 7 ? '#10b981' : value >= 4 ? '#f59e0b' : '#ef4444',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {result.subtopics && result.subtopics.length > 0 && (
          <div className="subtopics-section">
            <h3 className="section-title">Recommended Subtopic Angles</h3>
            <div className="subtopics-grid">
              {result.subtopics.map((subtopic) => (
                <div key={subtopic.rank} className="subtopic-card">
                  <div className="subtopic-header">
                    <span className="subtopic-rank">#{subtopic.rank}</span>
                    <span className="subtopic-score">{subtopic.breakoutScore.toFixed(1)}</span>
                  </div>
                  <h4 className="subtopic-name">{subtopic.name}</h4>
                  <p className="subtopic-reasoning">{subtopic.reasoning}</p>
                  <div className="subtopic-volume">
                    {subtopic.tweetVolume} tweets analyzed
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.detailedMetrics && (
          <div className="detailed-metrics">
            <h3 className="section-title">Detailed Analysis</h3>
            <div className="detailed-grid">
              <div className="detailed-item">
                <span className="detailed-label">Avg Engagement Rate</span>
                <span className="detailed-value">
                  {result.detailedMetrics.avgEngagementRate.toFixed(1)}%
                </span>
              </div>
              <div className="detailed-item">
                <span className="detailed-label">Growth Rate</span>
                <span className="detailed-value">
                  {result.detailedMetrics.growthRate > 0 ? '+' : ''}
                  {result.detailedMetrics.growthRate.toFixed(1)}%
                </span>
              </div>
              <div className="detailed-item">
                <span className="detailed-label">Avg Tweet Length</span>
                <span className="detailed-value">{result.detailedMetrics.avgTweetLength} chars</span>
              </div>
              <div className="detailed-item">
                <span className="detailed-label">Question Ratio</span>
                <span className="detailed-value">
                  {(result.detailedMetrics.questionRatio * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;
