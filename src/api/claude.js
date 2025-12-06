import { useState } from 'react';
import '../api/../App.css';

function App() {
  const [postText, setPostText] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const platforms = [
    { id: 'twitter', name: 'Twitter/X', icon: '𝕏' },
    { id: 'instagram', name: 'Instagram', icon: '📸' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'reddit', name: 'Reddit', icon: '🤖' }
  ];

  const getVibeColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getVibeLabel = (score) => {
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

  const checkVibe = async () => {
    if (!postText.trim()) return;
    
    setLoading(true);
    
    // TODO: Replace this with actual Claude API call
    // For now, using mock data for demo
    setTimeout(() => {
      // Mock response - replace with actual API call
      const mockScore = Math.floor(Math.random() * 100);
      const mockResult = {
        score: mockScore,
        flags: [
          { type: 'warning', text: 'This could be interpreted as passive-aggressive' },
          { type: 'info', text: 'Consider your audience - this may come across differently to different groups' }
        ],
        rewrite: "Here's a more positive way to express the same idea! (Connect Claude API for real suggestions)",
        explanation: 'Your post shows signs of frustration. While your feelings are valid, the tone might create conflict rather than resolution.'
      };
      
      setResult(mockResult);
      setLoading(false);
    }, 1500);

    /* 
    // UNCOMMENT THIS WHEN YOU ADD CLAUDE API:
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Analyze this ${platform} post for potential issues:

Post: "${postText}"

Provide a JSON response with:
1. score (0-100, where 100 is perfect)
2. explanation (why this score)
3. flags (array of {type: "warning" or "info", text: "description"})
4. rewrite (one improved version)

Focus on: passive-aggression, humble-bragging, oversharing, anger-posting, sarcasm that doesn't land, condescension, TMI.

Keep tone helpful and non-judgmental.

Return ONLY valid JSON, no other text.`
          }]
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.content[0].text);
      setResult(result);
    } catch (error) {
      console.error('Error:', error);
      alert('Oops! Something went wrong. Check your API key.');
    } finally {
      setLoading(false);
    }
    */
  };

  const copyRewrite = () => {
    if (result?.rewrite) {
      navigator.clipboard.writeText(result.rewrite);
      alert('Copied to clipboard! 📋');
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Vibe Check ✨
          </h1>
          <p className="text-gray-600 text-lg">
            AI-powered reality check before you hit post
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          
          {/* Platform Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Where are you posting?
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    platform === p.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                What do you want to post?
              </label>
              <button
                onClick={loadExample}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Load Example 🎲
              </button>
            </div>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Type your post here... be honest, we won't judge (much) 👀"
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none text-lg"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {postText.length} characters
              </span>
              <span className="text-xs text-gray-400">
                Pro tip: If you're typing this at 2am, maybe sleep on it 😴
              </span>
            </div>
          </div>

          {/* Check Button */}
          <button
            onClick={checkVibe}
            disabled={!postText.trim() || loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing your vibe...
              </span>
            ) : (
              '✨ Check My Vibe ✨'
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fadeIn">
            
            {/* Score Display */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <div className={`text-7xl font-bold ${getVibeColor(result.score)}`}>
                  {result.score}
                </div>
                <div className="text-2xl font-semibold text-gray-700 mt-2">
                  {getVibeLabel(result.score)}
                </div>
              </div>
              
              {/* Score Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getVibeBg(result.score)} transition-all duration-1000 ease-out rounded-full`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-6 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
              <p className="text-gray-700 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Flags */}
            {result.flags && result.flags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 text-lg">
                  🚩 Things to Consider:
                </h3>
                <div className="space-y-2">
                  {result.flags.map((flag, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        flag.type === 'warning'
                          ? 'bg-red-50 border-l-4 border-red-400'
                          : 'bg-blue-50 border-l-4 border-blue-400'
                      }`}
                    >
                      <p className="text-gray-700">{flag.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewrite Suggestion */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                💡 Suggested Rewrite:
              </h3>
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <p className="text-gray-700 italic leading-relaxed">
                  "{result.rewrite}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={copyRewrite}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
              >
                📋 Copy Rewrite
              </button>
              <button 
                onClick={() => setResult(null)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                ↺ Check Another
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg">
                😈 Post Anyway
              </button>
            </div>
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