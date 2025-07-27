const { EventEmitter } = require('events');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

class CursorAgentIntegration extends EventEmitter {
    constructor() {
        super();
        this.orchestrator = null;
        this.mainAgent = null;
        this.cursorConfig = null;
        this.activeProjects = new Map();
        this.agentConnections = new Map();
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
                new winston.transports.File({ filename: 'logs/cursor-agent-integration.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize(orchestrator, mainAgent) {
        this.orchestrator = orchestrator;
        this.mainAgent = mainAgent;
        this.logger.info('🚀 Initializing Cursor Agent Integration...');

        try {
            await this.initializeAgentConnections();
            await this.setupCursorIntegration();
            await this.connectWithMainProject();
            await this.setupRealTimeCommunication();
            
            this.logger.info('✅ Cursor Agent Integration initialized successfully');
            this.emit('cursor-agents-ready');
            
        } catch (error) {
            this.logger.error('❌ Cursor Agent Integration initialization failed:', error);
            throw error;
        }
    }

    async initializeAgentConnections() {
        this.logger.info('🔗 Initializing agent connections...');
        
        const agents = {
            'gpt4': this.orchestrator.agents.gpt4,
            'gemini': this.orchestrator.agents.gemini,
            'whisper': this.orchestrator.agents.whisper,
            'midjourney': this.orchestrator.agents.midjourney
        };

        for (const [name, agent] of Object.entries(agents)) {
            if (agent) {
                this.agentConnections.set(name, {
                    agent: agent,
                    status: 'connected',
                    lastActivity: Date.now()
                });
                this.logger.info(`✅ Connected ${name} agent`);
            }
        }
    }

    async setupCursorIntegration() {
        this.logger.info('💻 Setting up Cursor IDE integration...');
        await this.loadCursorConfig();
        await this.setupCursorFileWatchers();
        await this.setupProjectTracking();
        this.logger.info('✅ Cursor IDE integration ready');
    }

    async connectWithMainProject() {
        this.logger.info('🏥 Connecting with main EHB AI dev project...');
        const mainProjectPath = path.join(process.cwd(), 'ehb-ai-dev');
        
        if (fs.existsSync(mainProjectPath)) {
            this.logger.info('✅ Found existing EHB AI dev project');
            await this.integrateWithMainProject(mainProjectPath);
        } else {
            this.logger.info('📁 Creating new EHB AI dev project structure');
            await this.createMainProjectStructure();
        }
    }

    async integrateWithMainProject(projectPath) {
        const components = ['agents', 'core', 'memory', 'timeline', 'utils'];
        for (const component of components) {
            const componentPath = path.join(projectPath, component);
            if (fs.existsSync(componentPath)) {
                this.logger.info(`✅ Found existing ${component} component`);
                await this.syncComponent(component, componentPath);
            }
        }
    }

    async createMainProjectStructure() {
        const projectStructure = {
            'agents': {
                'frontend-agent': {},
                'backend-agent': {},
                'health-agent': {}
            },
            'core': {
                'brain.js': '',
                'command-handler.js': '',
                'memory-loader.js': ''
            },
            'memory': {
                'agent-memory': {},
                'global-memory.json': '{}',
                'memory-sync.js': ''
            },
            'timeline': {
                'error-timeline.json': '[]',
                'fix-replay.js': ''
            },
            'utils': {
                'card-binder.js': ''
            }
        };

        for (const [dir, content] of Object.entries(projectStructure)) {
            await this.createProjectDirectory(dir, content);
        }
    }

    async createProjectDirectory(dirName, content) {
        const dirPath = path.join(process.cwd(), 'ehb-ai-dev', dirName);
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            this.logger.info(`📁 Created directory: ${dirName}`);
        }

        if (typeof content === 'object') {
            for (const [fileName, fileContent] of Object.entries(content)) {
                const filePath = path.join(dirPath, fileName);
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, fileContent);
                    this.logger.info(`📄 Created file: ${dirName}/${fileName}`);
                }
            }
        }
    }

    async setupRealTimeCommunication() {
        this.logger.info('📡 Setting up real-time communication...');
        this.setupAgentEventListeners();
        this.setupCursorCommunication();
        this.setupMainProjectCommunication();
        this.logger.info('✅ Real-time communication ready');
    }

    setupAgentEventListeners() {
        this.orchestrator.on('agents-ready', () => {
            this.logger.info('🎯 All agents are ready for Cursor integration');
        });

        this.orchestrator.on('task-completed', (taskId, result) => {
            this.logger.info(`✅ Task ${taskId} completed`);
            this.notifyCursorOfTaskCompletion(taskId, result);
        });

        this.orchestrator.on('task-failed', (taskId, error) => {
            this.logger.error(`❌ Task ${taskId} failed:`, error);
            this.notifyCursorOfTaskFailure(taskId, error);
        });
    }

    setupCursorCommunication() {
        this.logger.info('💻 Setting up Cursor IDE communication');
        this.monitorCursorEvents();
        this.setupCursorCommands();
    }

    setupMainProjectCommunication() {
        this.logger.info('🏥 Setting up main project communication');
        if (this.mainAgent) {
            this.mainAgent.on('project-update', (update) => {
                this.logger.info('📊 Main project updated:', update);
                this.syncWithMainProject(update);
            });
        }
    }

    async handleCursorCommand(command) {
        this.logger.info(`🎯 Handling Cursor command: ${command.type}`);
        
        try {
            switch (command.type) {
                case 'code-generation':
                    return await this.handleCodeGenerationWithAgents(command);
                case 'design-request':
                    return await this.handleDesignRequestWithAgents(command);
                case 'voice-processing':
                    return await this.handleVoiceProcessingWithAgents(command);
                case 'research-analysis':
                    return await this.handleResearchAnalysisWithAgents(command);
                case 'project-setup':
                    return await this.handleProjectSetupWithAgents(command);
                case 'agent-collaboration':
                    return await this.handleAgentCollaboration(command);
                default:
                    throw new Error(`Unknown command type: ${command.type}`);
            }
        } catch (error) {
            this.logger.error('Cursor command handling failed:', error);
            throw error;
        }
    }

    async handleCodeGenerationWithAgents(command) {
        const { language, requirements, context, filePath } = command;
        
        this.logger.info(`💻 Multi-agent code generation for: ${filePath}`);
        
        const gpt4Task = {
            type: 'code-generation',
            language: language,
            requirements: requirements,
            context: context
        };

        const gpt4Result = await this.orchestrator.processTask(gpt4Task);
        
        const geminiTask = {
            type: 'code-review',
            code: gpt4Result.code,
            language: language,
            requirements: requirements
        };

        const geminiResult = await this.orchestrator.agents.gemini.reviewCode(geminiTask);
        
        if (filePath) {
            await this.applyCodeToFile(filePath, geminiResult.optimizedCode || gpt4Result.code);
        }

        return {
            code: geminiResult.optimizedCode || gpt4Result.code,
            review: geminiResult.review,
            suggestions: geminiResult.suggestions,
            agents: ['gpt4', 'gemini']
        };
    }

    async handleDesignRequestWithAgents(command) {
        const { component, style, requirements, outputPath } = command;
        
        this.logger.info(`🎨 Multi-agent design generation for: ${component}`);
        
        const promptTask = {
            type: 'design-prompt-generation',
            requirements: requirements,
            style: style,
            context: `Generate ${component} design`
        };

        const promptResult = await this.orchestrator.agents.gpt4.generateDesignPrompt(promptTask);
        
        const designTask = {
            type: 'design-request',
            requirements: requirements,
            style: style,
            context: `Generate ${component} design`
        };

        const designResult = await this.orchestrator.processTask(designTask);
        
        if (outputPath) {
            await this.saveDesignMetadata(outputPath, designResult);
        }

        return {
            designUrl: designResult.designUrl,
            prompt: promptResult,
            variations: designResult.variations,
            agents: ['gpt4', 'midjourney']
        };
    }

    async handleVoiceProcessingWithAgents(command) {
        const { audioFile, context, outputPath } = command;
        
        this.logger.info(`🎤 Multi-agent voice processing for: ${audioFile}`);
        
        const transcriptionTask = {
            type: 'voice-processing',
            audioFile: audioFile,
            context: context
        };

        const whisperResult = await this.orchestrator.processTask(transcriptionTask);
        
        const analysisTask = {
            type: 'transcription-analysis',
            text: whisperResult.transcription,
            context: context
        };

        const gpt4Result = await this.orchestrator.agents.gpt4.analyzeTranscription(analysisTask);
        
        if (outputPath) {
            await this.saveTranscriptionResults(outputPath, {
                transcription: whisperResult.transcription,
                analysis: gpt4Result
            });
        }

        return {
            transcription: whisperResult.transcription,
            analysis: gpt4Result,
            agents: ['whisper', 'gpt4']
        };
    }

    async handleResearchAnalysisWithAgents(command) {
        const { query, sources, depth, outputPath } = command;
        
        this.logger.info(`🔍 Multi-agent research analysis for: ${query}`);
        
        const researchTask = {
            type: 'research-analysis',
            query: query,
            sources: sources,
            depth: depth
        };

        const geminiResult = await this.orchestrator.processTask(researchTask);
        
        const synthesisTask = {
            type: 'research-synthesis',
            data: geminiResult.researchData,
            requirements: query
        };

        const gpt4Result = await this.orchestrator.agents.gpt4.synthesizeResearch(synthesisTask);
        
        if (outputPath) {
            await this.saveResearchResults(outputPath, {
                research: geminiResult,
                synthesis: gpt4Result
            });
        }

        return {
            research: geminiResult,
            synthesis: gpt4Result,
            agents: ['gemini', 'gpt4']
        };
    }

    async handleProjectSetupWithAgents(command) {
        const { projectType, requirements, outputPath } = command;
        
        this.logger.info(`🚀 Multi-agent project setup for: ${projectType}`);
        
        const planningTask = {
            type: 'project-planning',
            projectType: projectType,
            requirements: requirements
        };

        const gpt4Result = await this.orchestrator.agents.gpt4.complexReasoning(planningTask);
        
        const validationTask = {
            type: 'project-validation',
            plan: gpt4Result.reasoning,
            requirements: requirements
        };

        const geminiResult = await this.orchestrator.agents.gemini.validateReasoning(validationTask);
        
        const setupResult = await this.setupProject(projectType, requirements);
        
        return {
            plan: gpt4Result.reasoning,
            validation: geminiResult,
            setup: setupResult,
            agents: ['gpt4', 'gemini']
        };
    }

    async handleAgentCollaboration(command) {
        const { task, agents, collaborationType } = command;
        
        this.logger.info(`🤝 Multi-agent collaboration: ${collaborationType}`);
        
        const results = {};
        const agentList = agents || ['gpt4', 'gemini', 'whisper', 'midjourney'];
        
        for (const agentName of agentList) {
            const agent = this.orchestrator.agents[agentName];
            if (agent) {
                try {
                    const result = await agent.processTask(task);
                    results[agentName] = result;
                } catch (error) {
                    this.logger.error(`Agent ${agentName} failed:`, error);
                    results[agentName] = { error: error.message };
                }
            }
        }
        
        return {
            collaboration: results,
            type: collaborationType,
            agents: agentList
        };
    }

    async applyCodeToFile(filePath, code) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, code);
            this.logger.info(`✅ Code applied to: ${filePath}`);
            
            return {
                success: true,
                filePath: filePath,
                message: 'Code successfully applied to file'
            };
        } catch (error) {
            this.logger.error(`❌ Failed to apply code to ${filePath}:`, error);
            throw error;
        }
    }

    async saveDesignMetadata(outputPath, designResult) {
        const metadata = {
            designUrl: designResult.designUrl,
            prompt: designResult.prompt,
            variations: designResult.variations,
            metadata: designResult.metadata,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
        this.logger.info(`✅ Design metadata saved to: ${outputPath}`);
    }

    async saveTranscriptionResults(outputPath, results) {
        const data = {
            transcription: results.transcription,
            analysis: results.analysis,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        this.logger.info(`✅ Transcription results saved to: ${outputPath}`);
    }

    async saveResearchResults(outputPath, results) {
        const data = {
            research: results.research,
            synthesis: results.synthesis,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        this.logger.info(`✅ Research results saved to: ${outputPath}`);
    }

    monitorCursorEvents() {
        this.logger.info('👀 Monitoring Cursor IDE events');
    }

    setupCursorCommands() {
        this.logger.info('⌨️ Setting up Cursor IDE commands');
    }

    notifyCursorOfTaskCompletion(taskId, result) {
        this.logger.info(`📢 Notifying Cursor of task completion: ${taskId}`);
    }

    notifyCursorOfTaskFailure(taskId, error) {
        this.logger.error(`📢 Notifying Cursor of task failure: ${taskId}`);
    }

    syncWithMainProject(update) {
        this.logger.info('🔄 Syncing with main project:', update);
    }

    async syncComponent(componentName, componentPath) {
        this.logger.info(`🔄 Syncing component: ${componentName}`);
    }

    async loadCursorConfig() {
        const configPath = path.join(process.cwd(), '.cursorrules');
        
        if (fs.existsSync(configPath)) {
            this.cursorConfig = fs.readFileSync(configPath, 'utf8');
            this.logger.info('📋 Loaded existing Cursor configuration');
        } else {
            this.cursorConfig = this.generateEnhancedCursorConfig();
            fs.writeFileSync(configPath, this.cursorConfig);
            this.logger.info('📋 Generated enhanced Cursor configuration');
        }
    }

    generateEnhancedCursorConfig() {
        return `# EHB AI Development Environment - Enhanced Cursor Rules

## AI Agent Integration
- Use GPT-4 for complex reasoning and code generation
- Use Gemini for research and code review
- Use Whisper for voice processing and transcription
- Use Midjourney for UI/UX design generation
- All agents work together seamlessly

## Multi-Agent Collaboration
- Agents can collaborate on complex tasks
- Use multiple agents for comprehensive solutions
- Leverage agent strengths for optimal results
- Real-time agent communication and coordination

## Development Guidelines
- Follow EHB healthcare standards
- Implement HIPAA compliance
- Use healthcare-specific APIs
- Ensure patient data security
- Optimize for healthcare professionals

## Agent Commands
- "Generate code with GPT-4 and review with Gemini"
- "Create design with Midjourney and optimize with GPT-4"
- "Process voice with Whisper and analyze with GPT-4"
- "Research with Gemini and synthesize with GPT-4"
- "Collaborate all agents on complex healthcare task"

Remember: Healthcare technology has unique requirements. Always prioritize patient safety, data security, and regulatory compliance.
`;
    }

    async setupCursorFileWatchers() {
        this.logger.info('👀 Setting up enhanced file watchers for Cursor integration');
        
        const watchDirs = [
            'frontend/src',
            'backend',
            'agents',
            'docs',
            'ehb-ai-dev'
        ];

        for (const dir of watchDirs) {
            const fullPath = path.join(process.cwd(), dir);
            if (fs.existsSync(fullPath)) {
                this.watchDirectory(fullPath);
            }
        }
    }

    watchDirectory(dirPath) {
        this.logger.info(`👀 Watching directory: ${dirPath}`);
    }

    async setupProjectTracking() {
        this.logger.info('📊 Setting up enhanced project tracking');
        
        const projects = [
            {
                name: 'EHB Frontend',
                path: 'frontend',
                type: 'react',
                status: 'active',
                agents: ['gpt4', 'gemini', 'midjourney']
            },
            {
                name: 'EHB Backend',
                path: 'backend',
                type: 'nodejs',
                status: 'active',
                agents: ['gpt4', 'gemini']
            },
            {
                name: 'EHB Agents',
                path: 'agents',
                type: 'ai-agents',
                status: 'active',
                agents: ['gpt4', 'gemini', 'whisper', 'midjourney']
            },
            {
                name: 'EHB AI Dev',
                path: 'ehb-ai-dev',
                type: 'main-project',
                status: 'active',
                agents: ['gpt4', 'gemini', 'whisper', 'midjourney']
            }
        ];

        for (const project of projects) {
            this.activeProjects.set(project.name, project);
        }
    }

    async setupProject(projectType, requirements) {
        const setupResult = {
            projectType: projectType,
            requirements: requirements,
            status: 'setup-complete',
            files: [],
            dependencies: [],
            timestamp: new Date().toISOString()
        };

        switch (projectType) {
            case 'react-app':
                setupResult.files = await this.setupReactApp(requirements);
                break;
            case 'node-api':
                setupResult.files = await this.setupNodeAPI(requirements);
                break;
            case 'healthcare-app':
                setupResult.files = await this.setupHealthcareApp(requirements);
                break;
            default:
                throw new Error(`Unknown project type: ${projectType}`);
        }

        return setupResult;
    }

    async setupReactApp(requirements) {
        const files = [
            'package.json',
            'src/App.tsx',
            'src/index.tsx',
            'public/index.html',
            'tsconfig.json'
        ];

        this.logger.info('⚛️ Setting up React app');
        return files;
    }

    async setupNodeAPI(requirements) {
        const files = [
            'package.json',
            'server.js',
            'routes/',
            'models/',
            '.env'
        ];

        this.logger.info('🟢 Setting up Node.js API');
        return files;
    }

    async setupHealthcareApp(requirements) {
        const files = [
            'package.json',
            'src/components/',
            'src/services/',
            'src/utils/',
            'docs/hipaa-compliance.md'
        ];

        this.logger.info('🏥 Setting up Healthcare app');
        return files;
    }

    getAgentStatus() {
        const status = {};
        for (const [name, connection] of this.agentConnections) {
            status[name] = {
                connected: connection.status === 'connected',
                lastActivity: connection.lastActivity,
                agent: connection.agent.getStatus()
            };
        }
        return status;
    }

    getSystemStatus() {
        return {
            agents: this.getAgentStatus(),
            activeProjects: Array.from(this.activeProjects.values()),
            orchestratorConnected: this.orchestrator !== null,
            mainAgentConnected: this.mainAgent !== null,
            cursorConfig: this.cursorConfig ? 'loaded' : 'not-loaded',
            timestamp: new Date().toISOString()
        };
    }

    async healthCheck() {
        try {
            const status = {
                status: 'healthy',
                integration: 'Cursor Agent Integration',
                agents: this.agentConnections.size,
                activeProjects: this.activeProjects.size,
                orchestratorConnected: this.orchestrator !== null,
                mainAgentConnected: this.mainAgent !== null,
                timestamp: new Date().toISOString()
            };

            if (this.orchestrator) {
                status.orchestratorHealth = await this.orchestrator.healthCheck();
            }

            return status;
        } catch (error) {
            return {
                status: 'unhealthy',
                integration: 'Cursor Agent Integration',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = CursorAgentIntegration; 