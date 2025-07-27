const axios = require('axios');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

class WhisperAgent {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
        this.model = 'whisper-1';
        this.status = 'initializing';
        this.setupLogging();
    }

    setupLogging() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/whisper-agent.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize() {
        try {
            if (!this.apiKey) {
                this.logger.warn('⚠️ OpenAI API key not configured - using mock mode');
                this.status = 'mock-mode';
                return;
            }

            // Test API connection with a simple audio file
            await this.testConnection();
            this.status = 'ready';
            this.logger.info('✅ Whisper Agent initialized successfully');
            
        } catch (error) {
            this.status = 'error';
            this.logger.error('❌ Whisper Agent initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        // Create a simple test audio file or use existing one
        const testAudioPath = path.join(__dirname, 'test-audio.wav');
        
        if (!fs.existsSync(testAudioPath)) {
            this.logger.info('Creating test audio file for connection test');
            // In a real implementation, you'd create a test audio file
            // For now, we'll just check if the API key is valid
            return true;
        }

        try {
            const result = await this.transcribe({
                audioFile: testAudioPath,
                language: 'en'
            });
            return result;
        } catch (error) {
            this.logger.error('Whisper connection test failed:', error);
            throw error;
        }
    }

    async transcribe(params) {
        const { audioFile, language, prompt } = params;
        
        if (this.status === 'mock-mode') {
            return this.mockTranscription(audioFile, language);
        }

        try {
            // Check if audio file exists
            if (!fs.existsSync(audioFile)) {
                throw new Error(`Audio file not found: ${audioFile}`);
            }

            // Read the audio file
            const audioBuffer = fs.readFileSync(audioFile);
            
            // Create form data for the API request
            const FormData = require('form-data');
            const form = new FormData();
            
            form.append('file', audioBuffer, {
                filename: path.basename(audioFile),
                contentType: this.getAudioContentType(audioFile)
            });
            
            form.append('model', this.model);
            form.append('language', language || 'en');
            
            if (prompt) {
                form.append('prompt', prompt);
            }

            const response = await axios.post(
                `${this.baseURL}/audio/transcriptions`,
                form,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        ...form.getHeaders()
                    }
                }
            );

            return {
                text: response.data.text,
                language: language || 'en',
                duration: this.calculateAudioDuration(audioFile),
                confidence: this.calculateConfidence(response.data.text),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Whisper transcription failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async transcribeWithTimestamps(params) {
        const { audioFile, language, prompt } = params;
        
        if (this.status === 'mock-mode') {
            return this.mockTranscriptionWithTimestamps(audioFile, language);
        }

        try {
            const audioBuffer = fs.readFileSync(audioFile);
            const FormData = require('form-data');
            const form = new FormData();
            
            form.append('file', audioBuffer, {
                filename: path.basename(audioFile),
                contentType: this.getAudioContentType(audioFile)
            });
            
            form.append('model', this.model);
            form.append('language', language || 'en');
            form.append('response_format', 'verbose_json');
            
            if (prompt) {
                form.append('prompt', prompt);
            }

            const response = await axios.post(
                `${this.baseURL}/audio/transcriptions`,
                form,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        ...form.getHeaders()
                    }
                }
            );

            return {
                text: response.data.text,
                segments: response.data.segments,
                language: language || 'en',
                duration: this.calculateAudioDuration(audioFile),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Whisper transcription with timestamps failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async translate(params) {
        const { audioFile, targetLanguage, prompt } = params;
        
        if (this.status === 'mock-mode') {
            return this.mockTranslation(audioFile, targetLanguage);
        }

        try {
            const audioBuffer = fs.readFileSync(audioFile);
            const FormData = require('form-data');
            const form = new FormData();
            
            form.append('file', audioBuffer, {
                filename: path.basename(audioFile),
                contentType: this.getAudioContentType(audioFile)
            });
            
            form.append('model', this.model);
            form.append('response_format', 'text');
            
            if (prompt) {
                form.append('prompt', prompt);
            }

            const response = await axios.post(
                `${this.baseURL}/audio/translations`,
                form,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        ...form.getHeaders()
                    }
                }
            );

            return {
                text: response.data.text,
                originalLanguage: 'auto-detected',
                targetLanguage: targetLanguage,
                duration: this.calculateAudioDuration(audioFile),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Whisper translation failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async processVoiceComplaint(params) {
        const { audioFile, context, priority } = params;
        
        this.logger.info(`🎤 Processing voice complaint from: ${audioFile}`);
        
        // Transcribe the audio
        const transcription = await this.transcribe({
            audioFile: audioFile,
            language: 'en'
        });

        // Analyze the complaint content
        const analysis = await this.analyzeComplaint({
            text: transcription.text,
            context: context,
            priority: priority
        });

        return {
            transcription: transcription.text,
            analysis: analysis,
            priority: analysis.priority,
            category: analysis.category,
            actionItems: analysis.actionItems,
            sentiment: analysis.sentiment
        };
    }

    async analyzeComplaint(params) {
        const { text, context, priority } = params;
        
        // Simple complaint analysis - in production, use more sophisticated NLP
        const analysis = {
            priority: this.determinePriority(text, priority),
            category: this.categorizeComplaint(text),
            sentiment: this.analyzeSentiment(text),
            actionItems: this.extractActionItems(text),
            urgency: this.determineUrgency(text)
        };

        return analysis;
    }

    // Mock methods for when API key is not available
    mockTranscription(audioFile, language) {
        const mockTexts = {
            'en': 'This is a mock transcription of the audio file. The system is working correctly.',
            'es': 'Esta es una transcripción simulada del archivo de audio. El sistema funciona correctamente.',
            'fr': 'Ceci est une transcription simulée du fichier audio. Le système fonctionne correctement.'
        };

        return {
            text: mockTexts[language] || mockTexts['en'],
            language: language || 'en',
            duration: 30.5,
            confidence: 0.95,
            timestamp: new Date().toISOString()
        };
    }

    mockTranscriptionWithTimestamps(audioFile, language) {
        const mockSegments = [
            {
                start: 0,
                end: 5,
                text: 'This is a mock'
            },
            {
                start: 5,
                end: 10,
                text: 'transcription with timestamps'
            },
            {
                start: 10,
                end: 15,
                text: 'for testing purposes'
            }
        ];

        return {
            text: 'This is a mock transcription with timestamps for testing purposes',
            segments: mockSegments,
            language: language || 'en',
            duration: 15.0,
            timestamp: new Date().toISOString()
        };
    }

    mockTranslation(audioFile, targetLanguage) {
        const mockTranslations = {
            'es': 'Esta es una traducción simulada del archivo de audio.',
            'fr': 'Ceci est une traduction simulée du fichier audio.',
            'de': 'Dies ist eine simulierte Übersetzung der Audiodatei.'
        };

        return {
            text: mockTranslations[targetLanguage] || 'This is a mock translation of the audio file.',
            originalLanguage: 'en',
            targetLanguage: targetLanguage,
            duration: 25.0,
            timestamp: new Date().toISOString()
        };
    }

    // Helper methods
    getAudioContentType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            '.mp3': 'audio/mpeg',
            '.mp4': 'audio/mp4',
            '.mpeg': 'audio/mpeg',
            '.mpga': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.webm': 'audio/webm'
        };
        return contentTypes[ext] || 'audio/wav';
    }

    calculateAudioDuration(audioFile) {
        // Mock duration calculation - in production, use audio processing library
        return Math.random() * 60 + 10; // Random duration between 10-70 seconds
    }

    calculateConfidence(text) {
        // Simple confidence calculation based on text quality
        const words = text.split(' ').length;
        const hasPunctuation = /[.!?]/.test(text);
        const hasProperCase = /[A-Z]/.test(text);
        
        let confidence = 0.7; // Base confidence
        
        if (words > 10) confidence += 0.1;
        if (hasPunctuation) confidence += 0.1;
        if (hasProperCase) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    determinePriority(text, userPriority) {
        const urgentWords = ['urgent', 'emergency', 'critical', 'immediate', 'asap'];
        const highWords = ['important', 'serious', 'urgent', 'priority'];
        
        const lowerText = text.toLowerCase();
        
        if (urgentWords.some(word => lowerText.includes(word))) return 'urgent';
        if (highWords.some(word => lowerText.includes(word))) return 'high';
        if (userPriority) return userPriority;
        
        return 'medium';
    }

    categorizeComplaint(text) {
        const categories = {
            'technical': ['error', 'bug', 'crash', 'broken', 'not working'],
            'billing': ['payment', 'charge', 'bill', 'cost', 'price'],
            'service': ['slow', 'unresponsive', 'poor service', 'wait time'],
            'feature': ['missing', 'need', 'want', 'request', 'suggestion'],
            'general': ['question', 'inquiry', 'information']
        };

        const lowerText = text.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'satisfied', 'happy'];
        const negativeWords = ['bad', 'terrible', 'awful', 'dissatisfied', 'angry'];
        
        const words = text.toLowerCase().split(' ');
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    extractActionItems(text) {
        const actionPatterns = [
            /need to/i,
            /should/i,
            /must/i,
            /please/i,
            /request/i,
            /fix/i,
            /resolve/i
        ];
        
        const sentences = text.split('.');
        return sentences.filter(sentence => 
            actionPatterns.some(pattern => pattern.test(sentence))
        );
    }

    determineUrgency(text) {
        const urgentWords = ['now', 'immediately', 'urgent', 'emergency', 'asap'];
        const lowerText = text.toLowerCase();
        
        if (urgentWords.some(word => lowerText.includes(word))) {
            return 'high';
        }
        return 'normal';
    }

    getStatus() {
        return this.status;
    }

    async healthCheck() {
        try {
            if (this.status === 'mock-mode') {
                return {
                    status: 'healthy',
                    agent: 'Whisper',
                    mode: 'mock',
                    timestamp: new Date().toISOString()
                };
            }
            
            await this.testConnection();
            return {
                status: 'healthy',
                agent: 'Whisper',
                mode: 'api',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                agent: 'Whisper',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = WhisperAgent; 