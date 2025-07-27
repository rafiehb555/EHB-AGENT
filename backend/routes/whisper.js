const express = require('express');
const router = express.Router();
const whisperService = require('../services/whisperService');
const path = require('path');

// Configure multer for file uploads
const upload = whisperService.configureMulter();

// Transcribe single audio file
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const {
      language = 'en',
      prompt = '',
      responseFormat = 'json',
      temperature = 0,
      withTimestamps = false
    } = req.body;

    const filePath = req.file.path;
    const options = {
      language,
      prompt,
      responseFormat,
      temperature: parseFloat(temperature)
    };

    let result;
    if (withTimestamps === 'true') {
      result = await whisperService.transcribeWithTimestamps(filePath, options);
    } else {
      result = await whisperService.transcribeAudio(filePath, options);
    }

    // Clean up uploaded file
    await whisperService.cleanupFiles([filePath]);

    if (result.success) {
      res.json({
        success: true,
        transcription: result.text,
        language: result.language,
        duration: result.duration,
        segments: result.segments,
        words: result.words,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio'
    });
  }
});

// Batch transcribe multiple audio files
router.post('/batch-transcribe', upload.array('audio', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No audio files provided'
      });
    }

    const {
      language = 'en',
      prompt = '',
      responseFormat = 'json',
      temperature = 0
    } = req.body;

    const filePaths = req.files.map(file => file.path);
    const options = {
      language,
      prompt,
      responseFormat,
      temperature: parseFloat(temperature)
    };

    const result = await whisperService.batchTranscribe(filePaths, options);

    // Clean up uploaded files
    await whisperService.cleanupFiles(filePaths);

    if (result.success) {
      res.json({
        success: true,
        results: result.results,
        totalFiles: result.totalFiles,
        successfulTranscriptions: result.successfulTranscriptions,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Batch transcribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch transcribe audio files'
    });
  }
});

// Detect language from audio
router.post('/detect-language', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const filePath = req.file.path;
    const result = await whisperService.detectLanguage(filePath);

    // Clean up uploaded file
    await whisperService.cleanupFiles([filePath]);

    if (result.success) {
      res.json({
        success: true,
        language: result.language,
        languageProbability: result.languageProbability,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect language'
    });
  }
});

// Transcribe with timestamps
router.post('/transcribe-timestamps', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const {
      language = 'en',
      prompt = '',
      responseFormat = 'verbose_json',
      temperature = 0
    } = req.body;

    const filePath = req.file.path;
    const options = {
      language,
      prompt,
      responseFormat,
      temperature: parseFloat(temperature)
    };

    const result = await whisperService.transcribeWithTimestamps(filePath, options);

    // Clean up uploaded file
    await whisperService.cleanupFiles([filePath]);

    if (result.success) {
      res.json({
        success: true,
        transcription: result.text,
        language: result.language,
        duration: result.duration,
        segments: result.segments,
        words: result.words,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Timestamp transcription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe with timestamps'
    });
  }
});

// Get transcription statistics
router.get('/stats', (req, res) => {
  try {
    const stats = whisperService.getTranscriptionStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transcription statistics'
    });
  }
});

// Validate audio file
router.post('/validate', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const validation = whisperService.validateAudioFile(req.file);

    // Clean up uploaded file
    whisperService.cleanupFiles([req.file.path]);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate audio file'
    });
  }
});

// Test transcription with sample data
router.post('/test', async (req, res) => {
  try {
    const { audioData, language = 'en', prompt = '' } = req.body;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: 'No audio data provided'
      });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    const options = {
      language,
      prompt,
      responseFormat: 'json',
      temperature: 0
    };

    const result = await whisperService.transcribeBuffer(audioBuffer, options);

    if (result.success) {
      res.json({
        success: true,
        transcription: result.text,
        language: result.language,
        duration: result.duration,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test transcription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test transcription'
    });
  }
});

module.exports = router;
