const mongoose = require("mongoose");

const votingPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  walletAddress: {
    type: String,
    required: true
  },

  // Auto-voting settings
  autoVote: {
    enabled: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      enum: ['notify_only', 'auto_vote', 'custom_rules'],
      default: 'notify_only'
    },
    defaultChoice: {
      type: String,
      enum: ['yes', 'no', 'abstain'],
      default: 'abstain'
    }
  },

  // Custom voting rules
  customRules: [{
    name: String,
    category: String,
    proposer: String,
    condition: {
      type: String,
      enum: ['always', 'if_cost_below', 'if_risk_low', 'if_trusted_proposer'],
      default: 'always'
    },
    threshold: Number, // for cost/risk thresholds
    action: {
      type: String,
      enum: ['yes', 'no', 'abstain', 'notify'],
      default: 'notify'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Trusted proposers
  trustedProposers: [{
    walletAddress: String,
    name: String,
    trustLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    autoVote: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Category preferences
  categoryPreferences: [{
    category: {
      type: String,
      enum: ['upgrade', 'governance', 'reward', 'security', 'feature', 'emergency'],
      required: true
    },
    defaultChoice: {
      type: String,
      enum: ['yes', 'no', 'abstain'],
      default: 'abstain'
    },
    autoVote: {
      type: Boolean,
      default: false
    },
    reasoning: String
  }],

  // Delegation settings
  delegation: {
    isDelegate: {
      type: Boolean,
      default: false
    },
    delegateFor: [{
      walletAddress: String,
      userId: String,
      delegatedPower: Number,
      categories: [String], // which categories to vote for
      addedAt: Date
    }],
    delegatedTo: {
      walletAddress: String,
      userId: String,
      categories: [String],
      delegatedAt: Date
    }
  },

  // Notification preferences
  notifications: {
    newProposals: {
      type: Boolean,
      default: true
    },
    voteReminders: {
      type: Boolean,
      default: true
    },
    proposalResults: {
      type: Boolean,
      default: true
    },
    delegationUpdates: {
      type: Boolean,
      default: true
    },
    conflictAlerts: {
      type: Boolean,
      default: true
    }
  },

  // Voting history and statistics
  votingStats: {
    totalVotes: { type: Number, default: 0 },
    yesVotes: { type: Number, default: 0 },
    noVotes: { type: Number, default: 0 },
    abstainVotes: { type: Number, default: 0 },
    robotVotes: { type: Number, default: 0 },
    delegatedVotes: { type: Number, default: 0 },
    lastVoteAt: Date,
    participationRate: { type: Number, default: 0 }, // percentage of proposals voted on
    averageResponseTime: { type: Number, default: 0 } // in hours
  },

  // Reputation and badges
  reputation: {
    score: { type: Number, default: 0 },
    badges: [{
      name: String,
      description: String,
      earnedAt: Date,
      level: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
      }
    }],
    contributions: {
      proposalsCreated: { type: Number, default: 0 },
      successfulProposals: { type: Number, default: 0 },
      delegationsReceived: { type: Number, default: 0 },
      totalDelegatedPower: { type: Number, default: 0 }
    }
  },

  // Privacy settings
  privacy: {
    showVotingHistory: {
      type: Boolean,
      default: true
    },
    showDelegations: {
      type: Boolean,
      default: true
    },
    showReputation: {
      type: Boolean,
      default: true
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
votingPreferencesSchema.index({ userId: 1 });
votingPreferencesSchema.index({ walletAddress: 1 });
votingPreferencesSchema.index({ 'delegation.isDelegate': 1 });

// Virtual for voting accuracy
votingPreferencesSchema.virtual('votingAccuracy').get(function() {
  if (this.votingStats.totalVotes === 0) return 0;
  const successfulVotes = this.votingStats.yesVotes + this.votingStats.noVotes;
  return (successfulVotes / this.votingStats.totalVotes * 100).toFixed(1);
});

// Virtual for reputation level
votingPreferencesSchema.virtual('reputationLevel').get(function() {
  if (this.reputation.score >= 1000) return 'platinum';
  if (this.reputation.score >= 500) return 'gold';
  if (this.reputation.score >= 100) return 'silver';
  return 'bronze';
});

// Method to add vote
votingPreferencesSchema.methods.addVote = function(choice, robotVote = false, delegated = false) {
  this.votingStats.totalVotes += 1;
  this.votingStats.lastVoteAt = new Date();

  switch (choice) {
    case 'yes':
      this.votingStats.yesVotes += 1;
      break;
    case 'no':
      this.votingStats.noVotes += 1;
      break;
    case 'abstain':
      this.votingStats.abstainVotes += 1;
      break;
  }

  if (robotVote) {
    this.votingStats.robotVotes += 1;
  }

  if (delegated) {
    this.votingStats.delegatedVotes += 1;
  }

  // Update participation rate (would need total proposals count)
  // this.votingStats.participationRate = (this.votingStats.totalVotes / totalProposals) * 100;

  return this.save();
};

// Method to add trusted proposer
votingPreferencesSchema.methods.addTrustedProposer = function(proposerData) {
  const { walletAddress, name, trustLevel, autoVote } = proposerData;

  const existingProposer = this.trustedProposers.find(p => p.walletAddress === walletAddress);
  if (existingProposer) {
    existingProposer.name = name;
    existingProposer.trustLevel = trustLevel;
    existingProposer.autoVote = autoVote;
  } else {
    this.trustedProposers.push({
      walletAddress,
      name,
      trustLevel,
      autoVote,
      addedAt: new Date()
    });
  }

  return this.save();
};

// Method to add custom rule
votingPreferencesSchema.methods.addCustomRule = function(ruleData) {
  const { name, category, proposer, condition, threshold, action } = ruleData;

  this.customRules.push({
    name,
    category,
    proposer,
    condition,
    threshold,
    action,
    isActive: true
  });

  return this.save();
};

// Method to become delegate
votingPreferencesSchema.methods.becomeDelegate = function() {
  this.delegation.isDelegate = true;
  return this.save();
};

// Method to delegate to someone
votingPreferencesSchema.methods.delegateTo = function(delegateData) {
  const { walletAddress, userId, categories } = delegateData;

  this.delegation.delegatedTo = {
    walletAddress,
    userId,
    categories,
    delegatedAt: new Date()
  };

  return this.save();
};

// Method to add delegation from someone
votingPreferencesSchema.methods.addDelegation = function(delegationData) {
  const { walletAddress, userId, delegatedPower, categories } = delegationData;

  this.delegation.delegateFor.push({
    walletAddress,
    userId,
    delegatedPower,
    categories,
    addedAt: new Date()
  });

  this.reputation.contributions.delegationsReceived += 1;
  this.reputation.contributions.totalDelegatedPower += delegatedPower;

  return this.save();
};

// Method to update reputation
votingPreferencesSchema.methods.updateReputation = function(action, points) {
  this.reputation.score += points;

  // Check for new badges
  this.checkForBadges();

  return this.save();
};

// Method to check for badges
votingPreferencesSchema.methods.checkForBadges = function() {
  const badges = [];

  // Voting Champion badge
  if (this.votingStats.totalVotes >= 50) {
    badges.push({
      name: 'Voting Champion',
      description: 'Voted on 50+ proposals',
      earnedAt: new Date(),
      level: 'gold'
    });
  }

  // DAO Contributor badge
  if (this.reputation.contributions.proposalsCreated >= 5) {
    badges.push({
      name: 'DAO Contributor',
      description: 'Created 5+ proposals',
      earnedAt: new Date(),
      level: 'silver'
    });
  }

  // Delegate badge
  if (this.reputation.contributions.delegationsReceived >= 10) {
    badges.push({
      name: 'Trusted Delegate',
      description: 'Received 10+ delegations',
      earnedAt: new Date(),
      level: 'platinum'
    });
  }

  // Add new badges
  badges.forEach(badge => {
    const existingBadge = this.reputation.badges.find(b => b.name === badge.name);
    if (!existingBadge) {
      this.reputation.badges.push(badge);
    }
  });
};

// Static method to get preferences by user
votingPreferencesSchema.statics.getByUser = function(userId) {
  return this.findOne({ userId });
};

// Static method to get preferences by wallet
votingPreferencesSchema.statics.getByWallet = function(walletAddress) {
  return this.findOne({ walletAddress });
};

// Static method to get all delegates
votingPreferencesSchema.statics.getDelegates = function() {
  return this.find({ 'delegation.isDelegate': true });
};

module.exports = mongoose.model("VotingPreferences", votingPreferencesSchema);
