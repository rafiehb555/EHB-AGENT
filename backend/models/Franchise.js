const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
  franchiseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Basic Information
  name: {
    type: String,
    required: true
  },

  owner: {
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: String,
    email: String,
    phone: String
  },

  // Location Information
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    timezone: String,
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    }
  },

  // Franchise Details
  type: {
    type: String,
    enum: ['restaurant', 'retail', 'service', 'technology', 'healthcare', 'education', 'other'],
    required: true
  },

  category: {
    type: String,
    required: true
  },

  description: String,

  // Status and Approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'suspended', 'terminated', 'expired'],
    default: 'pending'
  },

  approvalInfo: {
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: String,
    rejectionReason: String,
    documents: [{
      type: String,
      name: String,
      url: String,
      uploadedAt: Date,
      verifiedAt: Date
    }]
  },

  // Financial Information
  financial: {
    investmentRequired: {
      type: Number,
      required: true
    },
    royaltyFee: {
      type: Number,
      required: true
    },
    marketingFee: {
      type: Number,
      required: true
    },
    monthlyRevenue: {
      type: Number,
      default: 0
    },
    monthlyExpenses: {
      type: Number,
      default: 0
    },
    profitMargin: {
      type: Number,
      default: 0
    },
    paymentHistory: [{
      type: {
        type: String,
        enum: ['royalty', 'marketing', 'investment', 'other']
      },
      amount: Number,
      dueDate: Date,
      paidDate: Date,
      status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'cancelled'],
        default: 'pending'
      }
    }]
  },

  // Performance Metrics
  performance: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    customerCount: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    monthlyGrowth: {
      type: Number,
      default: 0
    },
    targetAchievement: {
      type: Number,
      default: 0
    }
  },

  // Staff Information
  staff: {
    totalEmployees: {
      type: Number,
      default: 0
    },
    managers: [{
      userId: String,
      name: String,
      email: String,
      phone: String,
      role: String,
      joinDate: Date
    }],
    employees: [{
      userId: String,
      name: String,
      email: String,
      phone: String,
      position: String,
      salary: Number,
      joinDate: Date,
      status: {
        type: String,
        enum: ['active', 'inactive', 'terminated'],
        default: 'active'
      }
    }]
  },

  // Inventory and Products
  inventory: {
    totalItems: {
      type: Number,
      default: 0
    },
    lowStockItems: [{
      itemId: String,
      name: String,
      currentStock: Number,
      minimumStock: Number,
      lastRestocked: Date
    }],
    categories: [{
      name: String,
      itemCount: Number,
      totalValue: Number
    }]
  },

  // Services and Features
  services: [{
    name: String,
    description: String,
    price: Number,
    isActive: {
      type: Boolean,
      default: true
    },
    category: String
  }],

  // Marketing and Promotions
  marketing: {
    activePromotions: [{
      name: String,
      description: String,
      discount: Number,
      startDate: Date,
      endDate: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      website: String
    },
    advertisingBudget: {
      type: Number,
      default: 0
    }
  },

  // Compliance and Legal
  compliance: {
    licenses: [{
      type: String,
      number: String,
      issuedDate: Date,
      expiryDate: Date,
      status: {
        type: String,
        enum: ['active', 'expired', 'pending'],
        default: 'active'
      }
    }],
    permits: [{
      type: String,
      number: String,
      issuedDate: Date,
      expiryDate: Date,
      status: {
        type: String,
        enum: ['active', 'expired', 'pending'],
        default: 'active'
      }
    }],
    insurance: {
      policyNumber: String,
      provider: String,
      coverage: String,
      startDate: Date,
      endDate: Date,
      premium: Number
    }
  },

  // Communication and Support
  communication: {
    supportTickets: [{
      ticketId: String,
      subject: String,
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
      },
      createdAt: Date,
      resolvedAt: Date,
      assignedTo: String
    }],
    announcements: [{
      title: String,
      message: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      createdAt: Date,
      readBy: [String]
    }]
  },

  // Analytics and Reports
  analytics: {
    dailyStats: [{
      date: Date,
      sales: Number,
      orders: Number,
      customers: Number,
      revenue: Number,
      expenses: Number
    }],
    monthlyReports: [{
      month: String,
      year: Number,
      totalSales: Number,
      totalOrders: Number,
      averageOrderValue: Number,
      customerGrowth: Number,
      profitMargin: Number
    }]
  },

  // Settings and Preferences
  settings: {
    autoOrdering: {
      type: Boolean,
      default: false
    },
    lowStockAlerts: {
      type: Boolean,
      default: true
    },
    performanceAlerts: {
      type: Boolean,
      default: true
    },
    paymentReminders: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
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
franchiseSchema.index({ franchiseId: 1, status: 1 });
franchiseSchema.index({ 'owner.userId': 1 });
franchiseSchema.index({ type: 1, category: 1 });
franchiseSchema.index({ 'location.coordinates': '2dsphere' });
franchiseSchema.index({ 'performance.rating': -1 });

// Pre-save middleware
franchiseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
franchiseSchema.methods.addEmployee = function(employee) {
  this.staff.employees.push(employee);
  this.staff.totalEmployees = this.staff.employees.length;
  return this.save();
};

franchiseSchema.methods.removeEmployee = function(employeeId) {
  this.staff.employees = this.staff.employees.filter(emp => emp.userId !== employeeId);
  this.staff.totalEmployees = this.staff.employees.length;
  return this.save();
};

franchiseSchema.methods.addService = function(service) {
  this.services.push(service);
  return this.save();
};

franchiseSchema.methods.updatePerformance = function(metrics) {
  Object.assign(this.performance, metrics);
  return this.save();
};

franchiseSchema.methods.addPayment = function(payment) {
  this.financial.paymentHistory.push(payment);
  return this.save();
};

franchiseSchema.methods.addSupportTicket = function(ticket) {
  this.communication.supportTickets.push(ticket);
  return this.save();
};

franchiseSchema.methods.addAnnouncement = function(announcement) {
  this.communication.announcements.push(announcement);
  return this.save();
};

franchiseSchema.methods.updateInventory = function(itemId, quantity) {
  const item = this.inventory.lowStockItems.find(item => item.itemId === itemId);
  if (item) {
    item.currentStock += quantity;
    item.lastRestocked = new Date();
  }
  return this.save();
};

franchiseSchema.methods.calculateProfitMargin = function() {
  if (this.financial.monthlyRevenue > 0) {
    this.financial.profitMargin = ((this.financial.monthlyRevenue - this.financial.monthlyExpenses) / this.financial.monthlyRevenue) * 100;
  }
  return this.save();
};

// Static methods
franchiseSchema.statics.findByOwner = function(userId) {
  return this.find({ 'owner.userId': userId });
};

franchiseSchema.statics.findByType = function(type) {
  return this.find({ type });
};

franchiseSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

franchiseSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

franchiseSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'performance.totalSales': -1 })
    .limit(limit)
    .select('franchiseId name performance');
};

franchiseSchema.statics.getFranchiseStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$financial.monthlyRevenue' },
        totalInvestment: { $sum: '$financial.investmentRequired' }
      }
    }
  ]);
};

module.exports = mongoose.model('Franchise', franchiseSchema);
