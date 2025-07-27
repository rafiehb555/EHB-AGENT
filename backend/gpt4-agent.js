const axios = require('axios');
const winston = require('winston');

class GPT4Agent {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
        this.model = 'gpt-4';
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
                new winston.transports.File({ filename: 'logs/gpt4-agent.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize() {
        try {
            if (!this.apiKey) {
                throw new Error('OpenAI API key not configured');
            }

            // Test API connection
            await this.testConnection();
            this.status = 'ready';
            this.logger.info('✅ GPT-4 Agent initialized successfully');
            
        } catch (error) {
            this.status = 'error';
            this.logger.error('❌ GPT-4 Agent initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        const response = await this.makeRequest({
            model: this.model,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
        });
        return response;
    }

    async makeRequest(payload) {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            this.logger.error('GPT-4 API request failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async generateCode(params) {
        const { language, requirements, context } = params;
        
        const prompt = `
Generate ${language} code based on the following requirements:

Requirements: ${requirements}
Context: ${context}

Please provide:
1. Complete, working code
2. Comments explaining the logic
3. Error handling
4. Best practices implementation

Code:
        `;

        const response = await this.makeRequest({
            model: this.model,
            messages: [
                { role: 'system', content: 'You are an expert software developer. Generate clean, efficient, and well-documented code.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.3
        });

        return {
            code: response.choices[0].message.content,
            language: language,
            requirements: requirements
        };
    }

    async generateDesignPrompt(params) {
        const { requirements, style, context } = params;
        
        const prompt = `
Create a detailed design prompt for UI/UX based on:

Requirements: ${requirements}
Style: ${style}
Context: ${context}

Generate a comprehensive prompt that includes:
- Visual style description
- Color scheme
- Layout requirements
- User experience considerations
- Technical specifications
        `;

        const response = await this.makeRequest({
            model: this.model,
            messages: [
                { role: 'system', content: 'You are an expert UI/UX designer. Create detailed design prompts for visual generation.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    }

    async analyzeTranscription(params) {
        const { text, context } = params;
        
        const prompt = `
Analyze the following transcribed text:

Text: ${text}
Context: ${context}

Please provide:
1. Sentiment analysis
2. Key topics identified
3. Action items or requests
4. Priority level
5. Recommended response
        `;

        const response = await this.makeRequest({
            model: this.model,
            messages: [
                { role: 'system', content: 'You are an expert in analyzing voice transcriptions and extracting actionable insights.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 800,
            temperature: 0.5
        });

        const analysis = response.choices[0].message.content;
        
        // Parse the analysis into structured format
        return this.parseAnalysis(analysis);
    }

    async synthesizeResearch(params) {
        const { data, requirements } = params;
        
        const prompt = `
Synthesize the following research data:

Research Data: ${JSON.stringify(data)}
Requirements: ${requirements}

Please provide:
1. Executive summary
2. Key findings
3. Insights and patterns
4. Recommendations
5. Next steps
        `;

        const response = await this.makeRequest({
            model: this.model,
            messages: [
                { role: 'system', content: 'You are an expert research analyst. Synthesize complex data into actionable insights.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1500,
            temperature: 0.4
        });

        return this.parseResearchSynthesis(response.choices[0].message.content);
    }

    async complexReasoning(params) {
        const { problem, context, approach } = params;
        
        const prompt = `
Solve this complex problem using ${approach || 'systematic reasoning'}:

Problem: ${problem}
Context: ${context}

Please provide:
1. Problem breakdown
2. Analysis approach
3. Step-by-step reasoning
4. Solution with justification
5. Alternative approaches considered
        `;

        const response = await this.makeRequest({
            model: this.model,
            messages: [
                { role: 'system', content: 'You are an expert problem solver. Use systematic reasoning to solve complex problems.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.2
        });

        return {
            reasoning: response.choices[0].message.content,
            approach: approach,
            confidence: this.calculateConfidence(response.choices[0].message.content)
        };
    }

    parseAnalysis(analysis) {
        // Simple parsing - in production, use more sophisticated parsing
        return {
            sentiment: this.extractSentiment(analysis),
            actionItems: this.extractActionItems(analysis),
            priority: this.extractPriority(analysis),
            summary: analysis
        };
    }

    parseResearchSynthesis(synthesis) {
        return {
            summary: synthesis,
            recommendations: this.extractRecommendations(synthesis),
            insights: this.extractInsights(synthesis)
        };
    }

    extractSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'satisfied'];
        const negativeWords = ['bad', 'poor', 'terrible', 'negative', 'unhappy', 'dissatisfied'];
        
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
            /action required/i,
            /please/i
        ];
        
        const sentences = text.split('.');
        return sentences.filter(sentence => 
            actionPatterns.some(pattern => pattern.test(sentence))
        );
    }

    extractPriority(text) {
        if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('critical')) {
            return 'high';
        }
        if (text.toLowerCase().includes('important')) {
            return 'medium';
        }
        return 'low';
    }

    extractRecommendations(text) {
        const recommendationPatterns = [
            /recommend/i,
            /suggest/i,
            /propose/i,
            /should/i
        ];
        
        const sentences = text.split('.');
        return sentences.filter(sentence => 
            recommendationPatterns.some(pattern => pattern.test(sentence))
        );
    }

    extractInsights(text) {
        const insightPatterns = [
            /insight/i,
            /finding/i,
            /discovery/i,
            /pattern/i,
            /trend/i
        ];
        
        const sentences = text.split('.');
        return sentences.filter(sentence => 
            insightPatterns.some(pattern => pattern.test(sentence))
        );
    }

    calculateConfidence(reasoning) {
        // Simple confidence calculation based on reasoning length and structure
        const words = reasoning.split(' ').length;
        const hasSteps = reasoning.includes('step') || reasoning.includes('1.') || reasoning.includes('2.');
        const hasJustification = reasoning.includes('because') || reasoning.includes('since') || reasoning.includes('therefore');
        
        let confidence = 0.5; // Base confidence
        
        if (words > 100) confidence += 0.2;
        if (hasSteps) confidence += 0.2;
        if (hasJustification) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    getStatus() {
        return this.status;
    }

    async healthCheck() {
        try {
            await this.testConnection();
            return {
                status: 'healthy',
                agent: 'GPT-4',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                agent: 'GPT-4',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = GPT4Agent; 