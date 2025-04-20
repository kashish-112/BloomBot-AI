import { useState, useEffect } from 'react';
import styles from '../styles/MentalHealthTest.module.css';

const MentalHealthTest = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    setError(null);
    try {
      console.log('Fetching question...');
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: conversation,
          currentAnswers: responses.reduce((acc, response, index) => {
            acc[index] = { value: response.toLowerCase().replace(/\s+/g, '_'), text: response };
            return acc;
          }, {})
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: text
        });
        throw new Error(`Server returned non-JSON response (${response.status} ${response.statusText})`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate question');
      }
      
      if (!data.question || !data.options) {
        throw new Error('Invalid response format from server');
      }
      
      setCurrentQuestion(data);
      setConversation(prev => [...prev, { role: 'assistant', content: data.question }]);
    } catch (error) {
      console.error('Error fetching question:', error);
      setError(error.message);
    }
  };

  const handleResponse = async (response) => {
    setError(null);
    const newResponses = [...responses, response];
    setResponses(newResponses);
    setConversation(prev => [...prev, { role: 'user', content: response }]);

    if (newResponses.length >= 5) {
      setLoading(true);
      try {
        const analysisResponse = await fetch('/api/analyze-responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers: newResponses.reduce((acc, response, index) => {
              acc[index] = { text: response };
              return acc;
            }, {}),
            conversation: conversation
          }),
        });
        
        const analysisData = await analysisResponse.json();
        
        if (!analysisResponse.ok) {
          throw new Error(analysisData.details || analysisData.error || 'Failed to analyze responses');
        }
        
        setResults(analysisData);
        onComplete(analysisData);
      } catch (error) {
        console.error('Error analyzing responses:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    } else {
      fetchQuestion();
    }
  };

  const progress = (responses.length / 5) * 100;

  if (loading) {
    return (
      <div className={styles.testContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Analyzing your responses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.testContainer}>
        <div className={styles.error}>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => {
              setError(null);
              fetchQuestion();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.analysis}>
          <h2>Your Mental Health Analysis</h2>
          <p>{results.analysis}</p>
        </div>
        
        <div className={styles.insights}>
          <h3>Key Insights</h3>
          <ul>
            {results.insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>

        <div className={styles.recommendations}>
          <h3>Recommendations</h3>
          <ul>
            {results.recommendations.map((recommendation, index) => (
              <li key={index}>{recommendation}</li>
            ))}
          </ul>
        </div>

        <div className={styles.resources}>
          <h3>Helpful Resources</h3>
          <ul>
            {results.resources.map((resource, index) => (
              <li key={index}>
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button 
          className={styles.restartButton}
          onClick={() => {
            setResponses([]);
            setResults(null);
            setConversation([]);
            fetchQuestion();
          }}
        >
          Take Test Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.testContainer}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progress} 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className={styles.question}>
        {currentQuestion?.question}
      </div>

      <div className={styles.options}>
        {currentQuestion?.options.map((option, index) => (
          <button
            key={index}
            className={styles.optionButton}
            onClick={() => handleResponse(option.text)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MentalHealthTest; 