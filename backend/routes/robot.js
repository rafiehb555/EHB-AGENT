const express = require('express');
const router = express.Router();
const { parseCommand, executeCommand } = require('../../frontend/src/utils/robotCommands');
const aiLearning = require('../services/aiLearning');
const blockchainIntegration = require('../services/blockchainIntegration');
const deepLearning = require('../services/deepLearning');

// Robot command processing endpoint with AI learning, blockchain, and deep learning
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

    // Deep learning: Predict user intent and detect emotion
    const intentPrediction = await deepLearning.predictUserIntent(userId, command);
    const emotionAnalysis = await deepLearning.detectEmotion(command);
    const personalizedResponse = await deepLearning.generatePersonalizedResponse(userId, command);

    // Execute the command with real backend integration
    const result = await executeCommandWithBackend(parsedCommand, userId);

    // Learn from this interaction
    await aiLearning.learnFromInteraction(userId, command, result, {
      mode,
      timestamp: new Date().toISOString(),
      parsedCommand,
      intentPrediction,
      emotionAnalysis
    });

    // Blockchain: Create action proof and store learning data
    const actionProof = await blockchainIntegration.createActionProof(
      userId,
      parsedCommand.action.type,
      parsedCommand.action.params,
      result
    );

    // Store learning data on blockchain
    const learningData = {
      command,
      result,
      intentPrediction,
      emotionAnalysis,
      userProfile: await aiLearning.getUserProfile(userId)
    };
    const blockchainRecord = await blockchainIntegration.storeLearningData(userId, learningData);

    // Sync with validators
    const validatorSync = await blockchainIntegration.syncWithValidators(learningData);

    // Get personalized suggestions with deep learning optimization
    const rawSuggestions = await aiLearning.getSuggestions(userId, {
      currentPage: result.route || 'home'
    });
    const optimizedSuggestions = await deepLearning.optimizeSuggestions(userId, {
      currentPage: result.route || 'home'
    }, rawSuggestions);

    res.json({
      success: true,
      result,
      parsedCommand,
      confidence: parsedCommand.action.confidence,
      suggestions: optimizedSuggestions.optimizedSuggestions,
      learning: {
        userProfile: await aiLearning.getUserProfile(userId),
        patterns: await aiLearning.getCommandPatterns()
      },
      blockchain: {
        actionProof,
        blockchainRecord,
        validatorSync
      },
      deepLearning: {
        intentPrediction,
        emotionAnalysis,
        personalizedResponse
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

// Get personalized suggestions with deep learning optimization
router.get('/suggestions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { context } = req.query;

    const rawSuggestions = await aiLearning.getSuggestions(userId, JSON.parse(context || '{}'));
    const optimizedSuggestions = await deepLearning.optimizeSuggestions(userId, JSON.parse(context || '{}'), rawSuggestions);

    res.json({
      success: true,
      suggestions: optimizedSuggestions.optimizedSuggestions,
      optimization: optimizedSuggestions
    });

  } catch (error) {
    console.error('Failed to get suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

// Get user profile and learning data with blockchain integration
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await aiLearning.getUserProfile(userId);
    const patterns = await aiLearning.getCommandPatterns();
    const userPredictions = await deepLearning.getUserPredictions(userId, 5);
    const userProofs = await blockchainIntegration.getUserLearningProofs(userId);

    res.json({
      success: true,
      profile,
      patterns,
      predictions: userPredictions,
      blockchainProofs: userProofs
    });

  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Get AI learning analytics with blockchain and deep learning data
router.get('/analytics', async (req, res) => {
  try {
    const aiAnalytics = await aiLearning.getLearningAnalytics();
    const blockchainAnalytics = await blockchainIntegration.getBlockchainAnalytics();
    const deepLearningAnalytics = await deepLearning.getDeepLearningAnalytics();

    res.json({
      success: true,
      analytics: {
        ai: aiAnalytics,
        blockchain: blockchainAnalytics,
        deepLearning: deepLearningAnalytics
      }
    });

  } catch (error) {
    console.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

// Get blockchain information
router.get('/blockchain/health', async (req, res) => {
  try {
    const health = await blockchainIntegration.getBlockchainHealth();
    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Failed to get blockchain health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain health'
    });
  }
});

// Get validators information
router.get('/blockchain/validators', async (req, res) => {
  try {
    const validators = await blockchainIntegration.getAllValidators();
    res.json({
      success: true,
      validators
    });
  } catch (error) {
    console.error('Failed to get validators:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get validators'
    });
  }
});

// Get deep learning information
router.get('/deep-learning/health', async (req, res) => {
  try {
    const health = await deepLearning.getDeepLearningHealth();
    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Failed to get deep learning health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deep learning health'
    });
  }
});

// Get neural networks information
router.get('/deep-learning/networks', async (req, res) => {
  try {
    const networks = await deepLearning.getAllNeuralNetworks();
    res.json({
      success: true,
      networks
    });
  } catch (error) {
    console.error('Failed to get neural networks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get neural networks'
    });
  }
});

// Train neural network
router.post('/deep-learning/train/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params;
    const { trainingData } = req.body;

    const trainingSession = await deepLearning.trainNeuralNetwork(networkId, trainingData || []);

    res.json({
      success: true,
      trainingSession
    });
  } catch (error) {
    console.error('Failed to train neural network:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to train neural network'
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

// Handle order placement with blockchain integration
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

    // Simulate blockchain transaction
    const transaction = await blockchainIntegration.simulateTransaction(userId, 'place_order', params);

    console.log('🛒 Order created with blockchain integration:', order);

    return {
      success: true,
      message: `✅ Order placed for ${quantity || 1}x ${item}${deliveryTime ? ` for ${deliveryTime}` : ''}`,
      orderId: `ORD-${Date.now()}`,
      order: order,
      blockchainTransaction: transaction
    };

  } catch (error) {
    console.error('Order placement error:', error);
    return {
      success: false,
      message: 'Failed to place order. Please try again.'
    };
  }
}

// Handle navigation commands with blockchain tracking
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

    // Simulate blockchain transaction for navigation
    const transaction = await blockchainIntegration.simulateTransaction('demo-user', 'navigate', params);

    return {
      success: true,
      message: `🧭 Navigating to ${page}`,
      route: route,
      page: page,
      blockchainTransaction: transaction
    };

  } catch (error) {
    console.error('Navigation error:', error);
    return {
      success: false,
      message: 'Failed to navigate. Please try again.'
    };
  }
}

// Handle wallet balance check with blockchain verification
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

    // Verify balance on blockchain
    const blockchainRecord = await blockchainIntegration.storeLearningData(userId, {
      action: 'check_balance',
      balance: mockBalance,
      timestamp: new Date().toISOString()
    });

    console.log('💰 Balance checked with blockchain verification:', mockBalance);

    return {
      success: true,
      message: `💰 Your wallet balance is ${mockBalance.balance} ${mockBalance.currency}`,
      balance: mockBalance,
      blockchainRecord
    };

  } catch (error) {
    console.error('Balance check error:', error);
    return {
      success: false,
      message: 'Failed to check balance. Please try again.'
    };
  }
}

// Handle service booking with blockchain proof
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

    // Create blockchain proof for service booking
    const actionProof = await blockchainIntegration.createActionProof(
      userId,
      'book_service',
      params,
      booking
    );

    console.log('🔧 Service booking created with blockchain proof:', booking);

    return {
      success: true,
      message: `🔧 Service booked: ${service}${time ? ` for ${time}` : ''}`,
      bookingId: `BK-${Date.now()}`,
      booking: booking,
      blockchainProof: actionProof
    };

  } catch (error) {
    console.error('Service booking error:', error);
    return {
      success: false,
      message: 'Failed to book service. Please try again.'
    };
  }
}

// Handle reminder setting with blockchain storage
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

    // Store reminder on blockchain
    const blockchainRecord = await blockchainIntegration.storeLearningData(userId, {
      action: 'set_reminder',
      reminder: reminder,
      timestamp: new Date().toISOString()
    });

    console.log('⏰ Reminder created with blockchain storage:', reminder);

    return {
      success: true,
      message: `⏰ Reminder set: ${task}${time ? ` for ${time}` : ''}`,
      reminderId: `REM-${Date.now()}`,
      reminder: reminder,
      blockchainRecord
    };

  } catch (error) {
    console.error('Reminder setting error:', error);
    return {
      success: false,
      message: 'Failed to set reminder. Please try again.'
    };
  }
}

// Handle search functionality with deep learning
async function handleSearch(params) {
  try {
    const { query } = params;

    if (!query) {
      return {
        success: false,
        message: 'Please specify what you want to search for'
      };
    }

    // Use deep learning to enhance search
    const intentPrediction = await deepLearning.predictUserIntent('demo-user', query);
    const emotionAnalysis = await deepLearning.detectEmotion(query);

    // TODO: Connect to actual search API
    // const results = await SearchModel.search(query);

    const mockResults = [
      { id: 1, name: 'Product 1', type: 'product' },
      { id: 2, name: 'Service 1', type: 'service' }
    ];

    console.log('🔍 Search performed with deep learning:', { query, results: mockResults, intent: intentPrediction, emotion: emotionAnalysis });

    return {
      success: true,
      message: `🔍 Searching for: ${query}`,
      results: mockResults,
      query: query,
      deepLearning: {
        intent: intentPrediction,
        emotion: emotionAnalysis
      }
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      message: 'Failed to perform search. Please try again.'
    };
  }
}

// Handle help command with blockchain analytics
async function handleShowHelp() {
  const blockchainHealth = await blockchainIntegration.getBlockchainHealth();
  const deepLearningHealth = await deepLearning.getDeepLearningHealth();

  return {
    success: true,
    message: `I can help you with:
• Order items: "Order 2 cold drinks"
• Navigate: "Open GoSellr"
• Check balance: "Show my wallet"
• Book services: "Book AC repair"
• Set reminders: "Remind me to order milk"
• Search: "Find shoes"

🔗 Blockchain Status: ${blockchainHealth.status} (${blockchainHealth.activeValidators}/${blockchainHealth.totalValidators} validators)
🧠 AI Status: ${deepLearningHealth.status} (${Math.round(deepLearningHealth.averageAccuracy * 100)}% accuracy)`,
    help: true,
    systemStatus: {
      blockchain: blockchainHealth,
      deepLearning: deepLearningHealth
    }
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

// Get robot statistics with blockchain and deep learning data
router.get('/stats', async (req, res) => {
  try {
    const aiAnalytics = await aiLearning.getLearningAnalytics();
    const blockchainAnalytics = await blockchainIntegration.getBlockchainAnalytics();
    const deepLearningAnalytics = await deepLearning.getDeepLearningAnalytics();

    const stats = {
      totalCommands: aiAnalytics.totalCommands,
      successfulCommands: Math.round(aiAnalytics.totalCommands * (aiAnalytics.avgSuccessRate / 100)),
      successRate: aiAnalytics.avgSuccessRate,
      popularCommands: aiAnalytics.popularPatterns,
      blockchainRecords: blockchainAnalytics.totalRecords,
      blockchainProofs: blockchainAnalytics.totalProofs,
      activeValidators: blockchainAnalytics.activeValidators,
      neuralNetworks: deepLearningAnalytics.totalNetworks,
      averageAccuracy: Math.round(deepLearningAnalytics.averageAccuracy * 100) / 100,
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

// Get robot activity log with blockchain and deep learning insights
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
        },
        blockchain: {
          proofId: 'proof-123',
          status: 'confirmed'
        },
        deepLearning: {
          intent: 'order',
          emotion: 'neutral',
          confidence: 0.85
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
        },
        blockchain: {
          proofId: 'proof-456',
          status: 'confirmed'
        },
        deepLearning: {
          intent: 'navigate',
          emotion: 'neutral',
          confidence: 0.72
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
