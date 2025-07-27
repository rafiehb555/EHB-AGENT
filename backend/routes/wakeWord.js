const express = require('express');
const router = express.Router();
const wakeWordDetector = require('../services/wakeWordDetector');

// Get wake word status
router.get('/status', async (req, res) => {
  try {
    const status = wakeWordDetector.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Get wake word status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wake word status'
    });
  }
});

// Initialize wake word detector
router.post('/initialize', async (req, res) => {
  try {
    const initialized = await wakeWordDetector.initialize();

    if (initialized) {
      res.json({
        success: true,
        message: 'Wake word detector initialized successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to initialize wake word detector'
      });
    }
  } catch (error) {
    console.error('Initialize wake word detector error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize wake word detector'
    });
  }
});

// Start listening for wake word
router.post('/start', async (req, res) => {
  try {
    await wakeWordDetector.startListening((wakeWord) => {
      console.log(`🎤 Wake word detected via API: ${wakeWord}`);
      // You can emit to WebSocket here for real-time updates
    });

    res.json({
      success: true,
      message: 'Started listening for wake word'
    });
  } catch (error) {
    console.error('Start wake word detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start wake word detection'
    });
  }
});

// Stop listening for wake word
router.post('/stop', async (req, res) => {
  try {
    wakeWordDetector.stopListening();

    res.json({
      success: true,
      message: 'Stopped listening for wake word'
    });
  } catch (error) {
    console.error('Stop wake word detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop wake word detection'
    });
  }
});

// Update wake word
router.put('/wake-word', async (req, res) => {
  try {
    const { wakeWord } = req.body;

    if (!wakeWord) {
      return res.status(400).json({
        success: false,
        error: 'Wake word is required'
      });
    }

    wakeWordDetector.setWakeWord(wakeWord);

    res.json({
      success: true,
      message: `Wake word updated to: ${wakeWord}`
    });
  } catch (error) {
    console.error('Update wake word error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wake word'
    });
  }
});

// Update confidence threshold
router.put('/confidence', async (req, res) => {
  try {
    const { threshold } = req.body;

    if (threshold === undefined || threshold < 0 || threshold > 1) {
      return res.status(400).json({
        success: false,
        error: 'Confidence threshold must be between 0 and 1'
      });
    }

    wakeWordDetector.setConfidenceThreshold(threshold);

    res.json({
      success: true,
      message: `Confidence threshold updated to: ${threshold}`
    });
  } catch (error) {
    console.error('Update confidence threshold error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update confidence threshold'
    });
  }
});

// Get detection statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = wakeWordDetector.getDetectionStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get detection stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get detection statistics'
    });
  }
});

// Test wake word detection
router.post('/test', async (req, res) => {
  try {
    const { audioData, wakeWord } = req.body;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: 'Audio data is required'
      });
    }

    // Convert base64 audio data to blob
    const audioBlob = new Blob([Buffer.from(audioData, 'base64')], { type: 'audio/webm' });

    // Test wake word detection
    const isWakeWord = await wakeWordDetector.analyzeAudioForWakeWord(audioBlob);

    res.json({
      success: true,
      isWakeWord,
      message: isWakeWord ? 'Wake word detected' : 'Wake word not detected'
    });
  } catch (error) {
    console.error('Test wake word detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test wake word detection'
    });
  }
});

// Get wake word settings
router.get('/settings', async (req, res) => {
  try {
    const status = wakeWordDetector.getStatus();

    res.json({
      success: true,
      settings: {
        wakeWord: status.wakeWord,
        confidenceThreshold: status.confidenceThreshold,
        isListening: status.isListening
      }
    });
  } catch (error) {
    console.error('Get wake word settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wake word settings'
    });
  }
});

// Update wake word settings
router.put('/settings', async (req, res) => {
  try {
    const { wakeWord, confidenceThreshold } = req.body;

    if (wakeWord) {
      wakeWordDetector.setWakeWord(wakeWord);
    }

    if (confidenceThreshold !== undefined) {
      wakeWordDetector.setConfidenceThreshold(confidenceThreshold);
    }

    res.json({
      success: true,
      message: 'Wake word settings updated successfully'
    });
  } catch (error) {
    console.error('Update wake word settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wake word settings'
    });
  }
});

// Cleanup wake word detector
router.post('/cleanup', async (req, res) => {
  try {
    wakeWordDetector.cleanup();

    res.json({
      success: true,
      message: 'Wake word detector cleaned up successfully'
    });
  } catch (error) {
    console.error('Cleanup wake word detector error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup wake word detector'
    });
  }
});

module.exports = router;
