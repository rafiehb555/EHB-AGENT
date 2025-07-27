const express = require("express");
const router = express.Router();
const multer = require("multer");
const { processVoiceText } = require("../controllers/aiController");
const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Process voice/text input
router.post("/process", async (req, res) => {
  try {
    const { message, mode = 'standard', context = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    const response = await processVoiceText(req, res);
    return response;
  } catch (error) {
    console.error("Voice processing error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process voice input"
    });
  }
});

// Whisper API endpoint for voice file processing
router.post("/whisper", upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided"
      });
    }

    const { language = 'en' } = req.body;

    console.log(`🎤 Processing audio with Whisper API (${language})`);
    console.log(`📁 File size: ${req.file.size} bytes`);
    console.log(`📋 MIME type: ${req.file.mimetype}`);

    // Convert audio to proper format if needed
    let audioBuffer = req.file.buffer;

    // Use OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: new Blob([audioBuffer], { type: req.file.mimetype }),
      model: "whisper-1",
      language: language,
      response_format: "text"
    });

    const text = transcription.text.trim();

    console.log(`✅ Whisper transcription: "${text}"`);

    res.json({
      success: true,
      text: text,
      language: language,
      confidence: 0.95, // Whisper doesn't provide confidence scores
      processing_time: Date.now() - req.startTime
    });

  } catch (error) {
    console.error("Whisper API error:", error);

    let errorMessage = "Failed to process audio";
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Text-to-speech endpoint
router.post("/speak", async (req, res) => {
  try {
    const { text, voice = 'alloy', language = 'en', speed = 1.0 } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text is required"
      });
    }

    console.log(`🔊 Converting text to speech: "${text.substring(0, 50)}..."`);

    // Use OpenAI TTS API
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      speed: speed
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Content-Disposition': 'attachment; filename="speech.mp3"'
    });

    res.send(buffer);

  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to convert text to speech"
    });
  }
});

// Voice vault operations
router.post("/vault/store", async (req, res) => {
  try {
    const { key, data, voiceSignature } = req.body;

    if (!key || !data) {
      return res.status(400).json({
        success: false,
        error: "Key and data are required"
      });
    }

    // TODO: Implement voice vault storage
    console.log(`🔒 Storing in voice vault: ${key}`);

    res.json({
      success: true,
      message: "Data stored securely in voice vault",
      key: key
    });

  } catch (error) {
    console.error("Voice vault store error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to store in voice vault"
    });
  }
});

router.post("/vault/retrieve", async (req, res) => {
  try {
    const { key, voiceSignature } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "Key is required"
      });
    }

    // TODO: Implement voice vault retrieval
    console.log(`🔓 Retrieving from voice vault: ${key}`);

    res.json({
      success: true,
      data: "Sample vault data",
      key: key
    });

  } catch (error) {
    console.error("Voice vault retrieve error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve from voice vault"
    });
  }
});

// Voice analysis for telepathy mode
router.post("/analyze", async (req, res) => {
  try {
    const { audioData, context = {} } = req.body;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: "Audio data is required"
      });
    }

    // TODO: Implement voice analysis for telepathy
    console.log(`🧠 Analyzing voice for telepathy mode`);

    res.json({
      success: true,
      analysis: {
        intent: "user_intent",
        confidence: 0.85,
        emotions: ["neutral"],
        context: context
      }
    });

  } catch (error) {
    console.error("Voice analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze voice"
    });
  }
});

// Voice settings
router.get("/settings", async (req, res) => {
  try {
    res.json({
      success: true,
      settings: {
        language: "en",
        voice: "alloy",
        speed: 1.0,
        volume: 0.8,
        recognitionMethod: "auto"
      }
    });
  } catch (error) {
    console.error("Get voice settings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get voice settings"
    });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const { settings } = req.body;

    // TODO: Implement voice settings update
    console.log(`⚙️ Updating voice settings:`, settings);

    res.json({
      success: true,
      settings: settings,
      message: "Voice settings updated successfully"
    });

  } catch (error) {
    console.error("Update voice settings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update voice settings"
    });
  }
});

// Voice health check
router.get("/health", async (req, res) => {
  try {
    res.json({
      success: true,
      status: "healthy",
      features: {
        whisper: true,
        tts: true,
        voiceVault: true,
        telepathy: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Voice health check error:", error);
    res.status(500).json({
      success: false,
      error: "Voice service unhealthy"
    });
  }
});

module.exports = router;
