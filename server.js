const express = require('express');
const cors = require('cors');
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Store active sessions (in production, use Redis or database)
const sessions = new Map();

// Twitter OAuth 2.0 Client
const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

// Generate OAuth URL
app.get('/auth/twitter/url', async (req, res) => {
  try {
    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
      'http://localhost:3001/auth/twitter/callback',
      { 
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] 
      }
    );
    
    // Store code verifier and state
    sessions.set(state, { codeVerifier });
    
    res.json({ url, state });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// OAuth Callback
app.get('/auth/twitter/callback', async (req, res) => {
  try {
    const { state, code } = req.query;
    
    const session = sessions.get(state);
    if (!session) {
      return res.redirect('http://localhost:3000?error=session_not_found');
    }
    
    const { codeVerifier } = session;
    
    // Exchange code for tokens
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: 'http://localhost:3001/auth/twitter/callback',
    });
    
    // Get user info
    const { data: userObject } = await loggedClient.v2.me();
    
    // Store tokens (in production, encrypt these!)
    const userId = userObject.id;
    sessions.set(userId, {
      accessToken,
      refreshToken,
      expiresIn,
      username: userObject.username,
      name: userObject.name,
    });
    
    // Redirect to frontend with user info
    res.redirect(`http://localhost:3000?auth=success&userId=${userId}&username=${userObject.username}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`http://localhost:3000?error=${error.message}`);
  }
});

// Post a tweet
app.post('/api/tweet', async (req, res) => {
  try {
    const { userId, text } = req.body;
    
    const session = sessions.get(userId);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userClient = new TwitterApi(session.accessToken);
    const tweet = await userClient.v2.tweet(text);
    
    res.json({ 
      success: true, 
      tweetId: tweet.data.id,
      tweetUrl: `https://twitter.com/${session.username}/status/${tweet.data.id}`
    });
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's recent tweets
app.get('/api/tweets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const session = sessions.get(userId);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userClient = new TwitterApi(session.accessToken);
    const { data: user } = await userClient.v2.me();
    
    // Get user's tweets
    const tweets = await userClient.v2.userTimeline(user.id, {
      max_results: 25,
      'tweet.fields': ['created_at', 'public_metrics', 'text'],
    });
    
    res.json({ tweets: tweets.data.data || [] });
  } catch (error) {
    console.error('Error fetching tweets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tweet stats
app.get('/api/tweet/:tweetId/stats', async (req, res) => {
  try {
    const { tweetId } = req.params;
    const { userId } = req.query;
    
    const session = sessions.get(userId);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userClient = new TwitterApi(session.accessToken);
    const tweet = await userClient.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics', 'created_at'],
    });
    
    res.json({ 
      metrics: tweet.data.public_metrics,
      createdAt: tweet.data.created_at
    });
  } catch (error) {
    console.error('Error fetching tweet stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user info
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const session = sessions.get(userId);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({ 
      username: session.username,
      name: session.name,
      authenticated: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Twitter API server running on http://localhost:${PORT}`);
});