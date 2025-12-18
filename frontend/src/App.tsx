import { useState } from 'react';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import { AnalysisResult } from './types';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (topic: string) => {
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, useCache: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error: any) {
      alert(error.message || 'Failed to analyze topic. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="app">
      {!analysisResult && !isLoading && <HomePage onAnalyze={handleAnalyze} />}
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Analyzing Twitter data...</h2>
          <p>This may take 20-30 seconds</p>
        </div>
      )}
      {analysisResult && !isLoading && (
        <ResultsPage result={analysisResult} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
