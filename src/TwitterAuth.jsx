import { useState, useEffect } from 'react';

export default function TwitterAuth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [rateLimitWarning, setRateLimitWarning] = useState(false);
  
  // ✅ NEW: Track if we've already called onAuthSuccess to prevent loops
  const [authCallbackCalled, setAuthCallbackCalled] = useState(false);

  useEffect(() => {
    // Check URL params for auth success
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get('auth');
    const userId = params.get('userId');
    const username = params.get('username');

    if (authSuccess === 'success' && userId) {
      const userData = { userId, username };
      setUser(userData);
      localStorage.setItem('twitterUser', JSON.stringify(userData));
      
      // ✅ Only call once
      if (!authCallbackCalled) {
        onAuthSuccess(userData);
        setAuthCallbackCalled(true);
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/');
    } else {
      // Check localStorage
      const stored = localStorage.getItem('twitterUser');
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);
        
        // ✅ Only call once
        if (!authCallbackCalled) {
          onAuthSuccess(userData);
          setAuthCallbackCalled(true);
        }
      }
    }

    // Load rate limit info from localStorage
    loadRateLimitInfo();
    
    // ✅ NEW: Listen for rate limit updates from other components
    const handleStorageChange = () => {
      loadRateLimitInfo();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check rate limit every 5 seconds
    const interval = setInterval(() => {
      loadRateLimitInfo();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []); // ✅ Remove onAuthSuccess from deps to prevent loops

  const loadRateLimitInfo = () => {
    const stored = localStorage.getItem('twitterRateLimit');
    if (stored) {
      const info = JSON.parse(stored);
      const now = Date.now();
      
      // ✅ Auto-logout if rate limit hit
      if (info.remaining === 0) {
        console.log('Rate limit hit - auto logging out');
        handleLogout();
        alert('⚠️ Twitter API rate limit reached. You have been disconnected. Please wait for the limit to reset.');
        return;
      }
      
      // Check if reset time has passed
      if (now > info.resetTime) {
        // Reset the counter
        const newInfo = {
          requestCount: 0,
          resetTime: now + (24 * 60 * 60 * 1000), // 24 hours from now
          limit: info.limit || 25,
          remaining: info.limit || 25
        };
        localStorage.setItem('twitterRateLimit', JSON.stringify(newInfo));
        setRateLimitInfo(newInfo);
        setRateLimitWarning(false);
      } else {
        setRateLimitInfo(info);
        
        // ✅ Show warning when getting close to limit (3 requests left)
        if (info.remaining <= 3 && info.remaining > 0) {
          setRateLimitWarning(true);
        } else {
          setRateLimitWarning(false);
        }
      }
    }
  };

  const handleLogin = async () => {
  setLoading(true);
  try {
    const response = await fetch('http://localhost:3001/auth/twitter/url');
    
    if (!response.ok) {
      throw new Error('Failed to get Twitter auth URL from backend');
    }
    
    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Auth error:', error);
    alert(`Failed to start Twitter login: ${error.message}`);
    setLoading(false);
  }
};

  const handleLogout = () => {
    setUser(null);
    setAuthCallbackCalled(false); // ✅ Reset for next login
    localStorage.removeItem('twitterUser');
    onAuthSuccess(null);
  };

  const formatTimeRemaining = (resetTime) => {
    const now = Date.now();
    const diff = resetTime - now;
    
    if (diff <= 0) return 'Resetting...';
    
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (user) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              Connected as @{user.username}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
          >
            Disconnect
          </button>
        </div>

        {/* Rate Limit Display */}
        {rateLimitInfo && rateLimitInfo.remaining !== undefined && (
          <div className={`p-3 rounded-xl border ${
            rateLimitInfo.remaining === 0 
              ? 'bg-red-50 border-red-200' 
              : rateLimitWarning 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  API Rate Limit
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {rateLimitInfo.remaining === 0 ? (
                    <>⚠️ Daily limit reached - resets in {formatTimeRemaining(rateLimitInfo.resetTime)}</>
                  ) : (
                    <>{rateLimitInfo.remaining} / {rateLimitInfo.limit} requests remaining</>
                  )}
                </p>
              </div>
              {rateLimitInfo.remaining > 0 && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    Resets in {formatTimeRemaining(rateLimitInfo.resetTime)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all ${
                  rateLimitInfo.remaining === 0 
                    ? 'bg-red-500' 
                    : rateLimitInfo.remaining <= 3 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                }`}
                style={{ 
                  width: `${(rateLimitInfo.remaining / rateLimitInfo.limit) * 100}%` 
                }}
              />
            </div>
            
            {/* ✅ NEW: Warning messages */}
            {rateLimitWarning && rateLimitInfo.remaining > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ Warning: Only {rateLimitInfo.remaining} requests left! Use carefully.
                </p>
              </div>
            )}
            
            {rateLimitInfo.remaining === 0 && (
              <div className="mt-2 p-2 bg-red-100 rounded-lg">
                <p className="text-xs text-red-800 font-semibold">
                  🚫 Rate limit reached! You will be automatically disconnected.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 mb-1">
            🐦 Connect Twitter
          </h3>
          <p className="text-sm text-gray-600">
            Post tweets and analyze your timeline
          </p>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect Twitter'}
        </button>
      </div>
    </div>
  );
}

// ✅ UPDATED: Export function to update rate limit from API calls
export function updateTwitterRateLimit(rateLimitData) {
  if (rateLimitData) {
    const info = {
      requestCount: rateLimitData.limit - rateLimitData.remaining,
      resetTime: rateLimitData.reset * 1000, // Convert to milliseconds
      limit: rateLimitData.limit,
      remaining: rateLimitData.remaining
    };
    localStorage.setItem('twitterRateLimit', JSON.stringify(info));
    
    // Trigger a storage event to update all components
    window.dispatchEvent(new Event('storage'));
  }
}