// backend/middleware/twitterRateLimiter.js
// Add this middleware to your Express backend

class TwitterRateLimiter {
    constructor() {
      // Store rate limit info per user
      this.userLimits = new Map();
      this.DAILY_LIMIT = 25; // Twitter Free tier limit
    }
  
    getUserKey(userId) {
      return `user_${userId}`;
    }
  
    getRateLimitInfo(userId) {
      const key = this.getUserKey(userId);
      const now = Date.now();
      
      let info = this.userLimits.get(key);
      
      // Initialize or reset if expired
      if (!info || now > info.resetTime) {
        info = {
          requestCount: 0,
          resetTime: now + (24 * 60 * 60 * 1000), // 24 hours
          limit: this.DAILY_LIMIT
        };
        this.userLimits.set(key, info);
      }
      
      return info;
    }
  
    canMakeRequest(userId) {
      const info = this.getRateLimitInfo(userId);
      return info.requestCount < info.limit;
    }
  
    incrementCount(userId) {
      const info = this.getRateLimitInfo(userId);
      info.requestCount++;
      return info;
    }
  
    getRemainingRequests(userId) {
      const info = this.getRateLimitInfo(userId);
      return info.limit - info.requestCount;
    }
  
    // Middleware function
    checkLimit(req, res, next) {
      const userId = req.user?.userId || req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      if (!this.canMakeRequest(userId)) {
        const info = this.getRateLimitInfo(userId);
        return res.status(429).json({
          error: 'Daily rate limit exceeded',
          rateLimit: {
            limit: info.limit,
            remaining: 0,
            reset: Math.floor(info.resetTime / 1000),
            resetTime: info.resetTime
          }
        });
      }
  
      // Attach rate limit info to request
      req.rateLimitInfo = this.incrementCount(userId);
      next();
    }
  
    // Add rate limit headers to response
    addHeaders(res, info) {
      res.set({
        'X-RateLimit-Limit': info.limit.toString(),
        'X-RateLimit-Remaining': (info.limit - info.requestCount).toString(),
        'X-RateLimit-Reset': Math.floor(info.resetTime / 1000).toString()
      });
    }
  }
  
  // Export singleton instance
  const rateLimiter = new TwitterRateLimiter();
  
  module.exports = {
    rateLimiter,
    checkTwitterRateLimit: rateLimiter.checkLimit.bind(rateLimiter)
  };