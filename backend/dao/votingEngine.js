const DaoGovernance = require('../models/DaoGovernance');
const VotingPreferences = require('../models/VotingPreferences');
const brainTrainer = require('../ai-core/brainTrainer');

class DaoVotingEngine {
  constructor() {
    this.isRunning = false;
    this.lastCheck = null;
  }

  // Start the voting engine
  start() {
    console.log('🗳️ Starting DAO Voting Engine...');
    this.isRunning = true;
    this.checkForNewProposals();
  }

  // Stop the voting engine
  stop() {
    console.log('🛑 Stopping DAO Voting Engine...');
    this.isRunning = false;
  }

  // Check for new proposals and process auto-votes
  async checkForNewProposals() {
    try {
      const activeProposals = await DaoGovernance.getActiveProposals();

      if (activeProposals.length === 0) {
        return;
      }

      console.log(`🗳️ Found ${activeProposals.length} active proposals`);

      for (const proposal of activeProposals) {
        await this.processProposal(proposal);
      }

    } catch (error) {
      console.error('DAO voting engine error:', error);
    }
  }

  // Process a single proposal
  async processProposal(proposal) {
    try {
      console.log(`📋 Processing proposal: ${proposal.title} (ID: ${proposal.proposalId})`);

      // Analyze proposal with AI
      const analysis = await this.analyzeProposal(proposal);

      // Update proposal with AI analysis
      proposal.aiAnalysis = analysis;
      await proposal.save();

      // Check for auto-voting opportunities
      await this.checkAutoVoting(proposal);

      // Check for conflicts
      await this.checkForConflicts(proposal);

    } catch (error) {
      console.error(`Error processing proposal ${proposal.proposalId}:`, error);
    }
  }

  // Analyze proposal with AI
  async analyzeProposal(proposal) {
    try {
      const analysisPrompt = `
        Analyze this DAO proposal and provide a recommendation:

        Title: ${proposal.title}
        Description: ${proposal.description}
        Category: ${proposal.category}
        Cost: ${proposal.impact.cost} EHBGC
        Risk: ${proposal.impact.risk}
        Affected Users: ${proposal.impact.affectedUsers}

        Please provide:
        1. A brief summary of the proposal
        2. Your recommendation (yes/no/abstain)
        3. Reasoning for your recommendation
        4. Confidence level (0-100)
      `;

      const aiResponse = await brainTrainer.callAIModel(analysisPrompt, {
        temperature: 0.3,
        maxTokens: 300
      });

      // Parse AI response to extract recommendation
      const recommendation = this.parseAIRecommendation(aiResponse);
      const confidence = this.extractConfidence(aiResponse);

      return {
        summary: this.extractSummary(aiResponse),
        recommendation: recommendation,
        reasoning: this.extractReasoning(aiResponse),
        confidence: confidence,
        analyzedAt: new Date()
      };

    } catch (error) {
      console.error('Proposal analysis error:', error);
      return {
        summary: 'Unable to analyze proposal',
        recommendation: 'abstain',
        reasoning: 'Analysis failed',
        confidence: 0,
        analyzedAt: new Date()
      };
    }
  }

  // Parse AI recommendation from response
  parseAIRecommendation(response) {
    const lowerResponse = response.toLowerCase();

    if (lowerResponse.includes('yes') || lowerResponse.includes('approve') || lowerResponse.includes('support')) {
      return 'yes';
    } else if (lowerResponse.includes('no') || lowerResponse.includes('reject') || lowerResponse.includes('oppose')) {
      return 'no';
    } else {
      return 'abstain';
    }
  }

  // Extract confidence from AI response
  extractConfidence(response) {
    const confidenceMatch = response.match(/(\d+)%?\s*confidence/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    return 50; // Default confidence
  }

  // Extract summary from AI response
  extractSummary(response) {
    // Simple extraction - in production, use more sophisticated parsing
    const lines = response.split('\n');
    return lines[0] || 'Summary not available';
  }

  // Extract reasoning from AI response
  extractReasoning(response) {
    const lines = response.split('\n');
    if (lines.length > 2) {
      return lines.slice(2).join(' ').substring(0, 200);
    }
    return 'Reasoning not available';
  }

  // Check for auto-voting opportunities
  async checkAutoVoting(proposal) {
    try {
      // Get all users with voting preferences
      const votingPrefs = await VotingPreferences.find({
        'autoVote.enabled': true
      });

      for (const prefs of votingPrefs) {
        const shouldAutoVote = await this.shouldAutoVote(prefs, proposal);

        if (shouldAutoVote.should) {
          await this.executeAutoVote(prefs, proposal, shouldAutoVote.choice);
        }
      }

    } catch (error) {
      console.error('Auto-voting check error:', error);
    }
  }

  // Determine if user should auto-vote
  async shouldAutoVote(prefs, proposal) {
    const result = {
      should: false,
      choice: 'abstain',
      reasoning: ''
    };

    // Check auto-vote mode
    if (prefs.autoVote.mode === 'notify_only') {
      return result;
    }

    // Check custom rules
    for (const rule of prefs.customRules) {
      if (!rule.isActive) continue;

      const matchesRule = await this.matchesCustomRule(rule, proposal);
      if (matchesRule) {
        result.should = true;
        result.choice = rule.action;
        result.reasoning = `Matched rule: ${rule.name}`;
        return result;
      }
    }

    // Check trusted proposers
    const trustedProposer = prefs.trustedProposers.find(
      p => p.walletAddress === proposal.proposer.walletAddress
    );
    if (trustedProposer && trustedProposer.autoVote) {
      result.should = true;
      result.choice = 'yes';
      result.reasoning = `Trusted proposer: ${trustedProposer.name}`;
      return result;
    }

    // Check category preferences
    const categoryPref = prefs.categoryPreferences.find(
      p => p.category === proposal.category
    );
    if (categoryPref && categoryPref.autoVote) {
      result.should = true;
      result.choice = categoryPref.defaultChoice;
      result.reasoning = `Category preference: ${proposal.category}`;
      return result;
    }

    // Default auto-vote
    if (prefs.autoVote.mode === 'auto_vote') {
      result.should = true;
      result.choice = prefs.autoVote.defaultChoice;
      result.reasoning = 'Default auto-vote setting';
    }

    return result;
  }

  // Check if proposal matches custom rule
  async matchesCustomRule(rule, proposal) {
    switch (rule.condition) {
      case 'always':
        return true;

      case 'if_cost_below':
        return proposal.impact.cost <= rule.threshold;

      case 'if_risk_low':
        return proposal.impact.risk === 'low';

      case 'if_trusted_proposer':
        return proposal.proposer.walletAddress === rule.proposer;

      default:
        return false;
    }
  }

  // Execute auto-vote
  async executeAutoVote(prefs, proposal, choice) {
    try {
      // Get user's voting power (would integrate with blockchain)
      const votingPower = await this.getVotingPower(prefs.walletAddress);

      if (votingPower <= 0) {
        console.log(`⚠️ User ${prefs.userId} has no voting power`);
        return;
      }

      // Add vote to proposal
      await proposal.addVote({
        voter: {
          walletAddress: prefs.walletAddress,
          userId: prefs.userId
        },
        choice: choice,
        power: votingPower,
        robotVote: true,
        reasoning: `Auto-vote based on preferences`
      });

      // Update user's voting stats
      await prefs.addVote(choice, true, false);

      // Update reputation
      await prefs.updateReputation('auto_vote', 5);

      console.log(`✅ Auto-voted ${choice} for user ${prefs.userId} on proposal ${proposal.proposalId}`);

      // Send notification
      await this.sendVoteNotification(prefs, proposal, choice, true);

    } catch (error) {
      console.error('Auto-vote execution error:', error);
    }
  }

  // Get user's voting power (placeholder - integrate with blockchain)
  async getVotingPower(walletAddress) {
    // In production, this would query the blockchain
    // For now, return a mock value
    return Math.floor(Math.random() * 1000) + 100;
  }

  // Check for conflicts
  async checkForConflicts(proposal) {
    try {
      // Check for duplicate proposals
      const similarProposals = await DaoGovernance.find({
        title: { $regex: proposal.title, $options: 'i' },
        _id: { $ne: proposal._id },
        status: { $in: ['active', 'voting', 'passed'] }
      });

      if (similarProposals.length > 0) {
        console.log(`⚠️ Potential duplicate proposal detected: ${proposal.title}`);
        await this.sendConflictAlert(proposal, similarProposals);
      }

      // Check for conflicting proposals
      const conflictingProposals = await this.findConflictingProposals(proposal);
      if (conflictingProposals.length > 0) {
        console.log(`⚠️ Conflicting proposals detected for: ${proposal.title}`);
        await this.sendConflictAlert(proposal, conflictingProposals);
      }

    } catch (error) {
      console.error('Conflict detection error:', error);
    }
  }

  // Find conflicting proposals
  async findConflictingProposals(proposal) {
    // This would implement logic to detect conflicting proposals
    // For now, return empty array
    return [];
  }

  // Send conflict alert
  async sendConflictAlert(proposal, conflicts) {
    try {
      // Send to DAO admin panel
      console.log(`🚨 Conflict Alert: Proposal ${proposal.proposalId} may conflict with existing proposals`);

      // Send to all users with conflict alerts enabled
      const usersWithAlerts = await VotingPreferences.find({
        'notifications.conflictAlerts': true
      });

      for (const user of usersWithAlerts) {
        // In production, send actual notifications
        console.log(`📢 Conflict alert sent to user: ${user.userId}`);
      }

    } catch (error) {
      console.error('Conflict alert error:', error);
    }
  }

  // Send vote notification
  async sendVoteNotification(prefs, proposal, choice, isAutoVote) {
    try {
      const notification = {
        type: 'vote_cast',
        userId: prefs.userId,
        proposalId: proposal.proposalId,
        proposalTitle: proposal.title,
        choice: choice,
        isAutoVote: isAutoVote,
        timestamp: new Date()
      };

      console.log(`📢 Vote notification: ${prefs.userId} voted ${choice} on ${proposal.title}`);

      // In production, send actual notifications (email, push, etc.)

    } catch (error) {
      console.error('Vote notification error:', error);
    }
  }

  // Create proposal with AI assistance
  async createProposal(userId, proposalData) {
    try {
      const { title, description, category, impact } = proposalData;

      // Generate proposal ID
      const proposalId = `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      // Create proposal
      const proposal = new DaoGovernance({
        proposalId,
        title,
        description,
        category,
        impact,
        proposer: {
          walletAddress: proposalData.walletAddress,
          userId: userId,
          tokenBalance: await this.getVotingPower(proposalData.walletAddress)
        },
        status: 'draft',
        votingPeriod: {
          startDate: new Date(),
          endDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
          duration: 7
        }
      });

      await proposal.save();

      // Update user's proposal count
      const prefs = await VotingPreferences.getByUser(userId);
      if (prefs) {
        prefs.reputation.contributions.proposalsCreated += 1;
        await prefs.save();
      }

      console.log(`✅ Proposal created: ${proposalId}`);

      return proposal;

    } catch (error) {
      console.error('Create proposal error:', error);
      throw error;
    }
  }

  // Get proposal statistics
  async getProposalStats() {
    try {
      const stats = await DaoGovernance.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalPower: { $sum: '$voteStats.totalPower' }
          }
        }
      ]);

      return stats;

    } catch (error) {
      console.error('Get proposal stats error:', error);
      return [];
    }
  }

  // Get user's voting history
  async getUserVotingHistory(walletAddress) {
    try {
      const votes = await DaoGovernance.getUserVotes(walletAddress);

      return votes.map(proposal => ({
        proposalId: proposal.proposalId,
        title: proposal.title,
        userVote: proposal.votes.find(v => v.voter.walletAddress === walletAddress),
        outcome: proposal.status,
        votedAt: proposal.votes.find(v => v.voter.walletAddress === walletAddress)?.timestamp
      }));

    } catch (error) {
      console.error('Get voting history error:', error);
      return [];
    }
  }
}

module.exports = new DaoVotingEngine();
