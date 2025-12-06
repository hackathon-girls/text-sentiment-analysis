import { useState, useEffect } from 'react';
import './App.css';
import TwitterAuth from './TwitterAuth'; 

function App() {
  const [postText, setPostText] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [roastMode, setRoastMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [twitterUser, setTwitterUser] = useState(null);
  const [postedTweet, setPostedTweet] = useState(null);
  const [tweetStats, setTweetStats] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userTimeline, setUserTimeline] = useState(null);
  const [analyzingTimeline, setAnalyzingTimeline] = useState(false);

  // Rate limit state for Twitter API
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);

  const platforms = [
    { id: 'twitter', name: 'Twitter/X', icon: '𝕏', limit: 280 },
    { id: 'instagram', name: 'Instagram', icon: '📸', limit: 2200 },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', limit: 3000 },
    { id: 'reddit', name: 'Reddit', icon: '🤖', limit: 40000 }
  ];

  const platformTips = {
    twitter: {
      tips: ['Keep it concise', 'Use hashtags sparingly', 'Threads work well for longer thoughts'],
      tone: 'Quick and punchy'
    },
    instagram: {
      tips: ['Story-driven captions work best', 'Use line breaks for readability', 'Emojis are encouraged'],
      tone: 'Visual and engaging'
    },
    linkedin: {
      tips: ['Professional but authentic', 'Share insights/learnings', 'Avoid oversharing personal drama'],
      tone: 'Professional yet personable'
    },
    reddit: {
      tips: ['Be genuine, Reddit hates marketing speak', 'Engage in discussion', 'Read the room/subreddit rules'],
      tone: 'Authentic and conversational'
    }
  };

  // Load history and rate limit info from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('vibeCheckHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    // Load rate limit info
    loadRateLimitInfo();
  }, []);

  // Load rate limit info
  const loadRateLimitInfo = () => {
    const stored = localStorage.getItem('twitterRateLimit');
    if (stored) {
      const info = JSON.parse(stored);
      const now = Date.now();
      
      // Check if reset time has passed
      if (now > info.resetTime) {
        // Reset the counter
        const newInfo = {
          requestCount: 0,
          resetTime: now + (24 * 60 * 60 * 1000),
          limit: info.limit || 25
        };
        localStorage.setItem('twitterRateLimit', JSON.stringify(newInfo));
        setRateLimitInfo(newInfo);
        setRateLimitExceeded(false);
      } else {
        setRateLimitInfo(info);
        if (info.remaining !== undefined && info.remaining === 0) {
          setRateLimitExceeded(true);
        }
      }
    }
  };

  // Update rate limit after API call
  const updateRateLimit = (remaining, limit, resetTime) => {
    const info = {
      requestCount: limit - remaining,
      resetTime: resetTime * 1000,
      limit: limit,
      remaining: remaining
    };
    localStorage.setItem('twitterRateLimit', JSON.stringify(info));
    setRateLimitInfo(info);
    
    if (remaining === 0) {
      setRateLimitExceeded(true);
    }
  };

  const getVibeColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getVibeLabel = (score) => {
    if (roastMode) {
      if (score >= 80) return "Not Bad, I Guess 😒";
      if (score >= 60) return "Meh, Could Be Worse 🙄";
      if (score >= 40) return "Yikes, Really? 😬";
      return "Absolute Disaster 💀";
    }
    if (score >= 80) return "Chef's Kiss ✨";
    if (score >= 60) return "Pretty Good 👍";
    if (score >= 40) return "Proceed with Caution ⚠️";
    return "Yikes City 🚩";
  };

  const getVibeBg = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const getCurrentPlatform = () => platforms.find(p => p.id === platform);

  const getCharacterWarning = () => {
    const currentPlatform = getCurrentPlatform();
    const length = postText.length;
    const limit = currentPlatform.limit;
    
    if (length === 0) return null;
    if (length > limit) return { type: 'error', text: `${length - limit} characters over limit!` };
    if (length > limit * 0.9) return { type: 'warning', text: `Getting close to ${limit} character limit` };
    return null;
  };

  const saveToHistory = (checkResult) => {
    const newEntry = {
      id: Date.now(),
      postText: postText.substring(0, 100) + (postText.length > 100 ? '...' : ''),
      score: checkResult.score,
      platform,
      timestamp: new Date().toISOString(),
      roastMode
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('vibeCheckHistory', JSON.stringify(updatedHistory));
  };

  const getAverageScore = () => {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, item) => acc + item.score, 0);
    return Math.round(sum / history.length);
  };

  // Delulu Feature Calculators
  const calculateMainCharacterEnergy = (result) => {
    let mcScore = 100 - result.score;
    
    const mainCharacterPhrases = ['just casually', 'not to brag', 'everyone', 'obviously', 'clearly'];
    const text = postText.toLowerCase();
    mainCharacterPhrases.forEach(phrase => {
      if (text.includes(phrase)) mcScore += 10;
    });
    
    mcScore = Math.min(100, mcScore);
    
    let role = 'Background Extra';
    let verdict = 'You exist, we guess.';
    
    if (mcScore >= 90) {
      role = 'MAIN CHARACTER';
      verdict = "You're insufferable. The world doesn't revolve around you (but you think it does)";
    } else if (mcScore >= 70) {
      role = 'Side Character';
      verdict = "You're interesting but not THAT interesting";
    } else if (mcScore >= 40) {
      role = 'Supporting Cast';
      verdict = "You're here, you contribute, but nobody's writing your spinoff";
    } else if (mcScore >= 20) {
      role = 'NPC';
      verdict = "You exist to make others look good";
    }
    
    return { score: mcScore, role, verdict };
  };

  const calculateTouchGrassScore = (result) => {
    let grassScore = result.score;
    
    const onlinePhrases = ['discourse', 'ratio', 'fr fr', 'no cap', 'stan', 'based', 'cringe', 'mid'];
    const text = postText.toLowerCase();
    
    let onlineCount = 0;
    onlinePhrases.forEach(phrase => {
      if (text.includes(phrase)) {
        grassScore -= 15;
        onlineCount++;
      }
    });
    
    grassScore = Math.max(0, grassScore);
    
    let status = 'Balanced';
    let recommendation = "You're doing fine!";
    let lastTouch = '2 days ago';
    
    if (grassScore <= 20) {
      status = 'CHRONICALLY ONLINE';
      recommendation = 'Step away from the screen. Now. Touch grass immediately.';
      lastTouch = '??? (Can\'t remember)';
    } else if (grassScore <= 40) {
      status = 'Terminally Online';
      recommendation = 'Maybe go outside? The sun exists, allegedly.';
      lastTouch = '2 weeks ago';
    } else if (grassScore <= 60) {
      status = 'Somewhat Online';
      recommendation = 'Not terrible, but could use more outdoor time.';
      lastTouch = '5 days ago';
    } else {
      status = 'Grass Toucher';
      recommendation = 'Nice balance! You actually go outside.';
      lastTouch = 'Yesterday';
    }
    
    return { 
      score: grassScore, 
      status, 
      recommendation, 
      lastTouch,
      onlineIndicators: onlineCount 
    };
  };

  const generateViralPrediction = (score) => {
    const reality = Math.max(0, Math.min(5, score / 20));
    const delulu = Math.min(100, score + 50);
    const realLikes = Math.floor(Math.random() * 5) + 1;
    
    return {
      reality,
      delulu,
      realLikes
    };
  };

  // Twitter Functions with Rate Limiting
  const handleTwitterAuth = (userData) => {
    setTwitterUser(userData);
    if (userData) {
      fetchUserTimeline(userData.userId);
    }
  };

  const postToTwitter = async () => {
    if (!twitterUser || !postText.trim()) {
      alert('Please connect Twitter and enter text first!');
      return;
    }

    // Check rate limit before posting
    if (rateLimitExceeded) {
      alert('You have reached your daily Twitter API limit. Please wait for the reset time.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: twitterUser.userId,
          text: postText
        })
      });
      
      const data = await response.json();
      
      // Check for rate limit in response
      if (response.status === 429 || data.error?.includes('rate limit')) {
        alert('Twitter API rate limit exceeded. Please wait before posting again.');
        setRateLimitExceeded(true);
        return;
      }
      
      // Update rate limit if headers present
      const rateLimit = response.headers.get('x-rate-limit-remaining');
      const rateLimitReset = response.headers.get('x-rate-limit-reset');
      const rateLimitLimit = response.headers.get('x-rate-limit-limit');
      if (rateLimit && rateLimitReset && rateLimitLimit) {
        updateRateLimit(parseInt(rateLimit), parseInt(rateLimitLimit), parseInt(rateLimitReset));
      }
      
      if (data.success) {
        setPostedTweet(data);
        alert(`Tweet posted! ${data.tweetUrl}`);
        trackTweetStats(data.tweetId);
      }
    } catch (error) {
      console.error('Error posting tweet:', error);
      alert('Failed to post tweet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const trackTweetStats = async (tweetId) => {
    if (!twitterUser) return;
    
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/tweet/${tweetId}/stats?userId=${twitterUser.userId}`
        );
        const data = await response.json();
        setTweetStats(data.metrics);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    await fetchStats();
    const interval = setInterval(fetchStats, 30000);
    window.tweetStatsInterval = interval;
  };

  const fetchUserTimeline = async (userId) => {
    // Check rate limit before fetching
    if (rateLimitExceeded) {
      alert('You have reached your daily Twitter API limit. Please wait for the reset time.');
      return;
    }

    setAnalyzingTimeline(true);
    try {
      const response = await fetch(`http://localhost:3001/api/tweets/${userId}`);
      const data = await response.json();
      
      // Check for rate limit
      if (response.status === 429 || data.error?.includes('rate limit')) {
        alert('Twitter API rate limit exceeded.');
        setRateLimitExceeded(true);
        return;
      }
      
      // Update rate limit if headers present
      const rateLimit = response.headers.get('x-rate-limit-remaining');
      const rateLimitReset = response.headers.get('x-rate-limit-reset');
      const rateLimitLimit = response.headers.get('x-rate-limit-limit');
      if (rateLimit && rateLimitReset && rateLimitLimit) {
        updateRateLimit(parseInt(rateLimit), parseInt(rateLimitLimit), parseInt(rateLimitReset));
      }
      
      if (data.tweets) {
        setUserTimeline(analyzeTimeline(data.tweets));
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      alert('Failed to fetch timeline: ' + error.message);
    } finally {
      setAnalyzingTimeline(false);
    }
  };

  const analyzeTimeline = (tweets) => {
    if (!tweets || tweets.length === 0) return null;
    
    let mainCharacterCount = 0;
    let timeDistribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    
    const tweetTypes = {
      'Vague Posting': 0,
      'Complaining': 0,
      'Humble Bragging': 0,
      'Actual Thoughts': 0,
      'Thread Guy': 0
    };
    
    tweets.forEach(tweet => {
      const text = tweet.text.toLowerCase();
      
      const hour = new Date(tweet.created_at).getHours();
      if (hour >= 6 && hour < 12) timeDistribution.morning++;
      else if (hour >= 12 && hour < 18) timeDistribution.afternoon++;
      else if (hour >= 18 && hour < 22) timeDistribution.evening++;
      else timeDistribution.night++;
      
      if (text.includes('iykyk') || text.includes('some people')) {
        tweetTypes['Vague Posting']++;
      } else if (text.includes('tired') || text.includes('annoying') || text.includes('hate')) {
        tweetTypes['Complaining']++;
      } else if (text.includes('not to brag') || text.includes('just casually')) {
        tweetTypes['Humble Bragging']++;
      } else if (text.includes('1/') || text.includes('thread')) {
        tweetTypes['Thread Guy']++;
      } else {
        tweetTypes['Actual Thoughts']++;
      }
      
      if (text.includes('everyone') || text.includes('obviously')) {
        mainCharacterCount++;
      }
    });
    
    const avgMCEnergy = Math.round((mainCharacterCount / tweets.length) * 100);
    const mostPostedTime = Object.entries(timeDistribution).reduce((a, b) => 
      timeDistribution[a[0]] > timeDistribution[b[0]] ? a : b
    )[0];
    
    return {
      totalTweets: tweets.length,
      avgMainCharacterEnergy: avgMCEnergy,
      mostPostedTime,
      tweetTypePercentages: Object.entries(tweetTypes).map(([type, count]) => ({
        type,
        percentage: Math.round((count / tweets.length) * 100)
      })).sort((a, b) => b.percentage - a.percentage),
      touchGrassScore: mostPostedTime === 'night' ? 20 : 60,
      verdict: avgMCEnergy > 60 ? "You need better hobbies" : "You're surprisingly balanced"
    };
  };

  const loadExample = () => {
    const examples = [
      "Well, I guess some people just don't understand basic project management 🙃",
      "Ugh so tired from my 3rd international trip this month, being a digital nomad is exhausting lol",
      "Day 47 of my fitness journey! Still not seeing results but staying positive 💪 Also my boss was so rude today and my ex texted me...",
      "Just shipped a new feature! Really proud of the team's hard work on this one. 🚀"
    ];
    setPostText(examples[Math.floor(Math.random() * examples.length)]);
  };

  // KEEP YOUR WORKING VIBE CHECK - NO CHANGES!
  const checkVibe = async () => {
    if (!postText.trim()) return;
    
    setLoading(true);

    try {
      const roastPrompt = roastMode ? `
IMPORTANT: You are in ROAST MODE. Be brutally honest, sarcastic, and funny. Call out every cringe moment, humble brag, and questionable choice. Use humor but still be helpful. Think of a sarcastic friend who tells it like it is.

Examples of roast tone:
- "Oh wow, another 'fitness journey' update. Your 47th day and you're already complaining AND trauma-dumping about your ex? Pick a lane, bestie."
- "The passive-aggressive emoji really ties this disaster together. Nothing says 'professional' like a 🙃 when you're insulting your coworkers."
` : '';

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `${roastPrompt}

Analyze this ${platform} post for potential issues and provide ${roastMode ? 'brutally honest, funny' : 'helpful'} feedback.

Post: "${postText}"

Platform context: ${platformTips[platform].tone} tone works best on ${platform}.

You must respond with ONLY valid JSON (no other text before or after) in this exact format:
{
  "score": <number 0-100>,
  "explanation": "<why this score in ${roastMode ? 'roast' : 'helpful'} tone, 1-2 sentences>",
  "flags": [
    {"type": "warning", "text": "<specific concern in ${roastMode ? 'roast' : 'helpful'} tone>"},
    {"type": "info", "text": "<${roastMode ? 'sarcastic' : 'helpful'} tip>"}
  ],
  "rewrite": "<improved version of the post>"
}

Scoring guidelines:
- 80-100: Thoughtful, positive, clear
- 60-79: Generally good but minor issues
- 40-59: Several concerns about tone/reception
- 0-39: Likely to be misinterpreted or cause problems

Focus on: passive-aggression, humble-bragging, oversharing, anger-posting, sarcasm that doesn't land, condescension, TMI, potential misinterpretations.

${roastMode ? 'Be funny and brutally honest while still being helpful.' : 'Be helpful and non-judgmental.'} Provide at least 2 flags. Make the rewrite maintain the user's intent but improve tone and clarity.`
          }],
          temperature: roastMode ? 0.9 : 0.7,
          max_tokens: 1500,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const resultText = data.choices[0].message.content;
      const parsedResult = JSON.parse(resultText);

      parsedResult.deluluFeatures = {
        mainCharacter: calculateMainCharacterEnergy(parsedResult),
        touchGrass: calculateTouchGrassScore(parsedResult),
        viral: generateViralPrediction(parsedResult.score)
      };
      
      setResult(parsedResult);
      saveToHistory(parsedResult);
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Oops! Something went wrong: ${error.message}\n\nCheck:\n1. Your API key is correct in .env\n2. You restarted the app after adding .env\n3. Your Groq API key starts with 'gsk_'`);
    } finally {
      setLoading(false);
    }
  };

  const copyRewrite = () => {
    if (result?.rewrite) {
      navigator.clipboard.writeText(result.rewrite);
      alert('Copied to clipboard! 📋');
    }
  };

  const warning = getCharacterWarning();
  const currentPlatform = getCurrentPlatform();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            VibeCheck
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Will your post flop? Let's find out.
          </p>
          
          {/* Roast Mode Toggle */}
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-purple-200">
            <span className={`font-semibold transition-all ${!roastMode ? 'text-purple-600' : 'text-gray-400'}`}>
              😊 Nice Mode
            </span>
            <button
              onClick={() => setRoastMode(!roastMode)}
              className={`relative w-14 h-7 rounded-full transition-all ${
                roastMode ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  roastMode ? 'transform translate-x-7' : ''
                }`}
              />
            </button>
            <span className={`font-semibold transition-all ${roastMode ? 'text-red-600' : 'text-gray-400'}`}>
              💀 Roast Mode
            </span>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-100">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Choose Your Battlefield
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  platform === p.id
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-1">{p.icon}</div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">{p.limit} chars</div>
              </button>
            ))}
          </div>
        </div>

        {/* Twitter Auth Section */}
        {platform === 'twitter' && (
          <div className="mb-6">
            <TwitterAuth onAuthSuccess={handleTwitterAuth} />
          </div>
        )} 

        {/* Rate Limit Warning */}
         {rateLimitExceeded && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-800">Twitter API Rate Limit Reached</h3>
                <p className="text-sm text-red-700">
                  You've reached your daily limit. Check the rate limit display above for reset time.
                </p>
              </div>
            </div>
          </div>
        )}  

        {/* Platform Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-bold text-gray-800 mb-1">
                {currentPlatform.name} Tips
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Tone: <span className="font-semibold">{platformTips[platform].tone}</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {platformTips[platform].tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-100">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            What's on your mind? (Be honest, we'll judge you)
          </label>
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder={`Type your ${currentPlatform.name} post here...`}
            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
            rows="6"
          />
          
          {/* Character Count */}
          <div className="flex justify-between items-center mt-3">
            <div className={`text-sm font-semibold ${
              postText.length > currentPlatform.limit ? 'text-red-500' : 'text-gray-500'
            }`}>
              {postText.length} / {currentPlatform.limit} characters
            </div>
            {warning && (
              <div className={`text-sm font-semibold ${
                warning.type === 'error' ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {warning.text}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={checkVibe}
            disabled={loading || !postText.trim()}
            className={`flex-1 py-4 rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 ${
              roastMode
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-300'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-300'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                {roastMode ? 'Preparing Roast...' : 'Checking Vibe...'}
              </span>
            ) : (
              roastMode ? '🔥 Roast My Post' : '✨ Check My Vibe'
            )}
          </button>

          <button
            onClick={loadExample}
            className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all"
          >
            🎲 Example
          </button>

          {platform === 'twitter' && twitterUser && (
            <button
              onClick={postToTwitter}
              disabled={loading || !postText.trim() || postText.length > 280 || rateLimitExceeded}
              className="px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              🐦 Post to Twitter
            </button>
          )}
        </div>

        {/* Twitter Timeline Analysis Button */}
        {platform === 'twitter' && twitterUser && (
          <div className="mb-6">
            <button
              onClick={() => fetchUserTimeline(twitterUser.userId)}
              disabled={analyzingTimeline || rateLimitExceeded}
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              {analyzingTimeline ? '🔍 Analyzing Timeline...' : '📊 Analyze My Timeline'}
            </button>
          </div>
        )}

        {/* Posted Tweet Success */}
        {postedTweet && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-green-800 mb-2">✅ Tweet Posted Successfully!</h3>
            <p className="text-sm text-green-700">Check it out: <a href={postedTweet.tweetUrl} target="_blank" rel="noopener noreferrer" className="underline">View Tweet</a></p>
          </div>
        )}

        {/* Tweet Stats */}
        {tweetStats && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">📊 Tweet Performance</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-blue-600">{tweetStats.likes || 0}</div>
                <div className="text-xs text-blue-700">Likes</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600">{tweetStats.retweets || 0}</div>
                <div className="text-xs text-blue-700">Retweets</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600">{tweetStats.replies || 0}</div>
                <div className="text-xs text-blue-700">Replies</div>
              </div>
            </div>
          </div>
        )}

        {/* History Stats */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Your Average Vibe Score</div>
                <div className={`text-3xl font-black ${getVibeColor(getAverageScore())}`}>
                  {getAverageScore()}/100
                </div>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
              >
                {showHistory ? 'Hide' : 'Show'} History
              </button>
            </div>

            {showHistory && (
              <div className="mt-4 space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-800 mb-1">{item.postText}</div>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>{platforms.find(p => p.id === item.platform)?.icon}</span>
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className={`text-2xl font-black ${getVibeColor(item.score)}`}>
                        {item.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results - YOUR WORKING UI, NO CHANGES */}
        {result && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-purple-200 mb-6">
            {/* Score Display */}
            <div className="text-center mb-8">
              <div className={`text-8xl font-black mb-4 bg-gradient-to-r ${getVibeBg(result.score)} bg-clip-text text-transparent`}>
                {result.score}
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {getVibeLabel(result.score)}
              </div>
              <div className="inline-block px-6 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold">
                {platforms.find(p => p.id === platform)?.icon} {platforms.find(p => p.id === platform)?.name}
              </div>
            </div>

            {/* Vibe Meter */}
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getVibeBg(result.score)} transition-all duration-1000 ease-out`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>

            {/* Analysis */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-2">📝 Analysis</h3>
                <p className="text-gray-700">{result.explanation}</p>
              </div>

              {result.flags && result.flags.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h3 className="font-bold text-yellow-800 mb-2">⚠️ Things to Consider</h3>
                  <ul className="space-y-2">
                    {result.flags.map((flag, i) => (
                      <li key={i} className="text-yellow-700 text-sm">
                        • {flag.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.rewrite && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">✨ Suggested Rewrite</h3>
                  <p className="text-green-700 mb-3">{result.rewrite}</p>
                  <button
                    onClick={copyRewrite}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    📋 Copy Rewrite
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPostText('');
                  setResult(null);
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all"
              >
                ← Start Over
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(postText);
                  alert('Copied to clipboard!');
                }}
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all"
              >
                📋 Copy Text
              </button>
              <button
                onClick={() => window.open('https://twitter.com', '_blank')}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all"
              >
                😈 Post Anyway
              </button>
            </div>

            {/* Delulu Features - YOUR WORKING UI */}
            {result.deluluFeatures && (
              <div className="mt-8 pt-8 border-t-4 border-purple-300">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                    ✨ DELULU ANALYSIS ✨
                  </h2>
                  <p className="text-gray-600 text-sm">Because we're in our delulu era</p>
                </div>

                {/* Main Character Energy */}
                <div className="mb-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 relative overflow-hidden">
                  {result.deluluFeatures.mainCharacter.score >= 90 && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-1/2 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    </div>
                  )}
                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      🎬 Main Character Energy
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-6xl font-black text-orange-600">
                        {result.deluluFeatures.mainCharacter.score}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          {result.deluluFeatures.mainCharacter.role}
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.deluluFeatures.mainCharacter.score >= 90 ? 'Delulu Level: MAXIMUM' : 
                           result.deluluFeatures.mainCharacter.score >= 70 ? 'Delulu Level: High' :
                           result.deluluFeatures.mainCharacter.score >= 40 ? 'Delulu Level: Medium' : 
                           'Delulu Level: Low'}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-3 mb-4 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000"
                        style={{ width: `${result.deluluFeatures.mainCharacter.score}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-700 italic leading-relaxed">
                      {result.deluluFeatures.mainCharacter.verdict}
                    </p>
                    {result.deluluFeatures.mainCharacter.score >= 90 && (
                      <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 rounded">
                        <p className="text-sm text-red-800 font-semibold">
                          🚨 ALERT: You're the main character of a story nobody's watching
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Touch Grass Meter */}
                <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🌱 Touch Grass Meter
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-6xl font-black text-green-600 mb-2">
                        {result.deluluFeatures.touchGrass.score}
                      </div>
                      <div className="text-sm text-gray-600">
                        Status: <span className="font-bold">{result.deluluFeatures.touchGrass.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl mb-2">
                        {result.deluluFeatures.touchGrass.score <= 20 ? '😱' :
                         result.deluluFeatures.touchGrass.score <= 40 ? '😰' :
                         result.deluluFeatures.touchGrass.score <= 60 ? '😅' : '😊'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Last grass touch:<br/>{result.deluluFeatures.touchGrass.lastTouch}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-3 mb-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-1000"
                      style={{ width: `${result.deluluFeatures.touchGrass.score}%` }}
                    ></div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-green-200 mb-3">
                    <p className="text-gray-700 font-medium">
                      {result.deluluFeatures.touchGrass.recommendation}
                    </p>
                  </div>
                  {result.deluluFeatures.touchGrass.onlineIndicators > 0 && (
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <p className="text-sm text-orange-800">
                        ⚠️ Detected {result.deluluFeatures.touchGrass.onlineIndicators} chronically online indicator(s)
                      </p>
                    </div>
                  )}
                </div>

                {/* Viral Predictor */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-300">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🚀 Viral Probability Analysis
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-red-100 rounded-xl border-2 border-red-300">
                      <div className="text-xs text-red-600 font-bold mb-1">REALITY:</div>
                      <div className="text-3xl font-black text-red-600">{result.deluluFeatures.viral.reality}%</div>
                      <div className="text-xs text-red-700 mt-1">Actual chance of going viral</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl border-2 border-purple-400 relative overflow-hidden">
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-purple-300 to-pink-300 opacity-20"></div>
                      <div className="relative">
                        <div className="text-xs text-purple-700 font-bold mb-1">IN YOUR DELULU ERA:</div>
                        <div className="text-3xl font-black text-purple-700">{result.deluluFeatures.viral.delulu}%</div>
                        <div className="text-xs text-purple-800 mt-1 font-semibold">✨ GUARANTEED! ✨</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800 text-white rounded-lg text-center">
                    <p className="text-xs mb-1 opacity-75">Reality Check:</p>
                    <p className="text-sm font-semibold">
                      You'll get {result.deluluFeatures.viral.realLikes} likes. One is from yourself. 💀
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Made with 💜 for people who think before they tweet</p>
          <p className="mt-1">
            (Or at least let AI think for them)
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;