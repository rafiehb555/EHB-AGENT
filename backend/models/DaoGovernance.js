const mongoose = require("mongoose");

const daoGovernanceSchema = new mongoose.Schema({
  // Proposal Information
  proposalId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  proposer: {
    walletAddress: String,
    userId: String,
    tokenBalance: Number
  },

  // Proposal Details
  category: {
    type: String,
    enum: ['upgrade', 'governance', 'reward', 'security', 'feature', 'emergency'],
    default: 'governance'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'voting', 'passed', 'rejected', 'executed', 'expired'],
    default: 'draft'
  },

  // Voting Configuration
  votingPeriod: {
    startDate: Date,
    endDate: Date,
    duration: Number // in days
  },
  quorum: {
    type: Number,
    default: 1000 // minimum EHBGC tokens required
  },
  threshold: {
    type: Number,
    default: 51 // percentage required to pass
  },

  // Proposal Impact
  impact: {
    cost: Number, // EHBGC cost
    risk: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    affectedUsers: Number,
    implementationTime: Number // in days
  },

  // AI Analysis
  aiAnalysis: {
    summary: String,
    recommendation: {
      type: String,
      enum: ['yes', 'no', 'abstain'],
      default: 'abstain'
    },
    reasoning: String,
    confidence: Number, // 0-100
    analyzedAt: Date
  },

  // Voting Results
  votes: [{
    voter: {
      walletAddress: String,
      userId: String
    },
    choice: {
      type: String,
      enum: ['yes', 'no', 'abstain'],
      required: true
    },
    power: Number, // voting power in EHBGC
    timestamp: {
      type: Date,
      default: Date.now
    },
    delegatedFrom: String, // if vote is delegated
    robotVote: {
      type: Boolean,
      default: false
    },
    reasoning: String
  }],

  // Vote Statistics
  voteStats: {
    totalVotes: { type: Number, default: 0 },
    yesVotes: { type: Number, default: 0 },
    noVotes: { type: Number, default: 0 },
    abstainVotes: { type: Number, default: 0 },
    totalPower: { type: Number, default: 0 },
    yesPower: { type: Number, default: 0 },
    noPower: { type: Number, default: 0 },
    abstainPower: { type: Number, default: 0 }
  },

  // Execution
  execution: {
    executed: { type: Boolean, default: false },
    executedAt: Date,
    executedBy: String,
    transactionHash: String,
    implementationStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    }
  },

  // Metadata
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],

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
daoGovernanceSchema.index({ proposalId: 1 });
daoGovernanceSchema.index({ status: 1 });
daoGovernanceSchema.index({ 'votingPeriod.endDate': 1 });
daoGovernanceSchema.index({ proposer: 1 });
daoGovernanceSchema.index({ category: 1 });

// Virtual for vote percentage
daoGovernanceSchema.virtual('yesPercentage').get(function() {
  if (this.voteStats.totalPower === 0) return 0;
  return (this.voteStats.yesPower / this.voteStats.totalPower * 100).toFixed(2);
});

// Virtual for quorum status
daoGovernanceSchema.virtual('quorumMet').get(function() {
  return this.voteStats.totalPower >= this.quorum;
});

// Virtual for proposal status
daoGovernanceSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'voting' &&
         now >= this.votingPeriod.startDate &&
         now <= this.votingPeriod.endDate;
});

// Method to add vote
daoGovernanceSchema.methods.addVote = function(voteData) {
  const { voter, choice, power, delegatedFrom, robotVote, reasoning } = voteData;

  // Check if user already voted
  const existingVote = this.votes.find(v => v.voter.walletAddress === voter.walletAddress);
  if (existingVote) {
    // Update existing vote
    existingVote.choice = choice;
    existingVote.power = power;
    existingVote.timestamp = new Date();
    existingVote.delegatedFrom = delegatedFrom;
    existingVote.robotVote = robotVote;
    existingVote.reasoning = reasoning;
  } else {
    // Add new vote
    this.votes.push({
      voter,
      choice,
      power,
      delegatedFrom,
      robotVote,
      reasoning,
      timestamp: new Date()
    });
  }

  // Update vote statistics
  this.updateVoteStats();

  return this.save();
};

// Method to update vote statistics
daoGovernanceSchema.methods.updateVoteStats = function() {
  let totalVotes = 0, yesVotes = 0, noVotes = 0, abstainVotes = 0;
  let totalPower = 0, yesPower = 0, noPower = 0, abstainPower = 0;

  this.votes.forEach(vote => {
    totalVotes++;
    totalPower += vote.power;

    switch (vote.choice) {
      case 'yes':
        yesVotes++;
        yesPower += vote.power;
        break;
      case 'no':
        noVotes++;
        noPower += vote.power;
        break;
      case 'abstain':
        abstainVotes++;
        abstainPower += vote.power;
        break;
    }
  });

  this.voteStats = {
    totalVotes,
    yesVotes,
    noVotes,
    abstainVotes,
    totalPower,
    yesPower,
    noPower,
    abstainPower
  };
};

// Method to check if proposal passed
daoGovernanceSchema.methods.checkPassed = function() {
  if (!this.quorumMet) return false;

  const yesPercentage = parseFloat(this.yesPercentage);
  return yesPercentage >= this.threshold;
};

// Method to execute proposal
daoGovernanceSchema.methods.execute = function(executedBy, transactionHash) {
  this.execution = {
    executed: true,
    executedAt: new Date(),
    executedBy,
    transactionHash,
    implementationStatus: 'pending'
  };

  this.status = 'executed';
  this.updatedAt = new Date();

  return this.save();
};

// Static method to get active proposals
daoGovernanceSchema.statics.getActiveProposals = function() {
  const now = new Date();
  return this.find({
    status: 'voting',
    'votingPeriod.startDate': { $lte: now },
    'votingPeriod.endDate': { $gte: now }
  }).sort({ 'votingPeriod.endDate': 1 });
};

// Static method to get proposals by user
daoGovernanceSchema.statics.getProposalsByUser = function(walletAddress) {
  return this.find({
    'proposer.walletAddress': walletAddress
  }).sort({ createdAt: -1 });
};

// Static method to get user votes
daoGovernanceSchema.statics.getUserVotes = function(walletAddress) {
  return this.find({
    'votes.voter.walletAddress': walletAddress
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("DaoGovernance", daoGovernanceSchema);
