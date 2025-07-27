const express = require('express');
const router = express.Router();
const DaoGovernance = require('../../models/DaoGovernance');
const VotingPreferences = require('../../models/VotingPreferences');
const votingEngine = require('../../dao/votingEngine');

// POST: Cast a vote on a proposal
router.post('/cast', async (req, res) => {
  try {
    const { proposalId, userId, walletAddress, choice, reasoning } = req.body;

    if (!proposalId || !userId || !walletAddress || !choice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: proposalId, userId, walletAddress, choice'
      });
    }

    // Get proposal
    const proposal = await DaoGovernance.findOne({ proposalId });
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if proposal is active
    if (!proposal.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Proposal is not active for voting'
      });
    }

    // Check if user already voted
    const existingVote = proposal.votes.find(v => v.voter.walletAddress === walletAddress);
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'User has already voted on this proposal'
      });
    }

    // Get user's voting power
    const votingPower = await votingEngine.getVotingPower(walletAddress);
    if (votingPower <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient voting power'
      });
    }

    // Add vote
    await proposal.addVote({
      voter: {
        walletAddress,
        userId
      },
      choice,
      power: votingPower,
      robotVote: false,
      reasoning: reasoning || 'Manual vote'
    });

    // Update user's voting preferences
    const prefs = await VotingPreferences.getByUser(userId);
    if (prefs) {
      await prefs.addVote(choice, false, false);
      await prefs.updateReputation('manual_vote', 10);
    }

    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        proposalId,
        choice,
        power: votingPower,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Auto-vote on a proposal
router.post('/auto-vote', async (req, res) => {
  try {
    const { proposalId, userId, walletAddress } = req.body;

    // Get user's voting preferences
    const prefs = await VotingPreferences.getByUser(userId);
    if (!prefs || !prefs.autoVote.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Auto-voting not enabled for this user'
      });
    }

    // Get proposal
    const proposal = await DaoGovernance.findOne({ proposalId });
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if should auto-vote
    const shouldAutoVote = await votingEngine.shouldAutoVote(prefs, proposal);

    if (!shouldAutoVote.should) {
      return res.json({
        success: true,
        message: 'No auto-vote conditions met',
        data: {
          autoVoted: false,
          reason: 'No matching rules'
        }
      });
    }

    // Execute auto-vote
    await votingEngine.executeAutoVote(prefs, proposal, shouldAutoVote.choice);

    res.json({
      success: true,
      message: 'Auto-vote executed successfully',
      data: {
        autoVoted: true,
        choice: shouldAutoVote.choice,
        reason: shouldAutoVote.reasoning
      }
    });

  } catch (error) {
    console.error('Auto-vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get user's voting history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    const votingHistory = await votingEngine.getUserVotingHistory(walletAddress);

    res.json({
      success: true,
      data: {
        history: votingHistory,
        total: votingHistory.length
      }
    });

  } catch (error) {
    console.error('Get voting history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get proposal voting results
router.get('/results/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await DaoGovernance.findOne({ proposalId });
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const results = {
      proposalId: proposal.proposalId,
      title: proposal.title,
      status: proposal.status,
      voteStats: proposal.voteStats,
      yesPercentage: proposal.yesPercentage,
      quorumMet: proposal.quorumMet,
      passed: proposal.checkPassed(),
      totalVotes: proposal.votes.length,
      robotVotes: proposal.votes.filter(v => v.robotVote).length,
      delegatedVotes: proposal.votes.filter(v => v.delegatedFrom).length
    };

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get active proposals for voting
router.get('/active', async (req, res) => {
  try {
    const activeProposals = await DaoGovernance.getActiveProposals();

    const proposals = activeProposals.map(proposal => ({
      proposalId: proposal.proposalId,
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      status: proposal.status,
      votingPeriod: proposal.votingPeriod,
      impact: proposal.impact,
      aiAnalysis: proposal.aiAnalysis,
      voteStats: proposal.voteStats,
      quorum: proposal.quorum,
      threshold: proposal.threshold
    }));

    res.json({
      success: true,
      data: {
        proposals,
        total: proposals.length
      }
    });

  } catch (error) {
    console.error('Get active proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Check voting eligibility
router.post('/check-eligibility', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    // Get user's voting power
    const votingPower = await votingEngine.getVotingPower(walletAddress);

    // Get user's voting preferences
    const prefs = await VotingPreferences.getByWallet(walletAddress);

    const eligibility = {
      walletAddress,
      votingPower,
      eligible: votingPower > 0,
      autoVoteEnabled: prefs ? prefs.autoVote.enabled : false,
      autoVoteMode: prefs ? prefs.autoVote.mode : 'notify_only',
      customRules: prefs ? prefs.customRules.length : 0,
      trustedProposers: prefs ? prefs.trustedProposers.length : 0,
      reputation: prefs ? {
        score: prefs.reputation.score,
        level: prefs.reputationLevel,
        badges: prefs.reputation.badges.length
      } : null
    };

    res.json({
      success: true,
      data: eligibility
    });

  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get voting statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await votingEngine.getProposalStats();

    // Get total active voters
    const activeVoters = await DaoGovernance.aggregate([
      { $match: { status: 'voting' } },
      { $unwind: '$votes' },
      { $group: { _id: '$votes.voter.walletAddress' } },
      { $count: 'total' }
    ]);

    const totalActiveVoters = activeVoters.length > 0 ? activeVoters[0].total : 0;

    res.json({
      success: true,
      data: {
        proposalStats: stats,
        totalActiveVoters,
        totalProposals: stats.reduce((sum, stat) => sum + stat.count, 0)
      }
    });

  } catch (error) {
    console.error('Get voting statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
