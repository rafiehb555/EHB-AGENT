const mongoose = require("mongoose");

const personalBrainSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  walletAddress: {
    type: String,
    required: true
  },

  // Core Brain Configuration
  brainVersion: {
    type: String,
    default: "1.0.0"
  },
  lastTrained: {
    type: Date,
    default: Date.now
  },
  trainingDataPoints: {
    type: Number,
    default: 0
  },

  // User Preferences & Style
  preferences: {
    responseLength: {
      type: String,
      enum: ['concise', 'detailed', 'conversational'],
      default: 'conversational'
    },
    tone: {
      type: String,
      enum: ['formal', 'friendly', 'casual', 'professional'],
      default: 'friendly'
    },
    language: {
      primary: { type: String, default: 'english' },
      secondary: { type: String, default: 'urdu' },
      autoSwitch: { type: Boolean, default: true }
    },
    emojiUsage: {
      type: String,
      enum: ['minimal', 'moderate', 'heavy'],
      default: 'moderate'
    },
    formality: {
      type: String,
      enum: ['very_formal', 'formal', 'casual', 'very_casual'],
      default: 'casual'
    }
  },

  // Learned Behaviors
  learnedPatterns: {
    commonIntents: [{
      intent: String,
      frequency: Number,
      lastUsed: Date,
      successRate: Number
    }],
    preferredCommands: [{
      command: String,
      category: String,
      usageCount: Number,
      lastUsed: Date
    }],
    rejectedSuggestions: [{
      suggestion: String,
      reason: String,
      timestamp: Date
    }],
    vocabulary: {
      favoriteWords: [String],
      avoidedWords: [String],
      customTerms: [{
        term: String,
        meaning: String,
        context: String
      }]
    }
  },

  // AI Model Configuration
  modelConfig: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0.1,
      max: 1.0
    },
    maxTokens: {
      type: Number,
      default: 150,
      min: 50,
      max: 500
    },
    topP: {
      type: Number,
      default: 0.9,
      min: 0.1,
      max: 1.0
    },
    customPrompts: [{
      name: String,
      prompt: String,
      category: String,
      isActive: { type: Boolean, default: true }
    }],
    instructionTuning: {
      type: String,
      default: "You are a helpful AI assistant. Be concise and friendly."
    }
  },

  // Domain Expertise
  expertise: {
    primaryDomains: [{
      domain: String,
      confidence: Number,
      lastUsed: Date,
      trainingData: Number
    }],
    learnedSkills: [{
      skill: String,
      proficiency: Number,
      lastPracticed: Date,
      applications: [String]
    }],
    automationRules: [{
      trigger: String,
      action: String,
      conditions: [String],
      isActive: { type: Boolean, default: true }
    }]
  },

  // Interaction History
  interactionStats: {
    totalInteractions: { type: Number, default: 0 },
    successfulInteractions: { type: Number, default: 0 },
    failedInteractions: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    mostActiveHours: [{
      hour: Number,
      count: Number
    }],
    favoriteFeatures: [{
      feature: String,
      usageCount: Number
    }]
  },

  // Privacy & Security
  privacy: {
    allowTraining: { type: Boolean, default: true },
    allowSharing: { type: Boolean, default: false },
    encryptionKey: String,
    lastBackup: Date
  },

  // Export/Import
  exportHistory: [{
    exportedAt: Date,
    version: String,
    size: Number,
    destination: String
  }],

  // Performance Metrics
  performance: {
    accuracyScore: { type: Number, default: 0 },
    userSatisfaction: { type: Number, default: 0 },
    learningRate: { type: Number, default: 0 },
    lastEvaluation: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
personalBrainSchema.index({ userId: 1 });
personalBrainSchema.index({ walletAddress: 1 });
personalBrainSchema.index({ 'learnedPatterns.commonIntents.intent': 1 });

// Virtual for brain age
personalBrainSchema.virtual('brainAge').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for training progress
personalBrainSchema.virtual('trainingProgress').get(function() {
  const minDataPoints = 100;
  return Math.min((this.trainingDataPoints / minDataPoints) * 100, 100);
});

// Method to update interaction stats
personalBrainSchema.methods.updateInteractionStats = function(success, responseTime) {
  this.interactionStats.totalInteractions += 1;
  if (success) {
    this.interactionStats.successfulInteractions += 1;
  } else {
    this.interactionStats.failedInteractions += 1;
  }

  // Update average response time
  const currentAvg = this.interactionStats.averageResponseTime;
  const newAvg = ((currentAvg * (this.interactionStats.totalInteractions - 1)) + responseTime) / this.interactionStats.totalInteractions;
  this.interactionStats.averageResponseTime = newAvg;

  return this.save();
};

// Method to learn from interaction
personalBrainSchema.methods.learnFromInteraction = function(interaction) {
  const { intent, command, success, response, timestamp } = interaction;

  // Update common intents
  let intentEntry = this.learnedPatterns.commonIntents.find(i => i.intent === intent);
  if (intentEntry) {
    intentEntry.frequency += 1;
    intentEntry.lastUsed = timestamp;
    intentEntry.successRate = ((intentEntry.successRate * (intentEntry.frequency - 1)) + (success ? 1 : 0)) / intentEntry.frequency;
  } else {
    this.learnedPatterns.commonIntents.push({
      intent,
      frequency: 1,
      lastUsed: timestamp,
      successRate: success ? 1 : 0
    });
  }

  // Update preferred commands
  let commandEntry = this.learnedPatterns.preferredCommands.find(c => c.command === command);
  if (commandEntry) {
    commandEntry.usageCount += 1;
    commandEntry.lastUsed = timestamp;
  } else {
    this.learnedPatterns.preferredCommands.push({
      command,
      category: this.categorizeCommand(command),
      usageCount: 1,
      lastUsed: timestamp
    });
  }

  this.trainingDataPoints += 1;
  this.lastTrained = new Date();

  return this.save();
};

// Method to categorize command
personalBrainSchema.methods.categorizeCommand = function(command) {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes('order') || lowerCommand.includes('buy') || lowerCommand.includes('purchase')) {
    return 'shopping';
  }
  if (lowerCommand.includes('book') || lowerCommand.includes('schedule') || lowerCommand.includes('appointment')) {
    return 'booking';
  }
  if (lowerCommand.includes('remind') || lowerCommand.includes('reminder')) {
    return 'reminder';
  }
  if (lowerCommand.includes('check') || lowerCommand.includes('balance') || lowerCommand.includes('wallet')) {
    return 'finance';
  }

  return 'general';
};

// Method to export brain
personalBrainSchema.methods.exportBrain = function() {
  const brainData = {
    userId: this.userId,
    walletAddress: this.walletAddress,
    brainVersion: this.brainVersion,
    preferences: this.preferences,
    learnedPatterns: this.learnedPatterns,
    modelConfig: this.modelConfig,
    expertise: this.expertise,
    interactionStats: this.interactionStats,
    performance: this.performance,
    exportDate: new Date(),
    exportVersion: this.brainVersion
  };

  // Log export
  this.exportHistory.push({
    exportedAt: new Date(),
    version: this.brainVersion,
    size: JSON.stringify(brainData).length,
    destination: 'user_export'
  });

  return brainData;
};

// Method to import brain
personalBrainSchema.methods.importBrain = function(brainData) {
  if (brainData.preferences) this.preferences = brainData.preferences;
  if (brainData.learnedPatterns) this.learnedPatterns = brainData.learnedPatterns;
  if (brainData.modelConfig) this.modelConfig = brainData.modelConfig;
  if (brainData.expertise) this.expertise = brainData.expertise;

  this.brainVersion = brainData.exportVersion || this.brainVersion;
  this.lastTrained = new Date();

  return this.save();
};

// Static method to get brain by user
personalBrainSchema.statics.getBrainByUser = function(userId) {
  return this.findOne({ userId });
};

// Static method to get brain by wallet
personalBrainSchema.statics.getBrainByWallet = function(walletAddress) {
  return this.findOne({ walletAddress });
};

module.exports = mongoose.model("PersonalBrain", personalBrainSchema);
