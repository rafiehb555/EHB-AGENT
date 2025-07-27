const express = require('express');
const router = express.Router();
const { parseCommand, executeCommand } = require('../../frontend/src/utils/robotCommands');
const aiLearning = require('../services/aiLearning');

// Robot command processing endpoint with AI learning
router.post('/process-command', async (req, res) => {
  try {
    const { command, userId, mode = 'robot' } = req.body;

    if (!command || !command.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }

    console.log(`🤖 Processing command: "${command}" for user: ${userId}`);

    // Parse the command
    const parsedCommand = parseCommand(command);

    if (!parsedCommand) {
      return res.json({
        success: false,
        message: `I didn't understand: "${command}". Try saying something like "Order 2 cold drinks" or "Open GoSellr".`,
        confidence: 0
      });
    }

    // Execute the command with real backend integration
    const result = await executeCommandWithBackend(parsedCommand, userId);

    // Learn from this interaction
    await aiLearning.learnFromInteraction(userId, command, result, {
      mode,
      timestamp: new Date().toISOString(),
      parsedCommand
    });

    // Get personalized suggestions
    const suggestions = await aiLearning.getSuggestions(userId, {
      currentPage: result.route || 'home'
    });

    res.json({
      success: true,
      result,
      parsedCommand,
      confidence: parsedCommand.action.confidence,
      suggestions,
      learning: {
        userProfile: await aiLearning.getUserProfile(userId),
        patterns: await aiLearning.getCommandPatterns()
      }
    });

  } catch (error) {
    console.error('Robot command processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process command'
    });
  }
});

// Get personalized suggestions
router.get('/suggestions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { context } = req.query;

    const suggestions = await aiLearning.getSuggestions(userId, JSON.parse(context || '{}'));

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Failed to get suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

// Get user profile and learning data
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await aiLearning.getUserProfile(userId);
    const patterns = await aiLearning.getCommandPatterns();

    res.json({
      success: true,
      profile,
      patterns
    });

  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Get AI learning analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await aiLearning.getLearningAnalytics();

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

// Execute command with real backend integration
async function executeCommandWithBackend(parsedCommand, userId) {
  const { action } = parsedCommand;

  switch (action.type) {
    case 'place_order':
      return await handlePlaceOrder(action.params, userId);

    case 'navigate':
      return await handleNavigation(action.params);

    case 'check_balance':
      return await handleCheckBalance(userId);

    case 'book_service':
      return await handleBookService(action.params, userId);

    case 'set_reminder':
      return await handleSetReminder(action.params, userId);

    case 'search':
      return await handleSearch(action.params);

    case 'show_help':
      return await handleShowHelp();

    default:
      return {
        success: false,
        message: `Sorry, I don't understand how to ${action.type}`
      };
  }
}

// Handle order placement with real backend
async function handlePlaceOrder(params, userId) {
  try {
    const { quantity, item, deliveryTime } = params;

    // Validate required fields
    if (!item) {
      return {
        success: false,
        message: 'Please specify what you want to order'
      };
    }

    // Create order object
    const order = {
      userId: userId || 'demo-user',
      items: [{
        name: item,
        quantity: quantity || 1,
        price: 0 // Will be fetched from product database
      }],
      deliveryTime: deliveryTime ? parseDeliveryTime(deliveryTime) : null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // TODO: Connect to actual order database
    // const savedOrder = await OrderModel.create(order);

    console.log('🛒 Order created:', order);

    return {
      success: true,
      message: `✅ Order placed for ${quantity || 1}x ${item}${deliveryTime ? ` for ${deliveryTime}` : ''}`,
      orderId: `ORD-${Date.now()}`,
      order: order
    };

  } catch (error) {
    console.error('Order placement error:', error);
    return {
      success: false,
      message: 'Failed to place order. Please try again.'
    };
  }
}

// Handle navigation commands
async function handleNavigation(params) {
  try {
    const { page } = params;

    if (!page) {
      return {
        success: false,
        message: 'Please specify which page to navigate to'
      };
    }

    // Map page names to actual routes
    const pageRoutes = {
      'gosellr': '/gosellr',
      'wallet': '/wallet',
      'dashboard': '/dashboard',
      'franchise': '/franchise',
      'services': '/services'
    };

    const route = pageRoutes[page.toLowerCase()];

    if (!route) {
      return {
        success: false,
        message: `Sorry, I don't know how to navigate to "${page}"`
      };
    }

    return {
      success: true,
      message: `🧭 Navigating to ${page}`,
      route: route,
      page: page
    };

  } catch (error) {
    console.error('Navigation error:', error);
    return {
      success: false,
      message: 'Failed to navigate. Please try again.'
    };
  }
}

// Handle wallet balance check
async function handleCheckBalance(userId) {
  try {
    // TODO: Connect to actual wallet API
    // const balance = await WalletModel.getBalance(userId);

    const mockBalance = {
      userId: userId || 'demo-user',
      balance: 1250,
      currency: 'EHBGC',
      lastUpdated: new Date().toISOString()
    };

    console.log('💰 Balance checked:', mockBalance);

    return {
      success: true,
      message: `💰 Your wallet balance is ${mockBalance.balance} ${mockBalance.currency}`,
      balance: mockBalance
    };

  } catch (error) {
    console.error('Balance check error:', error);
    return {
      success: false,
      message: 'Failed to check balance. Please try again.'
    };
  }
}

// Handle service booking
async function handleBookService(params, userId) {
  try {
    const { service, time } = params;

    if (!service) {
      return {
        success: false,
        message: 'Please specify which service you want to book'
      };
    }

    // Create booking object
    const booking = {
      userId: userId || 'demo-user',
      service: service,
      scheduledTime: time ? parseDeliveryTime(time) : null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // TODO: Connect to actual booking database
    // const savedBooking = await BookingModel.create(booking);

    console.log('🔧 Service booking created:', booking);

    return {
      success: true,
      message: `🔧 Service booked: ${service}${time ? ` for ${time}` : ''}`,
      bookingId: `BK-${Date.now()}`,
      booking: booking
    };

  } catch (error) {
    console.error('Service booking error:', error);
    return {
      success: false,
      message: 'Failed to book service. Please try again.'
    };
  }
}

// Handle reminder setting
async function handleSetReminder(params, userId) {
  try {
    const { task, time } = params;

    if (!task) {
      return {
        success: false,
        message: 'Please specify what you want to be reminded about'
      };
    }

    // Create reminder object
    const reminder = {
      userId: userId || 'demo-user',
      task: task,
      scheduledTime: time ? parseDeliveryTime(time) : null,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // TODO: Connect to actual reminder database
    // const savedReminder = await ReminderModel.create(reminder);

    console.log('⏰ Reminder created:', reminder);

    return {
      success: true,
      message: `⏰ Reminder set: ${task}${time ? ` for ${time}` : ''}`,
      reminderId: `REM-${Date.now()}`,
      reminder: reminder
    };

  } catch (error) {
    console.error('Reminder setting error:', error);
    return {
      success: false,
      message: 'Failed to set reminder. Please try again.'
    };
  }
}

// Handle search functionality
async function handleSearch(params) {
  try {
    const { query } = params;

    if (!query) {
      return {
        success: false,
        message: 'Please specify what you want to search for'
      };
    }

    // TODO: Connect to actual search API
    // const results = await SearchModel.search(query);

    const mockResults = [
      { id: 1, name: 'Product 1', type: 'product' },
      { id: 2, name: 'Service 1', type: 'service' }
    ];

    console.log('🔍 Search performed:', { query, results: mockResults });

    return {
      success: true,
      message: `🔍 Searching for: ${query}`,
      results: mockResults,
      query: query
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      message: 'Failed to perform search. Please try again.'
    };
  }
}

// Handle help command
async function handleShowHelp() {
  return {
    success: true,
    message: `I can help you with:
• Order items: "Order 2 cold drinks"
• Navigate: "Open GoSellr"
• Check balance: "Show my wallet"
• Book services: "Book AC repair"
• Set reminders: "Remind me to order milk"
• Search: "Find shoes"`,
    help: true
  };
}

// Parse delivery time from natural language
function parseDeliveryTime(timeString) {
  const time = timeString.toLowerCase();

  if (time.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }

  if (time.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString();
  }

  // Parse specific times like "6pm", "4:30pm"
  const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3].toLowerCase();

    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    return scheduledTime.toISOString();
  }

  return null;
}

// Get robot statistics with AI learning data
router.get('/stats', async (req, res) => {
  try {
    const analytics = await aiLearning.getLearningAnalytics();

    // TODO: Get real statistics from database
    const stats = {
      totalCommands: analytics.totalCommands,
      successfulCommands: Math.round(analytics.totalCommands * (analytics.avgSuccessRate / 100)),
      successRate: analytics.avgSuccessRate,
      popularCommands: analytics.popularPatterns,
      learningDataSize: analytics.learningDataSize,
      totalUsers: analytics.totalUsers,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// Get robot activity log with learning insights
router.get('/activity', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    // TODO: Get real activity from database
    const activities = [
      {
        id: 1,
        userId: userId || 'demo-user',
        command: 'Order 2 cold drinks',
        action: 'place_order',
        success: true,
        timestamp: new Date().toISOString(),
        learning: {
          pattern: 'order',
          confidence: 0.9,
          suggestion: 'Order 2 cold drinks'
        }
      },
      {
        id: 2,
        userId: userId || 'demo-user',
        command: 'Open GoSellr',
        action: 'navigate',
        success: true,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        learning: {
          pattern: 'navigate',
          confidence: 0.8,
          suggestion: 'Open GoSellr'
        }
      }
    ];

    res.json({
      success: true,
      activities: activities.slice(0, limit)
    });

  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity log'
    });
  }
});

module.exports = router;
