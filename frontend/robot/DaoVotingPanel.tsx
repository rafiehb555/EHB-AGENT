import React, { useState, useEffect } from 'react';

interface Proposal {
  proposalId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  votingPeriod: {
    startDate: string;
    endDate: string;
    duration: number;
  };
  impact: {
    cost: number;
    risk: string;
    affectedUsers: number;
    implementationTime: number;
  };
  aiAnalysis: {
    summary: string;
    recommendation: 'yes' | 'no' | 'abstain';
    reasoning: string;
    confidence: number;
  };
  voteStats: {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    totalPower: number;
    yesPower: number;
    noPower: number;
    abstainPower: number;
  };
  quorum: number;
  threshold: number;
}

interface VotingEligibility {
  walletAddress: string;
  votingPower: number;
  eligible: boolean;
  autoVoteEnabled: boolean;
  autoVoteMode: string;
  customRules: number;
  trustedProposers: number;
  reputation: {
    score: number;
    level: string;
    badges: number;
  } | null;
}

interface DaoVotingPanelProps {
  userId: string;
  walletAddress: string;
}

const DaoVotingPanel: React.FC<DaoVotingPanelProps> = ({
  userId,
  walletAddress
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [eligibility, setEligibility] = useState<VotingEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteChoice, setVoteChoice] = useState<'yes' | 'no' | 'abstain'>('abstain');
  const [voteReasoning, setVoteReasoning] = useState('');
  const [showVoteModal, setShowVoteModal] = useState(false);

  useEffect(() => {
    loadActiveProposals();
    checkEligibility();
  }, [userId, walletAddress]);

  const loadActiveProposals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dao/vote/active');
      const data = await response.json();

      if (data.success) {
        setProposals(data.data.proposals);
      }
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const response = await fetch('/api/dao/vote/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();
      if (data.success) {
        setEligibility(data.data);
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
    }
  };

  const castVote = async () => {
    if (!selectedProposal) return;

    try {
      const response = await fetch('/api/dao/vote/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: selectedProposal.proposalId,
          userId,
          walletAddress,
          choice: voteChoice,
          reasoning: voteReasoning
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Vote cast successfully!');
        setShowVoteModal(false);
        loadActiveProposals(); // Refresh proposals
      } else {
        alert('Failed to cast vote: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to cast vote:', error);
      alert('Failed to cast vote');
    }
  };

  const autoVote = async (proposalId: string) => {
    try {
      const response = await fetch('/api/dao/vote/auto-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId,
          userId,
          walletAddress
        })
      });

      const data = await response.json();
      if (data.success) {
        if (data.data.autoVoted) {
          alert(`Auto-voted ${data.data.choice} on proposal. Reason: ${data.data.reason}`);
        } else {
          alert('No auto-vote conditions met for this proposal');
        }
        loadActiveProposals(); // Refresh proposals
      } else {
        alert('Auto-vote failed: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to auto-vote:', error);
      alert('Failed to auto-vote');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      upgrade: '⚡',
      governance: '🏛️',
      reward: '💰',
      security: '🔒',
      feature: '🆕',
      emergency: '🚨'
    };
    return icons[category] || '📋';
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400'
    };
    return colors[risk] || 'text-gray-400';
  };

  const getRecommendationColor = (recommendation: string) => {
    const colors: Record<string, string> = {
      yes: 'text-green-400',
      no: 'text-red-400',
      abstain: 'text-yellow-400'
    };
    return colors[recommendation] || 'text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTimeLeft = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading DAO proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🗳️ DAO Voting Panel</h1>
          <p className="text-gray-300">Participate in EHB governance decisions</p>
        </div>

        {/* Eligibility Status */}
        {eligibility && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Your Voting Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-300">Voting Power:</span>
                    <div className="text-lg font-bold text-blue-400">{eligibility.votingPower} EHBGC</div>
                  </div>
                  <div>
                    <span className="text-gray-300">Status:</span>
                    <div className={`text-lg font-bold ${eligibility.eligible ? 'text-green-400' : 'text-red-400'}`}>
                      {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-300">Auto-Vote:</span>
                    <div className={`text-lg font-bold ${eligibility.autoVoteEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                      {eligibility.autoVoteEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  {eligibility.reputation && (
                    <div>
                      <span className="text-gray-300">Reputation:</span>
                      <div className="text-lg font-bold text-purple-400">
                        {eligibility.reputation.level.charAt(0).toUpperCase() + eligibility.reputation.level.slice(1)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {eligibility.reputation && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-400">{eligibility.reputation.score}</div>
                  <div className="text-sm text-gray-300">Reputation Score</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Proposals */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Active Proposals</h2>

          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗳️</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Active Proposals</h3>
              <p className="text-gray-300">There are currently no proposals open for voting</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proposals.map(proposal => (
                <div key={proposal.proposalId} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                  {/* Proposal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getCategoryIcon(proposal.category)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                        <p className="text-sm text-gray-400">#{proposal.proposalId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm px-2 py-1 rounded ${getRiskColor(proposal.impact.risk)}`}>
                        {proposal.impact.risk.toUpperCase()} RISK
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{proposal.description}</p>

                  {/* AI Analysis */}
                  {proposal.aiAnalysis && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">🤖 AI Recommendation</span>
                        <span className={`text-sm font-bold ${getRecommendationColor(proposal.aiAnalysis.recommendation)}`}>
                          {proposal.aiAnalysis.recommendation.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{proposal.aiAnalysis.summary}</p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${proposal.aiAnalysis.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">{proposal.aiAnalysis.confidence}% confidence</span>
                      </div>
                    </div>
                  )}

                  {/* Impact */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                    <div className="text-center">
                      <div className="text-gray-300">Cost</div>
                      <div className="text-yellow-400 font-bold">{proposal.impact.cost} EHBGC</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-300">Affected</div>
                      <div className="text-blue-400 font-bold">{proposal.impact.affectedUsers} users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-300">Duration</div>
                      <div className="text-green-400 font-bold">{proposal.impact.implementationTime} days</div>
                    </div>
                  </div>

                  {/* Voting Stats */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Votes: {proposal.voteStats.totalVotes}</span>
                      <span>Power: {proposal.voteStats.totalPower} EHBGC</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(proposal.voteStats.yesPower / proposal.voteStats.totalPower) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-green-400">YES: {proposal.voteStats.yesPower}</span>
                      <span className="text-red-400">NO: {proposal.voteStats.noPower}</span>
                      <span className="text-yellow-400">ABSTAIN: {proposal.voteStats.abstainPower}</span>
                    </div>
                  </div>

                  {/* Voting Period */}
                  <div className="mb-4 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Voting Period</span>
                      <span className="text-orange-400 font-bold">
                        {calculateTimeLeft(proposal.votingPeriod.endDate)}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      {formatDate(proposal.votingPeriod.startDate)} - {formatDate(proposal.votingPeriod.endDate)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setShowVoteModal(true);
                      }}
                      disabled={!eligibility?.eligible}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                    >
                      Vote
                    </button>
                    <button
                      onClick={() => autoVote(proposal.proposalId)}
                      disabled={!eligibility?.autoVoteEnabled}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vote Modal */}
        {showVoteModal && selectedProposal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">Cast Your Vote</h3>

              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">{selectedProposal.title}</h4>
                <p className="text-gray-300 text-sm">{selectedProposal.description}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Vote</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['yes', 'no', 'abstain'] as const).map(choice => (
                    <button
                      key={choice}
                      onClick={() => setVoteChoice(choice)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        voteChoice === choice
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {choice.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Reasoning (Optional)</label>
                <textarea
                  value={voteReasoning}
                  onChange={(e) => setVoteReasoning(e.target.value)}
                  placeholder="Why are you voting this way?"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={castVote}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  Cast Vote
                </button>
                <button
                  onClick={() => setShowVoteModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaoVotingPanel;
