const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class WhisperService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.uploadDir = path.join(__dirname, '../uploads');
    this.audioFormats = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'flac'];
    this.maxFileSize = 25 * 1024 * 1024; // 25MB
    this.supportedLanguages = ['en', 'ur', 'hi', 'ar', 'es', 'fr', 'de', 'zh', 'ja', 'ko'];

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Configure multer for file uploads
  configureMulter() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const isAudio = this.audioFormats.includes(ext.substring(1));

      if (isAudio) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  // Transcribe audio file using OpenAI Whisper
  async transcribeAudio(filePath, options = {}) {
    try {
      console.log(`🎤 Transcribing audio: ${path.basename(filePath)}`);

      const {
        language = 'en',
        prompt = '',
        responseFormat = 'json',
        temperature = 0,
        timestampGranularities = ['word']
      } = options;

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language: language,
        prompt: prompt,
        response_format: responseFormat,
        temperature: temperature,
        timestamp_granularities: timestampGranularities
      });

      console.log(`✅ Transcription completed: ${transcription.text?.length || 0} characters`);

      return {
        success: true,
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Transcription error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Transcribe audio from buffer
  async transcribeBuffer(audioBuffer, options = {}) {
    try {
      console.log('🎤 Transcribing audio from buffer');

      const {
        language = 'en',
        prompt = '',
        responseFormat = 'json',
        temperature = 0
      } = options;

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        language: language,
        prompt: prompt,
        response_format: responseFormat,
        temperature: temperature
      });

      return {
        success: true,
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Buffer transcription error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Detect language from audio
  async detectLanguage(filePath) {
    try {
      console.log('🌍 Detecting language from audio');

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        response_format: 'verbose_json'
      });

      return {
        success: true,
        language: transcription.language,
        languageProbability: transcription.language_probability,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Language detection error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Process audio with timestamps
  async transcribeWithTimestamps(filePath, options = {}) {
    try {
      console.log('⏰ Transcribing with timestamps');

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['word', 'segment'],
        ...options
      });

      return {
        success: true,
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments,
        words: transcription.words,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Timestamp transcription error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Batch transcribe multiple files
  async batchTranscribe(files, options = {}) {
    try {
      console.log(`📦 Batch transcribing ${files.length} files`);

      const results = [];
      const batchSize = 5; // Process 5 files at a time

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchPromises = batch.map(file => this.transcribeAudio(file, options));

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid rate limits
        if (i + batchSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        results,
        totalFiles: files.length,
        successfulTranscriptions: results.filter(r => r.success).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Batch transcription error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clean up uploaded files
  async cleanupFiles(filePaths) {
    try {
      const cleanupPromises = filePaths.map(filePath => {
        return new Promise((resolve) => {
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`❌ Error deleting file ${filePath}:`, err);
              } else {
                console.log(`🗑️ Deleted file: ${path.basename(filePath)}`);
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
      });

      await Promise.all(cleanupPromises);
      return { success: true, message: 'Files cleaned up successfully' };
    } catch (error) {
      console.error('❌ File cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get transcription statistics
  getTranscriptionStats() {
    return {
      supportedFormats: this.audioFormats,
      maxFileSize: this.maxFileSize,
      supportedLanguages: this.supportedLanguages,
      uploadDirectory: this.uploadDir
    };
  }

  // Validate audio file
  validateAudioFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file format
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.audioFormats.includes(ext.substring(1))) {
      errors.push(`Unsupported file format. Supported formats: ${this.audioFormats.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const whisperService = new WhisperService();

module.exports = whisperService;
