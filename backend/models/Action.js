const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  // Basic action info
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'database', 'api_call', 'file_operation', 'system_command', 'notification', 'email', 'sms'],
    required: true
  },

  // Execution details
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Action configuration
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Product ordering specific
  order: {
    productId: String,
    productName: String,
    quantity: Number,
    price: Number,
    vendor: String,
    deliveryAddress: String,
    paymentMethod: String
  },

  // Payment specific
  payment: {
    amount: Number,
    currency: String,
    method: String,
    recipient: String,
    description: String
  },

  // Database operations
  database: {
    operation: {
      type: String,
      enum: ['insert', 'update', 'delete', 'query', 'backup', 'restore']
    },
    table: String,
    query: String,
    data: mongoose.Schema.Types.Mixed
  },

  // API calls
  api: {
    url: String,
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
    timeout: Number
  },

  // File operations
  file: {
    operation: {
      type: String,
      enum: ['read', 'write', 'delete', 'copy', 'move', 'backup']
    },
    path: String,
    content: String,
    encoding: String
  },

  // System commands
  system: {
    command: String,
    args: [String],
    workingDir: String,
    timeout: Number
  },

  // Notification settings
  notification: {
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app', 'voice']
    },
    recipient: String,
    subject: String,
    message: String,
    template: String
  },

  // Execution tracking
  executionHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      required: true
    },
    result: mongoose.Schema.Types.Mixed,
    error: String,
    duration: Number,
    logs: [String]
  }],

  // Scheduling
  scheduledFor: {
    type: Date,
    required: true
  },
  executedAt: Date,
  nextRetry: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },

  // User and permissions
  userId: {
    type: String,
    required: true
  },
  permissions: {
    type: [String],
    default: ['read', 'execute']
  },

  // Security and validation
  requiresConfirmation: {
    type: Boolean,
    default: false
  },
  confirmedBy: String,
  confirmedAt: Date,

  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
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

// Indexes for efficient querying
actionSchema.index({ userId: 1, scheduledFor: 1 });
actionSchema.index({ status: 1, scheduledFor: 1 });
actionSchema.index({ type: 1, status: 1 });
actionSchema.index({ 'order.productId': 1 });
actionSchema.index({ 'payment.recipient': 1 });

// Pre-save middleware
actionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
actionSchema.methods.execute = async function() {
  try {
    this.status = 'running';
    this.executedAt = new Date();
    await this.save();

    const startTime = Date.now();
    let result = null;
    let status = 'success';
    let logs = [];

    // Execute based on action type
    switch (this.type) {
      case 'order':
        result = await this.executeOrder();
        break;
      case 'payment':
        result = await this.executePayment();
        break;
      case 'database':
        result = await this.executeDatabase();
        break;
      case 'api_call':
        result = await this.executeApiCall();
        break;
      case 'file_operation':
        result = await this.executeFileOperation();
        break;
      case 'system_command':
        result = await this.executeSystemCommand();
        break;
      case 'notification':
        result = await this.executeNotification();
        break;
      default:
        throw new Error(`Unknown action type: ${this.type}`);
    }

    const duration = Date.now() - startTime;

    // Add to execution history
    this.executionHistory.push({
      timestamp: new Date(),
      status,
      result,
      duration,
      logs
    });

    this.status = 'completed';
    await this.save();

    return { success: true, result, duration, logs };

  } catch (error) {
    console.error('Action execution error:', error);

    this.executionHistory.push({
      timestamp: new Date(),
      status: 'failed',
      error: error.message,
      duration: Date.now() - (this.executedAt?.getTime() || Date.now()),
      logs: [error.stack]
    });

    // Handle retries
    if (this.retryCount < this.maxRetries) {
      this.retryCount += 1;
      this.status = 'pending';
      this.nextRetry = new Date(Date.now() + (this.retryCount * 60000)); // Exponential backoff
      await this.save();
      return { success: false, error: error.message, willRetry: true };
    } else {
      this.status = 'failed';
      await this.save();
      return { success: false, error: error.message };
    }
  }
};

// Execute product order
actionSchema.methods.executeOrder = async function() {
  const { order } = this;

  // Simulate order processing
  const orderResult = {
    orderId: `ORD-${Date.now()}`,
    product: order.productName,
    quantity: order.quantity,
    total: order.price * order.quantity,
    status: 'confirmed',
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };

  // TODO: Integrate with real e-commerce APIs
  console.log(`🛒 Order placed: ${order.productName} x${order.quantity}`);

  return orderResult;
};

// Execute payment
actionSchema.methods.executePayment = async function() {
  const { payment } = this;

  // Simulate payment processing
  const paymentResult = {
    transactionId: `TXN-${Date.now()}`,
    amount: payment.amount,
    currency: payment.currency,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  // TODO: Integrate with real payment gateways
  console.log(`💳 Payment processed: ${payment.amount} ${payment.currency}`);

  return paymentResult;
};

// Execute database operation
actionSchema.methods.executeDatabase = async function() {
  const { database } = this;

  // TODO: Implement actual database operations
  const dbResult = {
    operation: database.operation,
    table: database.table,
    affectedRows: 1,
    status: 'completed'
  };

  console.log(`🗄️ Database operation: ${database.operation} on ${database.table}`);

  return dbResult;
};

// Execute API call
actionSchema.methods.executeApiCall = async function() {
  const { api } = this;

  // TODO: Implement actual API calls
  const apiResult = {
    url: api.url,
    method: api.method,
    statusCode: 200,
    response: { success: true }
  };

  console.log(`🌐 API call: ${api.method} ${api.url}`);

  return apiResult;
};

// Execute file operation
actionSchema.methods.executeFileOperation = async function() {
  const { file } = this;

  // TODO: Implement actual file operations
  const fileResult = {
    operation: file.operation,
    path: file.path,
    status: 'completed'
  };

  console.log(`📁 File operation: ${file.operation} ${file.path}`);

  return fileResult;
};

// Execute system command
actionSchema.methods.executeSystemCommand = async function() {
  const { system } = this;

  // TODO: Implement actual system commands
  const systemResult = {
    command: system.command,
    exitCode: 0,
    output: 'Command executed successfully'
  };

  console.log(`⚙️ System command: ${system.command}`);

  return systemResult;
};

// Execute notification
actionSchema.methods.executeNotification = async function() {
  const { notification } = this;

  // TODO: Implement actual notification sending
  const notificationResult = {
    type: notification.type,
    recipient: notification.recipient,
    status: 'sent',
    timestamp: new Date().toISOString()
  };

  console.log(`📢 Notification sent: ${notification.type} to ${notification.recipient}`);

  return notificationResult;
};

// Static methods
actionSchema.statics.findPendingActions = function() {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() }
  }).sort({ priority: 1, scheduledFor: 1 });
};

actionSchema.statics.findUserActions = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;

  return this.find(query).sort({ scheduledFor: -1 });
};

actionSchema.statics.createFromVoice = async function(userId, voiceCommand, actionType, config) {
  return this.create({
    name: `Voice Action: ${voiceCommand.substring(0, 50)}...`,
    description: voiceCommand,
    type: actionType,
    config,
    userId,
    scheduledFor: new Date(),
    priority: 'medium'
  });
};

const Action = mongoose.model('Action', actionSchema);

module.exports = Action;
