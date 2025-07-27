const Action = require('../models/Action');
const { processVoiceText } = require('../controllers/aiController');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class ActionEngine {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.actionHandlers = new Map();
    this.registerDefaultHandlers();
  }

  // Register default action handlers
  registerDefaultHandlers() {
    this.actionHandlers.set('order', this.handleOrder.bind(this));
    this.actionHandlers.set('payment', this.handlePayment.bind(this));
    this.actionHandlers.set('database', this.handleDatabase.bind(this));
    this.actionHandlers.set('api_call', this.handleApiCall.bind(this));
    this.actionHandlers.set('file_operation', this.handleFileOperation.bind(this));
    this.actionHandlers.set('system_command', this.handleSystemCommand.bind(this));
    this.actionHandlers.set('notification', this.handleNotification.bind(this));
  }

  // Start the action engine
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Action engine is already running');
      return;
    }

    console.log('🚀 Starting EHB AI Robot Action Engine...');
    this.isRunning = true;

    // Start the action checker
    this.startActionChecker();

    console.log('✅ Action engine started successfully');
  }

  // Stop the action engine
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Action engine is not running');
      return;
    }

    console.log('🛑 Stopping Action Engine...');
    this.isRunning = false;

    // Clear check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('✅ Action engine stopped');
  }

  // Start the action checker (runs every 30 seconds)
  startActionChecker() {
    this.checkInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.checkAndExecuteActions();
      } catch (error) {
        console.error('❌ Action checker error:', error);
      }
    }, 30000); // Check every 30 seconds

    console.log('⚡ Action checker started (30s intervals)');
  }

  // Check and execute pending actions
  async checkAndExecuteActions() {
    try {
      const pendingActions = await Action.findPendingActions();

      if (pendingActions.length === 0) {
        return;
      }

      console.log(`🔍 Found ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        try {
          console.log(`⚡ Executing action: ${action.name} (${action.type})`);

          const result = await action.execute();

          if (result.success) {
            console.log(`✅ Action executed successfully: ${action.name}`);
            console.log(`📊 Duration: ${result.duration}ms`);

            // Send notification if needed
            await this.sendActionNotification(action, result);
          } else {
            console.error(`❌ Action execution failed: ${action.name}`);
            console.error(`🔍 Error: ${result.error}`);
          }
        } catch (error) {
          console.error(`❌ Error executing action ${action.name}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error checking actions:', error);
    }
  }

  // Parse voice command and create action
  async parseVoiceCommand(userId, voiceCommand) {
    try {
      console.log(`🎤 Parsing voice command: "${voiceCommand}"`);

      // Use AI to determine action type and extract parameters
      const actionInfo = await this.analyzeVoiceCommand(voiceCommand);

      if (!actionInfo.type) {
        throw new Error('Could not determine action type from voice command');
      }

      // Create action based on parsed information
      const action = await this.createActionFromVoice(userId, voiceCommand, actionInfo);

      console.log(`✅ Action created: ${action.name} (${action.type})`);

      return action;
    } catch (error) {
      console.error('❌ Error parsing voice command:', error);
      throw error;
    }
  }

  // Analyze voice command using AI
  async analyzeVoiceCommand(voiceCommand) {
    try {
      const prompt = `
      Analyze this voice command and determine what action should be performed:
      Voice Command: "${voiceCommand}"

      Return a JSON object with:
      {
        "type": "order|payment|database|api_call|file_operation|system_command|notification",
        "confidence": 0.0-1.0,
        "parameters": {
          // Action-specific parameters
        },
        "requiresConfirmation": boolean,
        "priority": "low|medium|high|urgent"
      }

      Examples:
      - "order cold drink" → type: "order", parameters: {product: "cold drink"}
      - "pay 500 rupees to John" → type: "payment", parameters: {amount: 500, recipient: "John"}
      - "backup database" → type: "database", parameters: {operation: "backup"}
      - "send email to boss" → type: "notification", parameters: {type: "email", recipient: "boss"}
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an action parser for an AI robot. Analyze voice commands and determine what real-world actions should be performed."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;
      const actionInfo = JSON.parse(response);

      return actionInfo;
    } catch (error) {
      console.error('Error analyzing voice command:', error);
      throw new Error('Failed to analyze voice command');
    }
  }

  // Create action from voice command
  async createActionFromVoice(userId, voiceCommand, actionInfo) {
    const actionData = {
      name: `Voice Action: ${voiceCommand.substring(0, 50)}...`,
      description: voiceCommand,
      type: actionInfo.type,
      userId,
      scheduledFor: new Date(),
      priority: actionInfo.priority || 'medium',
      requiresConfirmation: actionInfo.requiresConfirmation || false,
      config: actionInfo.parameters || {}
    };

    // Add action-specific data based on type
    switch (actionInfo.type) {
      case 'order':
        actionData.order = {
          productName: actionInfo.parameters.product || 'Unknown Product',
          quantity: actionInfo.parameters.quantity || 1,
          price: actionInfo.parameters.price || 0,
          vendor: actionInfo.parameters.vendor || 'Default Vendor',
          deliveryAddress: actionInfo.parameters.address || 'Default Address',
          paymentMethod: actionInfo.parameters.paymentMethod || 'Default Payment'
        };
        break;

      case 'payment':
        actionData.payment = {
          amount: actionInfo.parameters.amount || 0,
          currency: actionInfo.parameters.currency || 'INR',
          method: actionInfo.parameters.method || 'Default Method',
          recipient: actionInfo.parameters.recipient || 'Unknown Recipient',
          description: actionInfo.parameters.description || 'Payment'
        };
        break;

      case 'database':
        actionData.database = {
          operation: actionInfo.parameters.operation || 'query',
          table: actionInfo.parameters.table || 'default_table',
          query: actionInfo.parameters.query || '',
          data: actionInfo.parameters.data || {}
        };
        break;

      case 'notification':
        actionData.notification = {
          type: actionInfo.parameters.type || 'email',
          recipient: actionInfo.parameters.recipient || 'Unknown',
          subject: actionInfo.parameters.subject || 'Notification',
          message: actionInfo.parameters.message || voiceCommand,
          template: actionInfo.parameters.template || 'default'
        };
        break;
    }

    const action = new Action(actionData);
    await action.save();

    return action;
  }

  // Execute action immediately
  async executeAction(actionId, userId) {
    try {
      const action = await Action.findOne({ _id: actionId, userId });

      if (!action) {
        throw new Error('Action not found or access denied');
      }

      console.log(`⚡ Executing action immediately: ${action.name}`);

      const result = await action.execute();

      return result;
    } catch (error) {
      console.error('Error executing action:', error);
      throw error;
    }
  }

  // Handle order actions
  async handleOrder(action) {
    const { order } = action;

    // Simulate order processing with real e-commerce integration
    const orderResult = {
      orderId: `ORD-${Date.now()}`,
      product: order.productName,
      quantity: order.quantity,
      total: order.price * order.quantity,
      status: 'confirmed',
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      trackingNumber: `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    // TODO: Integrate with real e-commerce APIs (Amazon, Flipkart, etc.)
    console.log(`🛒 Order placed: ${order.productName} x${order.quantity}`);
    console.log(`📦 Tracking: ${orderResult.trackingNumber}`);

    return orderResult;
  }

  // Handle payment actions
  async handlePayment(action) {
    const { payment } = action;

    // Simulate payment processing with real payment gateway integration
    const paymentResult = {
      transactionId: `TXN-${Date.now()}`,
      amount: payment.amount,
      currency: payment.currency,
      status: 'completed',
      timestamp: new Date().toISOString(),
      gateway: 'Stripe', // TODO: Integrate with real payment gateways
      fee: payment.amount * 0.029 + 0.30 // Example fee calculation
    };

    // TODO: Integrate with real payment gateways (Stripe, PayPal, etc.)
    console.log(`💳 Payment processed: ${payment.amount} ${payment.currency}`);
    console.log(`💰 Transaction ID: ${paymentResult.transactionId}`);

    return paymentResult;
  }

  // Handle database actions
  async handleDatabase(action) {
    const { database } = action;

    // Simulate database operations
    const dbResult = {
      operation: database.operation,
      table: database.table,
      affectedRows: 1,
      status: 'completed',
      executionTime: Math.random() * 1000 + 50 // Random execution time
    };

    // TODO: Implement actual database operations
    console.log(`🗄️ Database operation: ${database.operation} on ${database.table}`);

    return dbResult;
  }

  // Handle API call actions
  async handleApiCall(action) {
    const { api } = action;

    // Simulate API calls
    const apiResult = {
      url: api.url,
      method: api.method,
      statusCode: 200,
      response: { success: true, data: 'API call successful' },
      responseTime: Math.random() * 2000 + 100
    };

    // TODO: Implement actual API calls
    console.log(`🌐 API call: ${api.method} ${api.url}`);

    return apiResult;
  }

  // Handle file operation actions
  async handleFileOperation(action) {
    const { file } = action;

    // Simulate file operations
    const fileResult = {
      operation: file.operation,
      path: file.path,
      status: 'completed',
      size: Math.floor(Math.random() * 1000000) + 1000
    };

    // TODO: Implement actual file operations
    console.log(`📁 File operation: ${file.operation} ${file.path}`);

    return fileResult;
  }

  // Handle system command actions
  async handleSystemCommand(action) {
    const { system } = action;

    // Simulate system commands
    const systemResult = {
      command: system.command,
      exitCode: 0,
      output: 'Command executed successfully',
      executionTime: Math.random() * 5000 + 100
    };

    // TODO: Implement actual system commands (with security considerations)
    console.log(`⚙️ System command: ${system.command}`);

    return systemResult;
  }

  // Handle notification actions
  async handleNotification(action) {
    const { notification } = action;

    // Simulate notification sending
    const notificationResult = {
      type: notification.type,
      recipient: notification.recipient,
      status: 'sent',
      timestamp: new Date().toISOString(),
      messageId: `MSG-${Date.now()}`
    };

    // TODO: Implement actual notification sending (email, SMS, push, etc.)
    console.log(`📢 Notification sent: ${notification.type} to ${notification.recipient}`);

    return notificationResult;
  }

  // Send action notification
  async sendActionNotification(action, result) {
    try {
      // TODO: Implement notification system
      console.log(`📢 Action notification: ${action.name} - ${result.result ? 'Success' : 'Failed'}`);

      return true;
    } catch (error) {
      console.error('❌ Error sending action notification:', error);
      return false;
    }
  }

  // Get action engine status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: new Date().toISOString()
    };
  }

  // Get action statistics
  async getStatistics() {
    try {
      const stats = await Action.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalActions = stats.reduce((sum, stat) => sum + stat.count, 0);

      return {
        total: totalActions,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        engineStatus: this.getStatus()
      };
    } catch (error) {
      console.error('❌ Error getting action statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const actionEngine = new ActionEngine();

module.exports = actionEngine;
