const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class WakeWordDetector {
  constructor() {
    this.isListening = false;
    this.wakeWord = 'EHB';
    this.confidenceThreshold = 0.8;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.detectionHistory = [];
    this.maxHistorySize = 10;
  }

  // Initialize wake word detection
  async initialize() {
    try {
      console.log('🎤 Initializing Wake Word Detector...');

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);

      // Configure analyser
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Connect microphone to analyser
      this.microphone.connect(this.analyser);

      console.log('✅ Wake Word Detector initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing wake word detector:', error);
      return false;
    }
  }

  // Start listening for wake word
  async startListening(onWakeWordDetected) {
    if (this.isListening) {
      console.log('⚠️ Already listening for wake word');
      return;
    }

    try {
      this.isListening = true;
      console.log(`🎤 Started listening for wake word: "${this.wakeWord}"`);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDataArray = new Float32Array(bufferLength);

      const detectWakeWord = async () => {
        if (!this.isListening) return;

        // Get frequency data
        this.analyser.getByteFrequencyData(dataArray);
        this.analyser.getFloatTimeDomainData(timeDataArray);

        // Check for voice activity
        const hasVoiceActivity = this.detectVoiceActivity(dataArray, timeDataArray);

        if (hasVoiceActivity) {
          console.log('🔍 Voice activity detected, analyzing...');

          // Record audio for analysis
          const audioBlob = await this.recordAudio();

          if (audioBlob) {
            // Analyze audio for wake word
            const isWakeWord = await this.analyzeAudioForWakeWord(audioBlob);

            if (isWakeWord) {
              console.log(`✅ Wake word detected: "${this.wakeWord}"`);
              this.addToHistory('detected', this.wakeWord);
              onWakeWordDetected?.(this.wakeWord);
            } else {
              console.log('❌ Wake word not detected');
              this.addToHistory('false_positive', 'unknown');
            }
          }
        }

        // Continue listening
        requestAnimationFrame(detectWakeWord);
      };

      detectWakeWord();
    } catch (error) {
      console.error('❌ Error starting wake word detection:', error);
      this.isListening = false;
    }
  }

  // Stop listening for wake word
  stopListening() {
    this.isListening = false;
    console.log('🛑 Stopped listening for wake word');
  }

  // Detect voice activity in audio data
  detectVoiceActivity(frequencyData, timeData) {
    // Calculate average frequency amplitude
    const averageFrequency = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;

    // Calculate RMS (Root Mean Square) of time domain data
    const rms = Math.sqrt(timeData.reduce((sum, value) => sum + value * value, 0) / timeData.length);

    // Check for voice activity thresholds
    const hasVoiceActivity = averageFrequency > 30 && rms > 0.01;

    return hasVoiceActivity;
  }

  // Record audio for wake word analysis
  async recordAudio(duration = 3000) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      return new Promise((resolve) => {
        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };

        this.mediaRecorder.start();
        setTimeout(() => {
          this.mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, duration);
      });
    } catch (error) {
      console.error('❌ Error recording audio:', error);
      return null;
    }
  }

  // Analyze audio for wake word using AI
  async analyzeAudioForWakeWord(audioBlob) {
    try {
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');

      // Use OpenAI Whisper for speech recognition
      const transcription = await this.openai.audio.transcriptions.create({
        file: {
          data: Buffer.from(arrayBuffer),
          name: 'audio.webm',
          type: 'audio/webm'
        },
        model: 'whisper-1',
        language: 'en'
      });

      const transcribedText = transcription.text.toLowerCase().trim();
      console.log(`🎤 Transcribed: "${transcribedText}"`);

      // Check if wake word is in transcribed text
      const wakeWordLower = this.wakeWord.toLowerCase();
      const isWakeWordPresent = transcribedText.includes(wakeWordLower);

      if (isWakeWordPresent) {
        // Additional AI analysis for confidence
        const confidence = await this.analyzeWakeWordConfidence(transcribedText);
        return confidence >= this.confidenceThreshold;
      }

      return false;
    } catch (error) {
      console.error('❌ Error analyzing audio for wake word:', error);
      return false;
    }
  }

  // Analyze wake word confidence using AI
  async analyzeWakeWordConfidence(transcribedText) {
    try {
      const prompt = `
      Analyze this transcribed audio for wake word detection:
      Transcribed Text: "${transcribedText}"
      Target Wake Word: "${this.wakeWord}"

      Determine if the wake word was clearly spoken and intended as a wake word.
      Consider:
      1. Clarity of pronunciation
      2. Context (is it part of a sentence or standalone?)
      3. Background noise interference
      4. Speaker's intent

      Return a confidence score between 0.0 and 1.0, where:
      - 0.0: Definitely not a wake word
      - 0.5: Possibly a wake word
      - 1.0: Definitely a wake word

      Return only the number (e.g., 0.85)
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a wake word detection analyzer. Provide confidence scores for wake word detection.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const confidenceText = completion.choices[0].message.content.trim();
      const confidence = parseFloat(confidenceText);

      console.log(`🎯 Wake word confidence: ${confidence}`);
      return isNaN(confidence) ? 0.5 : Math.max(0, Math.min(1, confidence));
    } catch (error) {
      console.error('❌ Error analyzing wake word confidence:', error);
      return 0.5; // Default confidence
    }
  }

  // Set custom wake word
  setWakeWord(newWakeWord) {
    this.wakeWord = newWakeWord;
    console.log(`🎤 Wake word updated to: "${this.wakeWord}"`);
  }

  // Set confidence threshold
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
    console.log(`🎯 Confidence threshold set to: ${this.confidenceThreshold}`);
  }

  // Add detection to history
  addToHistory(type, word) {
    this.detectionHistory.push({
      timestamp: new Date(),
      type,
      word,
      confidence: type === 'detected' ? 0.9 : 0.1
    });

    // Keep only recent history
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory.shift();
    }
  }

  // Get detection statistics
  getDetectionStats() {
    const total = this.detectionHistory.length;
    const detected = this.detectionHistory.filter(h => h.type === 'detected').length;
    const falsePositives = this.detectionHistory.filter(h => h.type === 'false_positive').length;

    return {
      total,
      detected,
      falsePositives,
      accuracy: total > 0 ? (detected / total) * 100 : 0,
      recentDetections: this.detectionHistory.slice(-5)
    };
  }

  // Get current status
  getStatus() {
    return {
      isListening: this.isListening,
      wakeWord: this.wakeWord,
      confidenceThreshold: this.confidenceThreshold,
      stats: this.getDetectionStats()
    };
  }

  // Cleanup resources
  cleanup() {
    this.stopListening();

    if (this.audioContext) {
      this.audioContext.close();
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    console.log('🧹 Wake word detector cleaned up');
  }
}

// Create singleton instance
const wakeWordDetector = new WakeWordDetector();

module.exports = wakeWordDetector;
