const { EventEmitter } = require('events');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

class CursorIntegration extends EventEmitter {
    constructor() {
        super();
        this.orchestrator = null;
        this.cursorConfig = null;
        this.activeProjects = new Map();
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
                new winston.transports.File({ filename: 'logs/cursor-integration.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize(orchestrator) {
        this.orchestrator = orchestrator;
        this.logger.info('🚀 Initializing Cursor Integration...');

        try {
            // Load Cursor configuration
            await this.loadCursorConfig();
            
            // Setup file watchers
            await this.setupFileWatchers();
            
            // Initialize project tracking
            await this.initializeProjectTracking();
            
            this.logger.info('✅ Cursor Integration initialized successfully');
            this.emit('cursor-ready');
            
        } catch (error) {
            this.logger.error('❌ Cursor Integration initialization failed:', error);
            throw error;
        }
    }

    async loadCursorConfig() {
        const configPath = path.join(process.cwd(), '.cursorrules');
        
        if (fs.existsSync(configPath)) {
            this.cursorConfig = fs.readFileSync(configPath, 'utf8');
            this.logger.info('📋 Loaded Cursor configuration');
        } else {
            this.cursorConfig = this.generateDefaultCursorConfig();
            fs.writeFileSync(configPath, this.cursorConfig);
            this.logger.info('📋 Generated default Cursor configuration');
        }
    }

    generateDefaultCursorConfig() {
        return `# EHB AI Development Environment - Cursor Rules

## AI Agent Integration
- Use GPT-4 for complex reasoning and code generation
- Use Gemini for research and code review
- Use Whisper for voice processing and transcription
- Use Midjourney for UI/UX design generation

## Development Guidelines
- Follow EHB healthcare standards
- Implement HIPAA compliance
- Use healthcare-specific APIs
- Ensure patient data security
- Optimize for healthcare professionals

## Code Quality
- Write clean, well-documented code
- Follow TypeScript best practices
- Implement proper error handling
- Use modern React patterns
- Ensure accessibility compliance

## Healthcare Focus
- Patient data protection
- Medical data validation
- Clinical workflow optimization
- Healthcare compliance
- Medical device integration

## Auto Actions
- Install missing dependencies
- Setup SDKs and APIs automatically
- Configure healthcare standards
- Run security audits
- Generate documentation
- Deploy automatically
- Monitor performance
- Track errors and issues

## Next Actions Priority
1. Analyze current project state
2. Install missing dependencies
3. Setup development environment
4. Configure healthcare APIs
5. Implement security measures
6. Create test suite
7. Optimize performance
8. Generate documentation
9. Deploy to staging
10. Monitor and maintain

Remember: Healthcare technology has unique requirements. Always prioritize patient safety, data security, and regulatory compliance.
`;
    }

    async setupFileWatchers() {
        this.logger.info('👀 Setting up file watchers for Cursor integration');
        
        // Watch for file changes in key directories
        const watchDirs = [
            'frontend/src',
            'backend',
            'agents',
            'docs'
        ];

        for (const dir of watchDirs) {
            const fullPath = path.join(process.cwd(), dir);
            if (fs.existsSync(fullPath)) {
                this.watchDirectory(fullPath);
            }
        }
    }

    watchDirectory(dirPath) {
        // In a real implementation, you'd use fs.watch or chokidar
        // For now, we'll simulate file watching
        this.logger.info(`👀 Watching directory: ${dirPath}`);
    }

    async initializeProjectTracking() {
        this.logger.info('📊 Initializing project tracking');
        
        // Track active projects and their status
        const projects = [
            {
                name: 'EHB Frontend',
                path: 'frontend',
                type: 'react',
                status: 'active'
            },
            {
                name: 'EHB Backend',
                path: 'backend',
                type: 'nodejs',
                status: 'active'
            },
            {
                name: 'EHB Agents',
                path: 'agents',
                type: 'ai-agents',
                status: 'active'
            }
        ];

        for (const project of projects) {
            this.activeProjects.set(project.name, project);
        }
    }

    async handleCursorCommand(command) {
        this.logger.info(`🎯 Handling Cursor command: ${command.type}`);
        
        try {
            switch (command.type) {
                case 'code-generation':
                    return await this.handleCodeGeneration(command);
                case 'design-request':
                    return await this.handleDesignRequest(command);
                case 'voice-processing':
                    return await this.handleVoiceProcessing(command);
                case 'research-analysis':
                    return await this.handleResearchAnalysis(command);
                case 'file-analysis':
                    return await this.handleFileAnalysis(command);
                case 'project-setup':
                    return await this.handleProjectSetup(command);
                default:
                    throw new Error(`Unknown command type: ${command.type}`);
            }
        } catch (error) {
            this.logger.error('Cursor command handling failed:', error);
            throw error;
        }
    }

    async handleCodeGeneration(command) {
        const { language, requirements, context, filePath } = command;
        
        this.logger.info(`💻 Generating code for: ${filePath}`);
        
        const task = {
            type: 'code-generation',
            language: language,
            requirements: requirements,
            context: context,
            filePath: filePath
        };

        const result = await this.orchestrator.processTask(task);
        
        // Apply the generated code to the file
        if (result.code && filePath) {
            await this.applyCodeToFile(filePath, result.code);
        }

        return result;
    }

    async handleDesignRequest(command) {
        const { component, style, requirements, outputPath } = command;
        
        this.logger.info(`🎨 Generating design for: ${component}`);
        
        const task = {
            type: 'design-request',
            requirements: requirements,
            style: style,
            context: `Generate ${component} design`
        };

        const result = await this.orchestrator.processTask(task);
        
        // Save design metadata
        if (outputPath) {
            await this.saveDesignMetadata(outputPath, result);
        }

        return result;
    }

    async handleVoiceProcessing(command) {
        const { audioFile, context, outputPath } = command;
        
        this.logger.info(`🎤 Processing voice: ${audioFile}`);
        
        const task = {
            type: 'voice-processing',
            audioFile: audioFile,
            context: context
        };

        const result = await this.orchestrator.processTask(task);
        
        // Save transcription
        if (outputPath) {
            await this.saveTranscription(outputPath, result);
        }

        return result;
    }

    async handleResearchAnalysis(command) {
        const { query, sources, depth, outputPath } = command;
        
        this.logger.info(`🔍 Researching: ${query}`);
        
        const task = {
            type: 'research-analysis',
            query: query,
            sources: sources,
            depth: depth
        };

        const result = await this.orchestrator.processTask(task);
        
        // Save research results
        if (outputPath) {
            await this.saveResearchResults(outputPath, result);
        }

        return result;
    }

    async handleFileAnalysis(command) {
        const { filePath, analysisType } = command;
        
        this.logger.info(`📄 Analyzing file: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileExtension = path.extname(filePath);
        
        const analysis = {
            filePath: filePath,
            extension: fileExtension,
            size: fileContent.length,
            lines: fileContent.split('\n').length,
            analysis: await this.analyzeFileContent(fileContent, fileExtension, analysisType)
        };

        return analysis;
    }

    async handleProjectSetup(command) {
        const { projectType, requirements, outputPath } = command;
        
        this.logger.info(`🚀 Setting up project: ${projectType}`);
        
        const setupResult = await this.setupProject(projectType, requirements);
        
        if (outputPath) {
            await this.saveProjectSetup(outputPath, setupResult);
        }

        return setupResult;
    }

    async applyCodeToFile(filePath, code) {
        try {
            // Create directory if it doesn't exist
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

    async saveTranscription(outputPath, transcriptionResult) {
        const transcription = {
            text: transcriptionResult.transcription,
            analysis: transcriptionResult.analysis,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(outputPath, JSON.stringify(transcription, null, 2));
        this.logger.info(`✅ Transcription saved to: ${outputPath}`);
    }

    async saveResearchResults(outputPath, researchResult) {
        const research = {
            query: researchResult.researchData.query,
            results: researchResult.researchData.results,
            insights: researchResult.insights,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(outputPath, JSON.stringify(research, null, 2));
        this.logger.info(`✅ Research results saved to: ${outputPath}`);
    }

    async analyzeFileContent(content, extension, analysisType) {
        const analysis = {
            type: analysisType || 'general',
            extension: extension,
            contentLength: content.length,
            lineCount: content.split('\n').length,
            characterCount: content.length,
            wordCount: content.split(/\s+/).length
        };

        // Language-specific analysis
        switch (extension) {
            case '.js':
            case '.ts':
            case '.jsx':
            case '.tsx':
                analysis.language = 'javascript';
                analysis.functions = this.countFunctions(content);
                analysis.imports = this.countImports(content);
                break;
            case '.py':
                analysis.language = 'python';
                analysis.functions = this.countPythonFunctions(content);
                analysis.imports = this.countPythonImports(content);
                break;
            case '.json':
                analysis.language = 'json';
                analysis.isValid = this.isValidJSON(content);
                break;
            case '.md':
                analysis.language = 'markdown';
                analysis.headings = this.countMarkdownHeadings(content);
                break;
            default:
                analysis.language = 'unknown';
        }

        return analysis;
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

    async saveProjectSetup(outputPath, setupResult) {
        fs.writeFileSync(outputPath, JSON.stringify(setupResult, null, 2));
        this.logger.info(`✅ Project setup saved to: ${outputPath}`);
    }

    // Helper methods for code analysis
    countFunctions(content) {
        const functionPatterns = [
            /function\s+\w+\s*\(/g,
            /const\s+\w+\s*=\s*\(/g,
            /let\s+\w+\s*=\s*\(/g,
            /var\s+\w+\s*=\s*\(/g
        ];
        
        let count = 0;
        for (const pattern of functionPatterns) {
            const matches = content.match(pattern);
            if (matches) count += matches.length;
        }
        
        return count;
    }

    countImports(content) {
        const importPattern = /import\s+.*from\s+['"][^'"]+['"]/g;
        const matches = content.match(importPattern);
        return matches ? matches.length : 0;
    }

    countPythonFunctions(content) {
        const functionPattern = /def\s+\w+\s*\(/g;
        const matches = content.match(functionPattern);
        return matches ? matches.length : 0;
    }

    countPythonImports(content) {
        const importPattern = /import\s+.*/g;
        const matches = content.match(importPattern);
        return matches ? matches.length : 0;
    }

    isValidJSON(content) {
        try {
            JSON.parse(content);
            return true;
        } catch {
            return false;
        }
    }

    countMarkdownHeadings(content) {
        const headingPattern = /^#{1,6}\s+.*$/gm;
        const matches = content.match(headingPattern);
        return matches ? matches.length : 0;
    }

    getProjectStatus() {
        return {
            activeProjects: Array.from(this.activeProjects.values()),
            orchestratorStatus: this.orchestrator ? this.orchestrator.getSystemStatus() : null,
            cursorConfig: this.cursorConfig ? 'loaded' : 'not-loaded',
            timestamp: new Date().toISOString()
        };
    }

    async healthCheck() {
        try {
            const status = {
                status: 'healthy',
                integration: 'Cursor',
                activeProjects: this.activeProjects.size,
                orchestratorConnected: this.orchestrator !== null,
                timestamp: new Date().toISOString()
            };

            if (this.orchestrator) {
                status.orchestratorHealth = await this.orchestrator.healthCheck();
            }

            return status;
        } catch (error) {
            return {
                status: 'unhealthy',
                integration: 'Cursor',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = CursorIntegration; 