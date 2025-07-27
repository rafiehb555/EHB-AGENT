const express = require('express');
const router = express.Router();
const actionEngine = require('../services/actionEngine');
const Action = require('../models/Action');
const { processVoiceText } = require('../controllers/aiController');

// Helper function to extract user ID
const getUserId = (req) => {
  return req.headers['user-id'] || 'default-user';
};

// Get all actions for a user
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status, type, limit = 50, page = 1 } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const actions = await Action.find(query)
      .sort({ scheduledFor: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Action.countDocuments(query);

    res.json({
      success: true,
      actions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get actions'
    });
  }
});

// Get a specific action
router.get('/:actionId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { actionId } = req.params;

    const action = await Action.findOne({ _id: actionId, userId });

    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    res.json({
      success: true,
      action
    });
  } catch (error) {
    console.error('Get action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get action'
    });
  }
});

// Create action from voice command
router.post('/voice', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { voiceCommand, context = {} } = req.body;

    if (!voiceCommand) {
      return res.status(400).json({
        success: false,
        error: 'Voice command is required'
      });
    }

    console.log(`🎤 Processing voice command: "${voiceCommand}"`);

    const action = await actionEngine.parseVoiceCommand(userId, voiceCommand);

    res.status(201).json({
      success: true,
      action,
      message: 'Action created from voice command'
    });
  } catch (error) {
    console.error('Create voice action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create action from voice command'
    });
  }
});

// Create a new action manually
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      name,
      description,
      type,
      config = {},
      scheduledFor,
      priority = 'medium',
      requiresConfirmation = false,
      order,
      payment,
      database,
      api,
      file,
      system,
      notification
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }

    const actionData = {
      name,
      description,
      type,
      config,
      userId,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      priority,
      requiresConfirmation
    };

    // Add type-specific data
    if (order) actionData.order = order;
    if (payment) actionData.payment = payment;
    if (database) actionData.database = database;
    if (api) actionData.api = api;
    if (file) actionData.file = file;
    if (system) actionData.system = system;
    if (notification) actionData.notification = notification;

    const action = new Action(actionData);
    await action.save();

    res.status(201).json({
      success: true,
      action,
      message: 'Action created successfully'
    });
  } catch (error) {
    console.error('Create action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create action'
    });
  }
});

// Execute action immediately
router.post('/:actionId/execute', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { actionId } = req.params;

    const result = await actionEngine.executeAction(actionId, userId);

    res.json({
      success: true,
      result,
      message: 'Action executed successfully'
    });
  } catch (error) {
    console.error('Execute action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute action'
    });
  }
});

// Update action
router.put('/:actionId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { actionId } = req.params;
    const updates = req.body;

    const action = await Action.findOne({ _id: actionId, userId });

    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    Object.assign(action, updates);
    await action.save();

    res.json({
      success: true,
      action,
      message: 'Action updated successfully'
    });
  } catch (error) {
    console.error('Update action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update action'
    });
  }
});

// Cancel action
router.delete('/:actionId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { actionId } = req.params;

    const action = await Action.findOne({ _id: actionId, userId });

    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    action.status = 'cancelled';
    await action.save();

    res.json({
      success: true,
      action,
      message: 'Action cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel action'
    });
  }
});

// Get action statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = getUserId(req);

    const stats = await Action.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalActions = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      stats: {
        total: totalActions,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        engineStatus: actionEngine.getStatus()
      }
    });
  } catch (error) {
    console.error('Get action stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get action statistics'
    });
  }
});

// Get pending actions
router.get('/pending/list', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { limit = 10 } = req.query;

    const pendingActions = await Action.find({
      userId,
      status: 'pending',
      scheduledFor: { $lte: new Date() }
    })
    .sort({ priority: 1, scheduledFor: 1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      actions: pendingActions
    });
  } catch (error) {
    console.error('Get pending actions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending actions'
    });
  }
});

// Get action history
router.get('/:actionId/history', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { actionId } = req.params;

    const action = await Action.findOne({ _id: actionId, userId });

    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    res.json({
      success: true,
      history: action.executionHistory
    });
  } catch (error) {
    console.error('Get action history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get action history'
    });
  }
});

// Bulk operations
router.post('/bulk/execute', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { actionIds } = req.body;

    if (!actionIds || !Array.isArray(actionIds)) {
      return res.status(400).json({
        success: false,
        error: 'Action IDs array is required'
      });
    }

    const results = [];

    for (const actionId of actionIds) {
      try {
        const result = await actionEngine.executeAction(actionId, userId);
        results.push({ actionId, success: true, result });
      } catch (error) {
        results.push({ actionId, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      results,
      message: `${results.filter(r => r.success).length} actions executed`
    });
  } catch (error) {
    console.error('Bulk execute actions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk execute actions'
    });
  }
});

// Test action types
router.post('/test/order', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productName, quantity = 1, price = 100 } = req.body;

    const action = new Action({
      name: `Test Order: ${productName}`,
      description: `Test order for ${productName}`,
      type: 'order',
      userId,
      scheduledFor: new Date(),
      order: {
        productName,
        quantity,
        price,
        vendor: 'Test Vendor',
        deliveryAddress: 'Test Address',
        paymentMethod: 'Test Payment'
      }
    });

    await action.save();

    const result = await action.execute();

    res.json({
      success: true,
      action,
      result,
      message: 'Test order executed successfully'
    });
  } catch (error) {
    console.error('Test order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute test order'
    });
  }
});

// Test payment
router.post('/test/payment', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amount, recipient, description = 'Test Payment' } = req.body;

    const action = new Action({
      name: `Test Payment: ${amount} to ${recipient}`,
      description,
      type: 'payment',
      userId,
      scheduledFor: new Date(),
      payment: {
        amount,
        currency: 'INR',
        method: 'Test Method',
        recipient,
        description
      }
    });

    await action.save();

    const result = await action.execute();

    res.json({
      success: true,
      action,
      result,
      message: 'Test payment executed successfully'
    });
  } catch (error) {
    console.error('Test payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute test payment'
    });
  }
});

module.exports = router;
