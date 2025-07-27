const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Basic Information
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  // Complainant Information
  complainant: {
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: String,
    email: String,
    phone: String,
    userType: {
      type: String,
      enum: ['customer', 'franchise_owner', 'employee', 'partner', 'other'],
      default: 'customer'
    }
  },

  // Complaint Details
  category: {
    type: String,
    enum: [
      'service_quality',
      'product_issue',
      'billing_payment',
      'delivery_delay',
      'staff_behavior',
      'franchise_issue',
      'technical_problem',
      'fraud_scam',
      'safety_concern',
      'other'
    ],
    required: true
  },

  subcategory: String,

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical'],
    default: 'moderate'
  },

  // Status and Progress
  status: {
    type: String,
    enum: ['open', 'in_progress', 'under_review', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },

  // Related Entities
  relatedTo: {
    franchiseId: String,
    orderId: String,
    transactionId: String,
    productId: String,
    serviceId: String,
    employeeId: String
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
    branchName: String,
    branchId: String
  },

  // Financial Impact
  financialImpact: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['refund', 'compensation', 'discount', 'none'],
      default: 'none'
    }
  },

  // Timeline
  timeline: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    assignedAt: Date,
    firstResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date,
    slaDeadline: Date,
    escalationDate: Date
  },

  // Assignment and Handling
  assignment: {
    assignedTo: {
      userId: String,
      name: String,
      department: String,
      role: String
    },
    assignedAt: Date,
    reassignedAt: Date,
    previousAssignments: [{
      userId: String,
      name: String,
      assignedAt: Date,
      reassignedAt: Date,
      reason: String
    }]
  },

  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['internal_note', 'customer_response', 'system_update', 'escalation'],
      required: true
    },
    from: {
      userId: String,
      name: String,
      role: String
    },
    to: {
      userId: String,
      name: String,
      role: String
    },
    subject: String,
    message: String,
    isInternal: {
      type: Boolean,
      default: false
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Resolution Details
  resolution: {
    solution: String,
    resolutionType: {
      type: String,
      enum: ['refund', 'replacement', 'compensation', 'apology', 'system_fix', 'policy_change', 'other'],
      default: 'other'
    },
    resolutionAmount: Number,
    resolutionCurrency: String,
    resolvedBy: {
      userId: String,
      name: String,
      role: String
    },
    resolutionDate: Date,
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    customerFeedback: String
  },

  // Escalation Information
  escalation: {
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalationLevel: {
      type: Number,
      default: 0
    },
    escalationReason: String,
    escalatedTo: {
      userId: String,
      name: String,
      role: String
    },
    escalationDate: Date,
    escalationHistory: [{
      level: Number,
      reason: String,
      escalatedTo: {
        userId: String,
        name: String,
        role: String
      },
      escalatedAt: Date,
      resolvedAt: Date
    }]
  },

  // Tags and Classification
  tags: [String],

  classification: {
    isUrgent: {
      type: Boolean,
      default: false
    },
    requiresImmediate: {
      type: Boolean,
      default: false
    },
    affectsMultiple: {
      type: Boolean,
      default: false
    },
    hasLegalImplications: {
      type: Boolean,
      default: false
    },
    isPublicRelationIssue: {
      type: Boolean,
      default: false
    }
  },

  // Analytics and Metrics
  metrics: {
    responseTime: Number, // in minutes
    resolutionTime: Number, // in minutes
    customerSatisfaction: Number,
    escalationCount: {
      type: Number,
      default: 0
    },
    communicationCount: {
      type: Number,
      default: 0
    },
    slaCompliance: {
      type: Boolean,
      default: true
    }
  },

  // Follow-up and Prevention
  followUp: {
    isRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    followUpType: {
      type: String,
      enum: ['call', 'email', 'visit', 'survey'],
      default: 'email'
    },
    followUpStatus: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    },
    preventionMeasures: [String]
  },

  // AI Analysis
  aiAnalysis: {
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    category: String,
    suggestedResolution: String,
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    automatedResponse: String
  },

  // Settings
  settings: {
    autoEscalation: {
      type: Boolean,
      default: true
    },
    customerNotifications: {
      type: Boolean,
      default: true
    },
    internalAlerts: {
      type: Boolean,
      default: true
    },
    slaReminders: {
      type: Boolean,
      default: true
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
complaintSchema.index({ complaintId: 1, status: 1 });
complaintSchema.index({ 'complainant.userId': 1 });
complaintSchema.index({ category: 1, priority: 1 });
complaintSchema.index({ 'timeline.submittedAt': -1 });
complaintSchema.index({ 'assignment.assignedTo.userId': 1 });
complaintSchema.index({ 'escalation.isEscalated': 1 });

// Pre-save middleware
complaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Update metrics
  if (this.timeline.firstResponseAt && this.timeline.submittedAt) {
    this.metrics.responseTime = Math.floor((this.timeline.firstResponseAt - this.timeline.submittedAt) / (1000 * 60));
  }

  if (this.timeline.resolvedAt && this.timeline.submittedAt) {
    this.metrics.resolutionTime = Math.floor((this.timeline.resolvedAt - this.timeline.submittedAt) / (1000 * 60));
  }

  this.metrics.communicationCount = this.communications.length;
  this.escalation.escalationLevel = this.escalation.escalationHistory.length;

  next();
});

// Instance methods
complaintSchema.methods.addCommunication = function(communication) {
  this.communications.push(communication);
  this.metrics.communicationCount = this.communications.length;
  return this.save();
};

complaintSchema.methods.assignTo = function(user) {
  this.assignment.assignedTo = user;
  this.assignment.assignedAt = new Date();
  this.status = 'in_progress';
  return this.save();
};

complaintSchema.methods.escalate = function(reason, escalatedTo) {
  this.escalation.isEscalated = true;
  this.escalation.escalationLevel += 1;
  this.escalation.escalationReason = reason;
  this.escalation.escalatedTo = escalatedTo;
  this.escalation.escalationDate = new Date();

  this.escalation.escalationHistory.push({
    level: this.escalation.escalationLevel,
    reason: reason,
    escalatedTo: escalatedTo,
    escalatedAt: new Date()
  });

  this.metrics.escalationCount = this.escalation.escalationLevel;
  return this.save();
};

complaintSchema.methods.resolve = function(resolution) {
  this.status = 'resolved';
  this.resolution = { ...this.resolution, ...resolution };
  this.timeline.resolvedAt = new Date();
  this.metrics.resolutionTime = Math.floor((this.timeline.resolvedAt - this.timeline.submittedAt) / (1000 * 60));
  return this.save();
};

complaintSchema.methods.close = function() {
  this.status = 'closed';
  this.timeline.closedAt = new Date();
  return this.save();
};

complaintSchema.methods.updateSLA = function() {
  const now = new Date();
  const submitted = this.timeline.submittedAt;
  const slaDeadline = this.timeline.slaDeadline;

  if (slaDeadline && now > slaDeadline) {
    this.metrics.slaCompliance = false;
  }

  return this.save();
};

complaintSchema.methods.calculateRiskScore = function() {
  let score = 50; // Base score

  // Priority impact
  const priorityScores = { low: 10, medium: 30, high: 60, urgent: 90 };
  score += priorityScores[this.priority] || 30;

  // Severity impact
  const severityScores = { minor: 5, moderate: 20, major: 50, critical: 80 };
  score += severityScores[this.severity] || 20;

  // Escalation impact
  score += this.escalation.escalationLevel * 10;

  // Financial impact
  if (this.financialImpact.amount > 1000) score += 20;
  if (this.financialImpact.amount > 5000) score += 30;

  // Classification impact
  if (this.classification.isUrgent) score += 15;
  if (this.classification.hasLegalImplications) score += 25;
  if (this.classification.isPublicRelationIssue) score += 30;

  this.aiAnalysis.riskScore = Math.min(100, Math.max(0, score));
  return this.save();
};

// Static methods
complaintSchema.statics.findByComplainant = function(userId) {
  return this.find({ 'complainant.userId': userId });
};

complaintSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

complaintSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

complaintSchema.statics.findByAssignee = function(userId) {
  return this.find({ 'assignment.assignedTo.userId': userId });
};

complaintSchema.statics.findUrgent = function() {
  return this.find({
    $or: [
      { priority: 'urgent' },
      { 'classification.isUrgent': true },
      { 'escalation.isEscalated': true }
    ]
  });
};

complaintSchema.statics.getComplaintStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$metrics.responseTime' },
        avgResolutionTime: { $avg: '$metrics.resolutionTime' },
        avgSatisfaction: { $avg: '$resolution.customerSatisfaction' }
      }
    }
  ]);
};

complaintSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPriority: { $avg: { $indexOfArray: ['$priority', ['low', 'medium', 'high', 'urgent']] } },
        avgSatisfaction: { $avg: '$resolution.customerSatisfaction' }
      }
    }
  ]);
};

module.exports = mongoose.model('Complaint', complaintSchema);
