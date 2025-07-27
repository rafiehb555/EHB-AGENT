const axios = require('axios');
const winston = require('winston');

class GeminiAgent {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-pro';
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
                new winston.transports.File({ filename: 'logs/gemini-agent.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize() {
        try {
            if (!this.apiKey) {
                this.logger.warn('⚠️ Gemini API key not configured - using mock mode');
                this.status = 'mock-mode';
                return;
            }

            // Test API connection
            await this.testConnection();
            this.status = 'ready';
            this.logger.info('✅ Gemini Agent initialized successfully');
            
        } catch (error) {
            this.status = 'error';
            this.logger.error('❌ Gemini Agent initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        const response = await this.makeRequest({
            contents: [{
                parts: [{
                    text: 'Hello, test connection'
                }]
            }]
        });
        return response;
    }

    async makeRequest(payload) {
        try {
            const response = await axios.post(
                `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            this.logger.error('Gemini API request failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async searchAndAnalyze(params) {
        const { query, sources, depth } = params;
        
        const prompt = `
Perform a comprehensive search and analysis on: "${query}"

Search depth: ${depth || 'comprehensive'}
Sources to consider: ${sources ? sources.join(', ') : 'all available'}

Please provide:
1. Current information and trends
2. Relevant data and statistics
3. Expert opinions and insights
4. Recent developments
5. Future implications
        `;

        if (this.status === 'mock-mode') {
            return this.mockSearchAnalysis(query, depth);
        }

        const response = await this.makeRequest({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        return {
            query: query,
            results: response.candidates[0].content.parts[0].text,
            sources: sources,
            depth: depth,
            timestamp: new Date().toISOString()
        };
    }

    async reviewCode(params) {
        const { code, language, requirements } = params;
        
        const prompt = `
Review the following ${language} code:

Code:
${code}

Requirements: ${requirements}

Please provide:
1. Code quality assessment
2. Security vulnerabilities
3. Performance optimizations
4. Best practices suggestions
5. Improved version of the code
        `;

        if (this.status === 'mock-mode') {
            return this.mockCodeReview(code, language);
        }

        const response = await this.makeRequest({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        const review = response.candidates[0].content.parts[0].text;
        
        return {
            review: review,
            suggestions: this.extractSuggestions(review),
            optimizedCode: this.extractOptimizedCode(review),
            securityIssues: this.extractSecurityIssues(review),
            performanceScore: this.calculatePerformanceScore(code)
        };
    }

    async validateReasoning(params) {
        const { reasoning, problem } = params;
        
        const prompt = `
Validate the following reasoning for the problem:

Problem: ${problem}
Reasoning: ${reasoning}

Please provide:
1. Logical consistency check
2. Assumption validation
3. Alternative approaches
4. Confidence level assessment
5. Potential gaps or errors
        `;

        if (this.status === 'mock-mode') {
            return this.mockValidation(reasoning, problem);
        }

        const response = await this.makeRequest({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        const validation = response.candidates[0].content.parts[0].text;
        
        return {
            validation: validation,
            confidence: this.calculateValidationConfidence(validation),
            alternatives: this.extractAlternatives(validation),
            gaps: this.extractGaps(validation)
        };
    }

    async processMedia(params) {
        const { mediaUrl, mediaType, task } = params;
        
        const prompt = `
Analyze the following ${mediaType}:

Media URL: ${mediaUrl}
Task: ${task}

Please provide:
1. Content description
2. Key elements identified
3. Relevant information extraction
4. Context and meaning
5. Actionable insights
        `;

        if (this.status === 'mock-mode') {
            return this.mockMediaProcessing(mediaUrl, mediaType, task);
        }

        // For media processing, we'd need to use Gemini's multimodal capabilities
        // This is a simplified version
        const response = await this.makeRequest({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        return {
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            analysis: response.candidates[0].content.parts[0].text,
            insights: this.extractMediaInsights(response.candidates[0].content.parts[0].text)
        };
    }

    // Mock methods for when API key is not available
    mockSearchAnalysis(query, depth) {
        return {
            query: query,
            results: `Mock search results for "${query}" with ${depth} depth analysis. This would include current trends, relevant data, and expert insights.`,
            sources: ['mock-source-1', 'mock-source-2'],
            depth: depth,
            timestamp: new Date().toISOString()
        };
    }

    mockCodeReview(code, language) {
        return {
            review: `Mock code review for ${language} code. Code quality: Good. Security: No major issues found. Performance: Optimized.`,
            suggestions: ['Add error handling', 'Improve documentation', 'Consider using async/await'],
            optimizedCode: code + '\n// Mock optimizations applied',
            securityIssues: [],
            performanceScore: 85
        };
    }

    mockValidation(reasoning, problem) {
        return {
            validation: `Mock validation for reasoning. Logical consistency: Good. Assumptions: Valid. Confidence: High.`,
            confidence: 0.85,
            alternatives: ['Alternative approach 1', 'Alternative approach 2'],
            gaps: ['Minor gap in step 3']
        };
    }

    mockMediaProcessing(mediaUrl, mediaType, task) {
        return {
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            analysis: `Mock ${mediaType} analysis. Content: Professional ${mediaType}. Key elements: Well-structured.`,
            insights: ['Insight 1', 'Insight 2', 'Insight 3']
        };
    }

    // Helper methods for parsing responses
    extractSuggestions(review) {
        const suggestionPatterns = [
            /suggest/i,
            /recommend/i,
            /consider/i,
            /improve/i,
            /add/i
        ];
        
        const sentences = review.split('.');
        return sentences.filter(sentence => 
            suggestionPatterns.some(pattern => pattern.test(sentence))
        );
    }

    extractOptimizedCode(review) {
        // Simple extraction - in production, use more sophisticated parsing
        const codeBlocks = review.match(/```[\s\S]*?```/g);
        return codeBlocks ? codeBlocks[0] : review;
    }

    extractSecurityIssues(review) {
        const securityPatterns = [
            /security/i,
            /vulnerability/i,
            /risk/i,
            /threat/i
        ];
        
        const sentences = review.split('.');
        return sentences.filter(sentence => 
            securityPatterns.some(pattern => pattern.test(sentence))
        );
    }

    calculatePerformanceScore(code) {
        // Simple scoring based on code characteristics
        let score = 100;
        
        if (code.includes('for loop')) score -= 10;
        if (code.includes('async')) score += 5;
        if (code.includes('error handling')) score += 10;
        if (code.includes('documentation')) score += 5;
        
        return Math.max(score, 0);
    }

    calculateValidationConfidence(validation) {
        const positiveWords = ['valid', 'correct', 'consistent', 'good', 'strong'];
        const negativeWords = ['invalid', 'incorrect', 'inconsistent', 'weak', 'flawed'];
        
        const words = validation.toLowerCase().split(' ');
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;
        
        let confidence = 0.5;
        confidence += (positiveCount - negativeCount) * 0.1;
        
        return Math.max(0, Math.min(1, confidence));
    }

    extractAlternatives(validation) {
        const alternativePatterns = [
            /alternative/i,
            /different approach/i,
            /another way/i,
            /option/i
        ];
        
        const sentences = validation.split('.');
        return sentences.filter(sentence => 
            alternativePatterns.some(pattern => pattern.test(sentence))
        );
    }

    extractGaps(validation) {
        const gapPatterns = [
            /gap/i,
            /missing/i,
            /incomplete/i,
            /unclear/i
        ];
        
        const sentences = validation.split('.');
        return sentences.filter(sentence => 
            gapPatterns.some(pattern => pattern.test(sentence))
        );
    }

    extractMediaInsights(analysis) {
        const insightPatterns = [
            /insight/i,
            /observation/i,
            /finding/i,
            /notable/i
        ];
        
        const sentences = analysis.split('.');
        return sentences.filter(sentence => 
            insightPatterns.some(pattern => pattern.test(sentence))
        );
    }

    getStatus() {
        return this.status;
    }

    async healthCheck() {
        try {
            if (this.status === 'mock-mode') {
                return {
                    status: 'healthy',
                    agent: 'Gemini',
                    mode: 'mock',
                    timestamp: new Date().toISOString()
                };
            }
            
            await this.testConnection();
            return {
                status: 'healthy',
                agent: 'Gemini',
                mode: 'api',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                agent: 'Gemini',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = GeminiAgent; 