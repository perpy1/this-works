import { useState } from 'react';
import './HomePage.css';

interface HomePageProps {
  onAnalyze: (topic: string) => void;
}

function HomePage({ onAnalyze }: HomePageProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onAnalyze(topic.trim());
    }
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="title">Twitter Breakout Analyzer</h1>
        <p className="subtitle">
          Discover content opportunities by analyzing Twitter trends and engagement patterns
        </p>

        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            placeholder="Enter a topic (e.g., 'crypto marketing')"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="search-input"
            autoFocus
          />
          <button type="submit" className="analyze-button" disabled={!topic.trim()}>
            Analyze Topic
          </button>
        </form>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Breakout Score</h3>
            <p>Get a 0-10 rating of content opportunity</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Competition Analysis</h3>
            <p>See how many creators are in this space</p>
          </div>
          <div className="feature">
            <div className="feature-icon">💡</div>
            <h3>Subtopic Suggestions</h3>
            <p>Find 3 specific angles to pursue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
