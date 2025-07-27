import React, { useState, useEffect } from 'react';

interface BrainStats {
  brainAge: number;
  trainingProgress: number;
  totalInteractions: number;
  successfulInteractions: number;
  successRate: number;
  averageResponseTime: number;
  accuracyScore: number;
  userSatisfaction: number;
  learningRate: number;
  topIntents: Array<{
    intent: string;
    frequency: number;
    successRate: number;
  }>;
  topCommands: Array<{
    command: string;
    category: string;
    usageCount: number;
  }>;
  primaryDomains: Array<{
    domain: string;
    confidence: number;
  }>;
  learnedSkills: Array<{
    skill: string;
    proficiency: number;
  }>;
}

interface BrainPreferences {
  responseLength: 'concise' | 'detailed' | 'conversational';
  tone: 'formal' | 'friendly' | 'casual' | 'professional';
  language: {
    primary: string;
    secondary: string;
    autoSwitch: boolean;
  };
  emojiUsage: 'minimal' | 'moderate' | 'heavy';
  formality: 'very_formal' | 'formal' | 'casual' | 'very_casual';
}

interface RobotTrainerProps {
  userId: string;
  walletAddress?: string;
}

const RobotTrainer: React.FC<RobotTrainerProps> = ({
  userId,
  walletAddress
}) => {
  const [brainStats, setBrainStats] = useState<BrainStats | null>(null);
  const [preferences, setPreferences] = useState<BrainPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [testInput, setTestInput] = useState('');
  const [testResponse, setTestResponse] = useState('');

  useEffect(() => {
    loadBrainData();
  }, [userId]);

  const loadBrainData = async () => {
    setLoading(true);
    try {
      // Load brain statistics
      const statsResponse = await fetch(`/api/brain/user/${userId}/statistics`);
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setBrainStats(statsData.data);
      }

      // Load brain preferences
      const brainResponse = await fetch(`/api/brain/user/${userId}`);
      const brainData = await brainResponse.json();
      if (brainData.success) {
        setPreferences(brainData.data.preferences);
      }
    } catch (error) {
      console.error('Failed to load brain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<BrainPreferences>) => {
    try {
      const response = await fetch(`/api/brain/user/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: newPreferences })
      });

      const data = await response.json();
      if (data.success) {
        setPreferences({ ...preferences, ...newPreferences });
        alert('Preferences updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('Failed to update preferences');
    }
  };

  const testPersonalizedResponse = async () => {
    if (!testInput.trim()) return;

    try {
      const response = await fetch('/api/brain/generate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          input: testInput,
          context: { testMode: true }
        })
      });

      const data = await response.json();
      if (data.success) {
        setTestResponse(data.data.response);
      }
    } catch (error) {
      console.error('Failed to test response:', error);
      setTestResponse('Error generating response');
    }
  };

  const exportBrain = async () => {
    try {
      const response = await fetch(`/api/brain/user/${userId}/export`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        // Create download link
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ehb-brain-${userId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Brain exported successfully!');
      }
    } catch (error) {
      console.error('Failed to export brain:', error);
      alert('Failed to export brain');
    }
  };

  const resetBrain = async () => {
    if (!confirm('Are you sure you want to reset your brain? This will delete all learned patterns.')) {
      return;
    }

    try {
      const response = await fetch(`/api/brain/user/${userId}/reset`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('Brain reset successfully!');
        loadBrainData();
      }
    } catch (error) {
      console.error('Failed to reset brain:', error);
      alert('Failed to reset brain');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading your robot's brain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🧠 Robot Trainer</h1>
          <p className="text-gray-300">Train and customize your personal AI brain</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/10 backdrop-blur-lg rounded-lg p-1">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'preferences', name: 'Preferences', icon: '⚙️' },
            { id: 'patterns', name: 'Learned Patterns', icon: '🧠' },
            { id: 'test', name: 'Test Brain', icon: '🧪' },
            { id: 'export', name: 'Export/Import', icon: '📦' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          {activeTab === 'overview' && brainStats && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Brain Overview</h2>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{brainStats.brainAge}</div>
                  <div className="text-sm text-gray-300">Days Old</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{brainStats.trainingProgress.toFixed(1)}%</div>
                  <div className="text-sm text-gray-300">Training Progress</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{brainStats.successRate}%</div>
                  <div className="text-sm text-gray-300">Success Rate</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{brainStats.totalInteractions}</div>
                  <div className="text-sm text-gray-300">Total Interactions</div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Accuracy Score</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${brainStats.accuracyScore}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{brainStats.accuracyScore.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-1">User Satisfaction</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${brainStats.userSatisfaction}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{brainStats.userSatisfaction.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Learning Rate</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min(brainStats.learningRate * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{(brainStats.learningRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Top Intents */}
              {brainStats.topIntents.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Most Common Intents</h3>
                  <div className="space-y-2">
                    {brainStats.topIntents.map((intent, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-300">{intent.intent}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-400">{intent.frequency} times</span>
                          <span className="text-sm text-green-400">{intent.successRate.toFixed(1)}% success</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && preferences && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Brain Preferences</h2>

              {/* Response Length */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Response Length</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['concise', 'conversational', 'detailed'] as const).map(length => (
                    <button
                      key={length}
                      onClick={() => updatePreferences({ responseLength: length })}
                      className={`py-2 px-4 rounded-lg transition-colors ${
                        preferences.responseLength === length
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Communication Tone</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['formal', 'friendly', 'casual', 'professional'] as const).map(tone => (
                    <button
                      key={tone}
                      onClick={() => updatePreferences({ tone })}
                      className={`py-2 px-4 rounded-lg transition-colors ${
                        preferences.tone === tone
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Settings */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Language Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Language</label>
                    <select
                      value={preferences.language.primary}
                      onChange={(e) => updatePreferences({
                        language: { ...preferences.language, primary: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="english">English</option>
                      <option value="urdu">Urdu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Language</label>
                    <select
                      value={preferences.language.secondary}
                      onChange={(e) => updatePreferences({
                        language: { ...preferences.language, secondary: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="english">English</option>
                      <option value="urdu">Urdu</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.language.autoSwitch}
                      onChange={(e) => updatePreferences({
                        language: { ...preferences.language, autoSwitch: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Auto-switch language based on input</span>
                  </label>
                </div>
              </div>

              {/* Emoji Usage */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Emoji Usage</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['minimal', 'moderate', 'heavy'] as const).map(usage => (
                    <button
                      key={usage}
                      onClick={() => updatePreferences({ emojiUsage: usage })}
                      className={`py-2 px-4 rounded-lg transition-colors ${
                        preferences.emojiUsage === usage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {usage.charAt(0).toUpperCase() + usage.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'patterns' && brainStats && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Learned Patterns</h2>

              {/* Top Commands */}
              {brainStats.topCommands.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Most Used Commands</h3>
                  <div className="space-y-2">
                    {brainStats.topCommands.map((command, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{command.command}</div>
                          <div className="text-sm text-gray-400">{command.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">{command.usageCount}</div>
                          <div className="text-xs text-gray-400">times used</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Domains */}
              {brainStats.primaryDomains.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Expertise Areas</h3>
                  <div className="space-y-2">
                    {brainStats.primaryDomains.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-300">{domain.domain}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${domain.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-green-400">{(domain.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learned Skills */}
              {brainStats.learnedSkills.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Learned Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {brainStats.learnedSkills.map((skill, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{skill.skill}</span>
                          <span className="text-sm text-purple-400">{(skill.proficiency * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${skill.proficiency * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Test Your Brain</h2>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Test Personalized Response</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Input Message</label>
                    <input
                      type="text"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Type a message to test your personalized brain..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={testPersonalizedResponse}
                    disabled={!testInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Test Response
                  </button>
                  {testResponse && (
                    <div className="mt-4 p-4 bg-white/5 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Personalized Response:</h4>
                      <p className="text-white">{testResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Export & Import</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Export Your Brain</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Download your personalized brain data as a JSON file. You can import this on other devices or share with others.
                  </p>
                  <button
                    onClick={exportBrain}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    📦 Export Brain (.json)
                  </button>
                </div>

                {/* Import */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Import Brain</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Import a brain file to load someone else's trained brain or restore from backup.
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <button className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    📥 Import Brain
                  </button>
                </div>
              </div>

              {/* Reset */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-3">⚠️ Reset Brain</h3>
                <p className="text-gray-300 text-sm mb-4">
                  This will delete all learned patterns and reset your brain to factory settings. This action cannot be undone.
                </p>
                <button
                  onClick={resetBrain}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  🗑️ Reset Brain
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobotTrainer;
