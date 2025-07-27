const axios = require('axios');
const { EventEmitter } = require('events');
const winston = require('winston');
const chalk = require('chalk').default;

// Import AI Agents
const GPT4Agent = require('./gpt4-agent');
const GeminiAgent = require('./gemini-agent');
const WhisperAgent = require('./whisper-agent');
const MidjourneyAgent = require('./midjourney-agent');

class EHBOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.agents = {
            gpt4: null,
            gemini: null,
            whisper: null,
            midjourney: null
        };
        this.activeTasks = new Map();
        this.taskQueue = [];
        this.isProcessing = false;
        
        this.setupLogging();
        this.initializeAgents();
    }

    setupLogging() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/orchestrator.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initializeAgents() {
        this.logger.info('🚀 Initializing EHB AI Agent Orchestrator...');
        
        try {
            // Initialize GPT-4 Agent
            this.agents.gpt4 = new GPT4Agent();
            await this.agents.gpt4.initialize();
            this.logger.info('✅ GPT-4 Agent initialized');

            // Initialize Gemini Agent
            this.agents.gemini = new GeminiAgent();
            await this.agents.gemini.initialize();
            this.logger.info('✅ Gemini Agent initialized');

            // Initialize Whisper Agent
            this.agents.whisper = new WhisperAgent();
            await this.agents.whisper.initialize();
            this.logger.info('✅ Whisper Agent initialized');

            // Initialize Midjourney Agent
            this.agents.midjourney = new MidjourneyAgent();
            await this.agents.midjourney.initialize();
            this.logger.info('✅ Midjourney Agent initialized');

            this.logger.info('🎯 All AI Agents initialized successfully!');
            this.emit('agents-ready');
            
        } catch (error) {
            this.logger.error('❌ Failed to initialize agents:', error);
            throw error;
        }
    }

    async processTask(task) {
        const taskId = this.generateTaskId();
        this.activeTasks.set(taskId, {
            ...task,
            status: 'processing',
            startTime: Date.now()
        });

        this.logger.info(`🔄 Processing task ${taskId}: ${task.type}`);

        try {
            let result;
            
            switch (task.type) {
                case 'code-generation':
                    result = await this.handleCodeGeneration(task, taskId);
                    break;
                case 'design-request':
                    result = await this.handleDesignRequest(task, taskId);
                    break;
                case 'voice-processing':
                    result = await this.handleVoiceProcessing(task, taskId);
                    break;
                case 'research-analysis':
                    result = await this.handleResearchAnalysis(task, taskId);
                    break;
                case 'complex-reasoning':
                    result = await this.handleComplexReasoning(task, taskId);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }

            this.activeTasks.get(taskId).status = 'completed';
            this.activeTasks.get(taskId).result = result;
            this.activeTasks.get(taskId).endTime = Date.now();

            this.logger.info(`✅ Task ${taskId} completed successfully`);
            return result;

        } catch (error) {
            this.activeTasks.get(taskId).status = 'failed';
            this.activeTasks.get(taskId).error = error.message;
            this.logger.error(`❌ Task ${taskId} failed:`, error);
            throw error;
        }
    }

    async handleCodeGeneration(task, taskId) {
        this.logger.info(`💻 GPT-4 handling code generation for task ${taskId}`);
        
        const gpt4Result = await this.agents.gpt4.generateCode({
            language: task.language || 'javascript',
            requirements: task.requirements,
            context: task.context
        });

        // Use Gemini for code review and optimization
        const geminiReview = await this.agents.gemini.reviewCode({
            code: gpt4Result.code,
            language: task.language,
            requirements: task.requirements
        });

        return {
            code: gpt4Result.code,
            review: geminiReview,
            suggestions: geminiReview.suggestions,
            optimizedCode: geminiReview.optimizedCode
        };
    }

    async handleDesignRequest(task, taskId) {
        this.logger.info(`🎨 Midjourney handling design request for task ${taskId}`);
        
        // Use GPT-4 to generate design prompts
        const designPrompt = await this.agents.gpt4.generateDesignPrompt({
            requirements: task.requirements,
            style: task.style,
            context: task.context
        });

        // Use Midjourney to generate the design
        const designResult = await this.agents.midjourney.generateDesign({
            prompt: designPrompt,
            style: task.style,
            dimensions: task.dimensions
        });

        return {
            designUrl: designResult.url,
            prompt: designPrompt,
            variations: designResult.variations
        };
    }

    async handleVoiceProcessing(task, taskId) {
        this.logger.info(`🎤 Whisper handling voice processing for task ${taskId}`);
        
        // Use Whisper to transcribe audio
        const transcription = await this.agents.whisper.transcribe({
            audioFile: task.audioFile,
            language: task.language || 'en'
        });

        // Use GPT-4 to analyze the transcription
        const analysis = await this.agents.gpt4.analyzeTranscription({
            text: transcription.text,
            context: task.context
        });

        return {
            transcription: transcription.text,
            analysis: analysis,
            sentiment: analysis.sentiment,
            actionItems: analysis.actionItems
        };
    }

    async handleResearchAnalysis(task, taskId) {
        this.logger.info(`🔍 Gemini handling research analysis for task ${taskId}`);
        
        // Use Gemini for web search and research
        const researchData = await this.agents.gemini.searchAndAnalyze({
            query: task.query,
            sources: task.sources,
            depth: task.depth || 'comprehensive'
        });

        // Use GPT-4 for synthesis and insights
        const insights = await this.agents.gpt4.synthesizeResearch({
            data: researchData,
            requirements: task.requirements
        });

        return {
            researchData: researchData,
            insights: insights,
            summary: insights.summary,
            recommendations: insights.recommendations
        };
    }

    async handleComplexReasoning(task, taskId) {
        this.logger.info(`🧠 GPT-4 handling complex reasoning for task ${taskId}`);
        
        // Use GPT-4 for complex reasoning
        const reasoning = await this.agents.gpt4.complexReasoning({
            problem: task.problem,
            context: task.context,
            approach: task.approach
        });

        // Use Gemini for validation and additional insights
        const validation = await this.agents.gemini.validateReasoning({
            reasoning: reasoning,
            problem: task.problem
        });

        return {
            reasoning: reasoning,
            validation: validation,
            confidence: validation.confidence,
            alternativeApproaches: validation.alternatives
        };
    }

    async addTask(task) {
        this.taskQueue.push(task);
        this.logger.info(`📝 Added task to queue: ${task.type}`);
        
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessing || this.taskQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        while (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            try {
                await this.processTask(task);
            } catch (error) {
                this.logger.error('Task processing failed:', error);
            }
        }

        this.isProcessing = false;
    }

    getAgentStatus() {
        const status = {};
        for (const [name, agent] of Object.entries(this.agents)) {
            status[name] = {
                initialized: agent !== null,
                status: agent?.getStatus() || 'not-initialized'
            };
        }
        return status;
    }

    getSystemStatus() {
        return {
            agents: this.getAgentStatus(),
            activeTasks: this.activeTasks.size,
            queuedTasks: this.taskQueue.length,
            isProcessing: this.isProcessing,
            uptime: Date.now() - this.startTime
        };
    }

    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Health check method
    async healthCheck() {
        const health = {
            status: 'healthy',
            agents: {},
            timestamp: new Date().toISOString()
        };

        for (const [name, agent] of Object.entries(this.agents)) {
            try {
                const agentHealth = await agent.healthCheck();
                health.agents[name] = agentHealth;
            } catch (error) {
                health.agents[name] = { status: 'unhealthy', error: error.message };
                health.status = 'degraded';
            }
        }

        return health;
    }
}

module.exports = EHBOrchestrator; 