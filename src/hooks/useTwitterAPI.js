// hooks/useTwitterAPI.js
// Custom hook for making Twitter API calls with rate limit tracking

import { useState, useCallback } from 'react';
import { updateTwitterRateLimit } from '../TwitterAuth';

export function useTwitterAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);

  const makeRequest = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    setRateLimitExceeded(false);

    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      // Update rate limit info if present
      if (data.rateLimit) {
        updateTwitterRateLimit(data.rateLimit);
      }

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitExceeded(true);
          throw new Error(data.message || 'Rate limit exceeded. Please wait before trying again.');
        }
        throw new Error(data.error || 'Request failed');
      }

      setLoading(false);
      return data;

    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const getTweets = useCallback(async () => {
    return makeRequest('/api/twitter/tweets');
  }, [makeRequest]);

  const postTweet = useCallback(async (text) => {
    return makeRequest('/api/twitter/tweet', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }, [makeRequest]);

  const getRateLimitStatus = useCallback(async () => {
    return makeRequest('/api/twitter/rate-limit-status');
  }, [makeRequest]);

  return {
    loading,
    error,
    rateLimitExceeded,
    getTweets,
    postTweet,
    getRateLimitStatus,
    makeRequest, // For custom endpoints
  };
}

// Example usage in a component:
/*
import { useTwitterAPI } from './hooks/useTwitterAPI';

function TweetList() {
  const [tweets, setTweets] = useState([]);
  const { loading, error, rateLimitExceeded, getTweets } = useTwitterAPI();

  const fetchTweets = async () => {
    try {
      const data = await getTweets();
      setTweets(data.tweets);
      
      if (data.cached) {
        console.log('Using cached data - no API call made');
      }
    } catch (err) {
      console.error('Failed to fetch tweets:', err);
    }
  };

  if (rateLimitExceeded) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        Rate limit exceeded. Please wait before fetching more tweets.
      </div>
    );
  }

  return (
    <div>
      <button onClick={fetchTweets} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Tweets'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {tweets.map(tweet => (
        <div key={tweet.id}>{tweet.text}</div>
      ))}
    </div>
  );
}
*/