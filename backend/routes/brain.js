const express = require('express');
const router = express.Router();
const PersonalBrain = require('../models/PersonalBrain');
const brainTrainer = require('../ai-core/brainTrainer');

// GET: Get user's brain
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const brain = await PersonalBrain.getBrainByUser(userId);

    if (!brain) {
      return res.status(404).json({
        success: false,
        message: 'Brain not found for user'
      });
    }

    res.json({
      success: true,
      data: brain
    });
  } catch (error) {
    console.error('Get brain error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Create or update brain from interaction
router.post('/learn', async (req, res) => {
  try {
    const { userId, interaction } = req.body;

    if (!userId || !interaction) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, interaction'
      });
    }

    const brain = await brainTrainer.learnFromInteraction(userId, interaction);

    res.json({
      success: true,
      message: 'Brain updated successfully',
      data: {
        brainId: brain._id,
        trainingDataPoints: brain.trainingDataPoints,
        lastTrained: brain.lastTrained
      }
    });
  } catch (error) {
    console.error('Learn from interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Generate personalized response
router.post('/generate-response', async (req, res) => {
  try {
    const { userId, input, context = {} } = req.body;

    if (!userId || !input) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, input'
      });
    }

    const response = await brainTrainer.generatePersonalizedResponse(userId, input, context);

    res.json({
      success: true,
      data: {
        response,
        userId,
        input,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Generate response error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT: Update brain preferences
router.put('/user/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    const brain = await PersonalBrain.getBrainByUser(userId);
    if (!brain) {
      return res.status(404).json({
        success: false,
        message: 'Brain not found'
      });
    }

    // Update preferences
    if (preferences.responseLength) brain.preferences.responseLength = preferences.responseLength;
    if (preferences.tone) brain.preferences.tone = preferences.tone;
    if (preferences.language) brain.preferences.language = preferences.language;
    if (preferences.emojiUsage) brain.preferences.emojiUsage = preferences.emojiUsage;
    if (preferences.formality) brain.preferences.formality = preferences.formality;

    await brain.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: brain.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT: Update model configuration
router.put('/user/:userId/model-config', async (req, res) => {
  try {
    const { userId } = req.params;
    const { modelConfig } = req.body;

    const brain = await PersonalBrain.getBrainByUser(userId);
    if (!brain) {
      return res.status(404).json({
        success: false,
        message: 'Brain not found'
      });
    }

    // Update model configuration
    if (modelConfig.temperature !== undefined) brain.modelConfig.temperature = modelConfig.temperature;
    if (modelConfig.maxTokens !== undefined) brain.modelConfig.maxTokens = modelConfig.maxTokens;
    if (modelConfig.topP !== undefined) brain.modelConfig.topP = modelConfig.topP;
    if (modelConfig.instructionTuning) brain.modelConfig.instructionTuning = modelConfig.instructionTuning;
    if (modelConfig.customPrompts) brain.modelConfig.customPrompts = modelConfig.customPrompts;

    await brain.save();

    res.json({
      success: true,
      message: 'Model configuration updated successfully',
      data: brain.modelConfig
    });
  } catch (error) {
    console.error('Update model config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Export brain
router.post('/user/:userId/export', async (req, res) => {
  try {
    const { userId } = req.params;

    const brainData = await brainTrainer.exportBrain(userId);

    res.json({
      success: true,
      message: 'Brain exported successfully',
      data: brainData
    });
  } catch (error) {
    console.error('Export brain error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Import brain
router.post('/user/:userId/import', async (req, res) => {
  try {
    const { userId } = req.params;
    const { brainData } = req.body;

    if (!brainData) {
      return res.status(400).json({
        success: false,
        message: 'Missing brain data'
      });
    }

    const brain = await brainTrainer.importBrain(userId, brainData);

    res.json({
      success: true,
      message: 'Brain imported successfully',
      data: {
        brainId: brain._id,
        brainVersion: brain.brainVersion,
        trainingDataPoints: brain.trainingDataPoints
      }
    });
  } catch (error) {
    console.error('Import brain error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get brain statistics
router.get('/user/:userId/statistics', async (req, res) => {
  try {
    const { userId } = req.params;
    const brain = await PersonalBrain.getBrainByUser(userId);

    if (!brain) {
      return res.status(404).json({
        success: false,
        message: 'Brain not found'
      });
    }

    const stats = {
      brainAge: brain.brainAge,
      trainingProgress: brain.trainingProgress,
      totalInteractions: brain.interactionStats.totalInteractions,
      successfulInteractions: brain.interactionStats.successfulInteractions,
      successRate: brain.interactionStats.totalInteractions > 0
        ? (brain.interactionStats.successfulInteractions / brain.interactionStats.totalInteractions * 100).toFixed(1)
        : 0,
      averageResponseTime: brain.interactionStats.averageResponseTime,
      accuracyScore: brain.performance.accuracyScore,
      userSatisfaction: brain.performance.userSatisfaction,
      learningRate: brain.performance.learningRate,
      topIntents: brain.learnedPatterns.commonIntents.slice(0, 5),
      topCommands: brain.learnedPatterns.preferredCommands.slice(0, 5),
      primaryDomains: brain.expertise.primaryDomains,
      learnedSkills: brain.expertise.learnedSkills
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get brain statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Train brain manually
router.post('/user/:userId/train', async (req, res) => {
  try {
    const { userId } = req.params;
    const brain = await PersonalBrain.getBrainByUser(userId);

    if (!brain) {
      return res.status(404).json({
        success: false,
        message: 'Brain not found'
      });
    }

    // Trigger manual training
    await brainTrainer.triggerTraining(brain);

    res.json({
      success: true,
      message: 'Brain training completed',
      data: {
        brainId: brain._id,
        trainingDataPoints: brain.trainingDataPoints,
        lastTrained: brain.lastTrained
      }
    });
  } catch (error) {
    console.error('Manual training error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE: Reset brain
router.delete('/user/:userId/reset', async (req, res) => {
  try {
    const { userId } = req.params;
    const brain = await PersonalBrain.getBrainByUser(userId);

    if (!brain) {
      return res.status(404).json({
        success: false,
        message: 'Brain not found'
      });
    }

    // Reset brain to default state
    brain.trainingDataPoints = 0;
    brain.learnedPatterns = {
      commonIntents: [],
      preferredCommands: [],
      rejectedSuggestions: [],
      vocabulary: {
        favoriteWords: [],
        avoidedWords: [],
        customTerms: []
      }
    };
    brain.interactionStats = {
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      averageResponseTime: 0,
      mostActiveHours: [],
      favoriteFeatures: []
    };
    brain.performance = {
      accuracyScore: 0,
      userSatisfaction: 0,
      learningRate: 0,
      lastEvaluation: new Date()
    };

    await brain.save();

    res.json({
      success: true,
      message: 'Brain reset successfully'
    });
  } catch (error) {
    console.error('Reset brain error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get all brains (admin only)
router.get('/all', async (req, res) => {
  try {
    const brains = await PersonalBrain.find({}).select('userId walletAddress brainVersion trainingDataPoints lastTrained performance');

    res.json({
      success: true,
      data: {
        brains,
        total: brains.length
      }
    });
  } catch (error) {
    console.error('Get all brains error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
