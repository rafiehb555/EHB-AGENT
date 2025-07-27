const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // Order Information
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  buyer: {
    userId: String,
    walletAddress: String,
    name: String,
    email: String,
    phone: String,
    location: String
  },
  seller: {
    userId: String,
    walletAddress: String,
    name: String,
    location: String,
    sqlLevel: String
  },

  // Product Information
  product: {
    id: String,
    name: String,
    description: String,
    price: Number,
    currency: String,
    sqlLevel: String,
    category: String,
    images: [String]
  },

  // Order Details
  quantity: {
    type: Number,
    default: 1
  },
  unitPrice: Number,
  totalPrice: Number,
  currency: {
    type: String,
    default: 'PKR'
  },

  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['wallet', 'crypto', 'bank_transfer', 'cash_on_delivery'],
      default: 'wallet'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionHash: String,
    walletTransaction: {
      from: String,
      to: String,
      amount: Number,
      gasUsed: Number,
      blockNumber: Number
    },
    paidAt: Date,
    refundedAt: Date
  },

  // Commission Distribution
  commission: {
    sellerAmount: Number,
    platformFee: Number,
    franchiseCommission: Number,
    distributed: {
      type: Boolean,
      default: false
    },
    distributionHash: String,
    distributedAt: Date,
    breakdown: {
      seller: Number,
      platform: Number,
      franchise: Number,
      validator: Number
    }
  },

  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },

  // Delivery Information
  delivery: {
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'same_day', 'pickup'],
      default: 'standard'
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: String,
    deliveryNotes: String
  },

  // Order Timeline
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String,
    updatedBy: String
  }],

  // AI Processing
  aiProcessing: {
    fraudCheck: {
      passed: Boolean,
      score: Number,
      flagged: Boolean,
      reason: String
    },
    recommendation: {
      suggested: Boolean,
      reason: String,
      confidence: Number
    },
    autoApprove: {
      type: Boolean,
      default: false
    }
  },

  // Customer Service
  customerService: {
    hasIssue: {
      type: Boolean,
      default: false
    },
    issueType: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'low'
    },
    assignedTo: String,
    resolved: {
      type: Boolean,
      default: false
    },
    resolutionNotes: String
  },

  // Reviews and Ratings
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date,
    helpful: {
      type: Number,
      default: 0
    }
  },

  // Metadata
  tags: [String],
  notes: String,

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
orderSchema.index({ orderId: 1 });
orderSchema.index({ 'buyer.userId': 1 });
orderSchema.index({ 'seller.userId': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order total
orderSchema.virtual('orderTotal').get(function() {
  return this.unitPrice * this.quantity;
});

// Virtual for commission total
orderSchema.virtual('commissionTotal').get(function() {
  return this.commission.sellerAmount + this.commission.platformFee + this.commission.franchiseCommission;
});

// Method to calculate commission breakdown
orderSchema.methods.calculateCommission = function() {
  const total = this.totalPrice;

  // Commission rates based on SQL level
  const commissionRates = {
    basic: { seller: 0.85, platform: 0.10, franchise: 0.05 },
    normal: { seller: 0.80, platform: 0.12, franchise: 0.08 },
    high: { seller: 0.75, platform: 0.15, franchise: 0.10 },
    vip: { seller: 0.70, platform: 0.18, franchise: 0.12 }
  };

  const rates = commissionRates[this.product.sqlLevel] || commissionRates.normal;

  this.commission = {
    sellerAmount: total * rates.seller,
    platformFee: total * rates.platform,
    franchiseCommission: total * rates.franchise,
    distributed: false,
    breakdown: {
      seller: rates.seller * 100,
      platform: rates.platform * 100,
      franchise: rates.franchise * 100,
      validator: 0.01 * 100 // 1% for validators
    }
  };

  return this.commission;
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, description, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    description: description,
    updatedBy: updatedBy
  });
  this.updatedAt = new Date();

  return this.save();
};

// Method to process payment
orderSchema.methods.processPayment = function(paymentData) {
  this.payment = {
    ...this.payment,
    ...paymentData,
    status: 'completed',
    paidAt: new Date()
  };

  this.status = 'confirmed';
  this.timeline.push({
    status: 'payment_completed',
    description: 'Payment processed successfully',
    updatedBy: 'system'
  });

  return this.save();
};

// Method to distribute commission
orderSchema.methods.distributeCommission = async function() {
  try {
    // Calculate commission if not already done
    if (!this.commission.sellerAmount) {
      this.calculateCommission();
    }

    // Simulate blockchain transaction for commission distribution
    const distributionHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;

    this.commission.distributed = true;
    this.commission.distributionHash = distributionHash;
    this.commission.distributedAt = new Date();

    this.timeline.push({
      status: 'commission_distributed',
      description: `Commission distributed: Seller ${this.commission.sellerAmount} ${this.currency}, Platform ${this.commission.platformFee} ${this.currency}, Franchise ${this.commission.franchiseCommission} ${this.currency}`,
      updatedBy: 'system'
    });

    await this.save();

    return {
      success: true,
      distributionHash,
      breakdown: this.commission.breakdown
    };

  } catch (error) {
    console.error('Commission distribution error:', error);
    throw error;
  }
};

// Method to check fraud
orderSchema.methods.checkFraud = function() {
  const fraudScore = Math.random() * 100; // In production, use real fraud detection
  const passed = fraudScore < 80;

  this.aiProcessing.fraudCheck = {
    passed,
    score: fraudScore,
    flagged: !passed,
    reason: passed ? null : 'Suspicious activity detected'
  };

  return this.aiProcessing.fraudCheck;
};

// Static method to get orders by user
orderSchema.statics.getOrdersByUser = function(userId, role = 'buyer') {
  const query = role === 'buyer' ? { 'buyer.userId': userId } : { 'seller.userId': userId };
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get pending payments
orderSchema.statics.getPendingPayments = function() {
  return this.find({ 'payment.status': 'pending' }).sort({ createdAt: 1 });
};

// Static method to get commission statistics
orderSchema.statics.getCommissionStats = function(sellerId, period = 'month') {
  const dateFilter = {};
  const now = new Date();

  if (period === 'week') {
    dateFilter.$gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    dateFilter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    dateFilter.$gte = new Date(now.getFullYear(), 0, 1);
  }

  return this.aggregate([
    {
      $match: {
        'seller.userId': sellerId,
        'commission.distributed': true,
        createdAt: dateFilter
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalCommission: { $sum: '$commission.sellerAmount' },
        totalPlatformFee: { $sum: '$commission.platformFee' },
        totalFranchiseCommission: { $sum: '$commission.franchiseCommission' }
      }
    }
  ]);
};

module.exports = mongoose.model("Order", orderSchema);
