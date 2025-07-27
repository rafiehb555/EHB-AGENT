const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Basic task info
  title: {
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
    enum: ['reminder', 'scheduled', 'recurring', 'voice_command', 'ai_task'],
    default: 'reminder'
  },

  // Scheduling
  scheduledFor: {
    type: Date,
    required: true
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      default: 'daily'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: {
      type: Date
    }
  },

  // Execution
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

  // Voice/AI specific
  voiceCommand: {
    type: String,
    trim: true
  },
  aiPrompt: {
    type: String,
    trim: true
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Execution details
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
    result: {
      type: String
    },
    error: {
      type: String
    },
    duration: {
      type: Number // milliseconds
    }
  }],

  // User and permissions
  userId: {
    type: String,
    required: true
  },
  permissions: {
    type: [String],
    default: ['read', 'execute']
  },

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
  },
  lastExecuted: {
    type: Date
  },
  nextExecution: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
taskSchema.index({ userId: 1, scheduledFor: 1 });
taskSchema.index({ status: 1, scheduledFor: 1 });
taskSchema.index({ type: 1, status: 1 });
taskSchema.index({ 'recurring.enabled': 1, nextExecution: 1 });

// Pre-save middleware to update nextExecution
taskSchema.pre('save', function(next) {
  if (this.recurring.enabled && this.status === 'pending') {
    this.updateNextExecution();
  }
  this.updatedAt = new Date();
  next();
});

// Methods
taskSchema.methods.updateNextExecution = function() {
  if (!this.recurring.enabled) return;

  const now = new Date();
  let nextDate = new Date(this.scheduledFor);

  // Calculate next execution based on pattern
  switch (this.recurring.pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + (this.recurring.interval || 1));
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * (this.recurring.interval || 1)));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + (this.recurring.interval || 1));
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + (this.recurring.interval || 1));
      break;
  }

  // Check if we've reached the end date
  if (this.recurring.endDate && nextDate > this.recurring.endDate) {
    this.status = 'completed';
    return;
  }

  this.nextExecution = nextDate;
};

taskSchema.methods.execute = async function() {
  try {
    this.status = 'running';
    this.lastExecuted = new Date();
    await this.save();

    const startTime = Date.now();
    let result = '';
    let status = 'success';

    // Execute based on task type
    switch (this.type) {
      case 'voice_command':
        result = await this.executeVoiceCommand();
        break;
      case 'ai_task':
        result = await this.executeAITask();
        break;
      case 'reminder':
        result = await this.executeReminder();
        break;
      default:
        result = 'Task executed successfully';
    }

    const duration = Date.now() - startTime;

    // Add to execution history
    this.executionHistory.push({
      timestamp: new Date(),
      status,
      result,
      duration
    });

    // Update status and next execution
    if (this.recurring.enabled) {
      this.status = 'pending';
      this.updateNextExecution();
    } else {
      this.status = 'completed';
    }

    await this.save();
    return { success: true, result, duration };

  } catch (error) {
    console.error('Task execution error:', error);

    this.executionHistory.push({
      timestamp: new Date(),
      status: 'failed',
      error: error.message,
      duration: Date.now() - (this.lastExecuted?.getTime() || Date.now())
    });

    this.status = 'failed';
    await this.save();

    return { success: false, error: error.message };
  }
};

taskSchema.methods.executeVoiceCommand = async function() {
  // Execute voice command through AI
  const { processVoiceText } = require('../controllers/aiController');

  const response = await processVoiceText({
    body: {
      message: this.voiceCommand,
      context: this.context
    }
  }, { json: (data) => data });

  return response.reply || 'Voice command executed';
};

taskSchema.methods.executeAITask = async function() {
  // Execute AI task
  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are EHB AI Robot, an advanced AI assistant. Execute the given task efficiently."
      },
      {
        role: "user",
        content: this.aiPrompt
      }
    ],
    max_tokens: 1000
  });

  return completion.choices[0].message.content;
};

taskSchema.methods.executeReminder = async function() {
  // Execute reminder notification
  return `Reminder: ${this.title} - ${this.description}`;
};

// Static methods
taskSchema.statics.findPendingTasks = function() {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() }
  }).sort({ priority: 1, scheduledFor: 1 });
};

taskSchema.statics.findUserTasks = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;

  return this.find(query).sort({ scheduledFor: -1 });
};

taskSchema.statics.createFromVoice = async function(userId, voiceCommand, scheduledFor) {
  return this.create({
    title: `Voice Command: ${voiceCommand.substring(0, 50)}...`,
    description: voiceCommand,
    type: 'voice_command',
    voiceCommand,
    userId,
    scheduledFor,
    priority: 'medium'
  });
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
