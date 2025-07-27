const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Wallet Information
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  walletType: {
    type: String,
    enum: ['user', 'franchise', 'company', 'system'],
    default: 'user'
  },

  // Balance Information
  balances: {
    EHB: {
      type: Number,
      default: 0,
      min: 0
    },
    USDT: {
      type: Number,
      default: 0,
      min: 0
    },
    BTC: {
      type: Number,
      default: 0,
      min: 0
    },
    ETH: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Transaction History
  transactions: [{
    txHash: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'reward', 'refund'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ['EHB', 'USDT', 'BTC', 'ETH'],
      required: true
    },
    fromAddress: String,
    toAddress: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'cancelled'],
      default: 'pending'
    },
    blockNumber: Number,
    gasUsed: Number,
    gasPrice: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],

  // Security Settings
  security: {
    isLocked: {
      type: Boolean,
      default: false
    },
    lockReason: String,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  },

  // Permissions and Roles
  permissions: {
    canSend: {
      type: Boolean,
      default: true
    },
    canReceive: {
      type: Boolean,
      default: true
    },
    canTrade: {
      type: Boolean,
      default: true
    },
    canStake: {
      type: Boolean,
      default: false
    },
    maxDailyTransfer: {
      type: Number,
      default: 10000
    }
  },

  // KYC Information
  kyc: {
    status: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none'
    },
    documents: [{
      type: {
        type: String,
        enum: ['id_card', 'passport', 'drivers_license', 'utility_bill']
      },
      fileUrl: String,
      uploadedAt: Date,
      verifiedAt: Date,
      verifiedBy: String
    }],
    personalInfo: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      nationality: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
      },
      phone: String,
      email: String
    }
  },

  // Staking Information
  staking: {
    totalStaked: {
      type: Number,
      default: 0
    },
    stakingRewards: {
      type: Number,
      default: 0
    },
    stakingHistory: [{
      amount: Number,
      currency: String,
      startDate: Date,
      endDate: Date,
      rewardRate: Number,
      totalReward: Number,
      status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
      }
    }]
  },

  // DeFi Features
  defi: {
    liquidityPools: [{
      poolId: String,
      tokenA: String,
      tokenB: String,
      liquidity: Number,
      rewards: Number,
      stakedAt: Date
    }],
    yieldFarming: [{
      farmId: String,
      token: String,
      stakedAmount: Number,
      rewards: Number,
      startDate: Date
    }]
  },

  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['transaction', 'security', 'kyc', 'staking', 'reward'],
      required: true
    },
    title: String,
    message: String,
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],

  // Settings
  settings: {
    defaultCurrency: {
      type: String,
      enum: ['EHB', 'USDT', 'BTC', 'ETH'],
      default: 'EHB'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
walletSchema.index({ userId: 1, walletType: 1 });
walletSchema.index({ 'balances.EHB': -1 });
walletSchema.index({ 'kyc.status': 1 });
walletSchema.index({ 'security.isLocked': 1 });

// Pre-save middleware
walletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
walletSchema.methods.addTransaction = function(transaction) {
  this.transactions.push(transaction);
  return this.save();
};

walletSchema.methods.updateBalance = function(currency, amount, operation = 'add') {
  if (operation === 'add') {
    this.balances[currency] += amount;
  } else if (operation === 'subtract') {
    this.balances[currency] = Math.max(0, this.balances[currency] - amount);
  }
  return this.save();
};

walletSchema.methods.getBalance = function(currency = 'EHB') {
  return this.balances[currency] || 0;
};

walletSchema.methods.canTransfer = function(amount, currency = 'EHB') {
  const balance = this.getBalance(currency);
  const dailyLimit = this.permissions.maxDailyTransfer;

  // Check if wallet is locked
  if (this.security.isLocked) {
    return { canTransfer: false, reason: 'Wallet is locked' };
  }

  // Check balance
  if (balance < amount) {
    return { canTransfer: false, reason: 'Insufficient balance' };
  }

  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = this.transactions.filter(tx =>
    tx.type === 'transfer' &&
    tx.currency === currency &&
    tx.timestamp >= today
  );

  const todayTotal = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  if (todayTotal + amount > dailyLimit) {
    return { canTransfer: false, reason: 'Daily transfer limit exceeded' };
  }

  return { canTransfer: true };
};

walletSchema.methods.addNotification = function(notification) {
  this.notifications.push(notification);
  return this.save();
};

walletSchema.methods.markNotificationAsRead = function(notificationId) {
  const notification = this.notifications.id(notificationId);
  if (notification) {
    notification.isRead = true;
    return this.save();
  }
  return Promise.resolve();
};

// Static methods
walletSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

walletSchema.statics.findByAddress = function(address) {
  return this.findOne({ walletAddress: address });
};

walletSchema.statics.getTopWallets = function(currency = 'EHB', limit = 10) {
  return this.find()
    .sort({ [`balances.${currency}`]: -1 })
    .limit(limit)
    .select('userId walletAddress balances');
};

walletSchema.statics.getTransactionStats = function() {
  return this.aggregate([
    {
      $unwind: '$transactions'
    },
    {
      $group: {
        _id: {
          type: '$transactions.type',
          currency: '$transactions.currency',
          status: '$transactions.status'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$transactions.amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Wallet', walletSchema);
