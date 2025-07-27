const EventEmitter = require('events');
const winston = require('winston');

class BaseAgent extends EventEmitter {
    constructor(name, type, config = {}) {
        super();
        this.name = name;
        this.type = type;
        this.config = config;
        this.memory = new Map();
        this.status = 'initializing';
        this.tasks = [];
        this.capabilities = [];
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
                new winston.transports.File({
                    filename: `logs/${this.name}-agent.log`
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize() {
        this.logger.info(`🤖 Initializing ${this.name} agent...`);
        try {
            await this.setupCapabilities();
            await this.loadMemory();
            this.status = 'ready';
            this.logger.info(`✅ ${this.name} agent initialized successfully`);
            this.emit('agent-ready', this.name);
            return true;
        } catch (error) {
            this.logger.error(`❌ ${this.name} agent initialization failed:`, error);
            this.status = 'error';
            throw error;
        }
    }

    async setupCapabilities() {
        this.capabilities = this.config.capabilities || [];
        this.logger.info(`📋 ${this.name} capabilities: ${this.capabilities.join(', ')}`);
    }

    async loadMemory() {
        // Load persistent memory if exists
        const memoryPath = `memory/${this.name}-memory.json`;
        try {
            const fs = require('fs');
            if (fs.existsSync(memoryPath)) {
                const memoryData = fs.readFileSync(memoryPath, 'utf8');
                const savedMemory = JSON.parse(memoryData);
                this.memory = new Map(Object.entries(savedMemory));
                this.logger.info(`💾 Memory loaded for ${this.name}`);
            }
        } catch (error) {
            this.logger.warn(`⚠️ Could not load memory for ${this.name}:`, error.message);
        }
    }

    async saveMemory() {
        const fs = require('fs');
        const path = require('path');
        const memoryPath = `memory/${this.name}-memory.json`;

        try {
            const dir = path.dirname(memoryPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const memoryObject = Object.fromEntries(this.memory);
            fs.writeFileSync(memoryPath, JSON.stringify(memoryObject, null, 2));
            this.logger.info(`💾 Memory saved for ${this.name}`);
        } catch (error) {
            this.logger.error(`❌ Could not save memory for ${this.name}:`, error);
        }
    }

    async executeTask(task) {
        this.logger.info(`🎯 ${this.name} executing task: ${task.type}`);

        try {
            this.status = 'busy';
            const result = await this.processTask(task);
            this.tasks.push({
                id: Date.now(),
                type: task.type,
                status: 'completed',
                result: result,
                timestamp: new Date().toISOString()
            });

            this.status = 'ready';
            this.logger.info(`✅ Task completed: ${task.type}`);
            this.emit('task-completed', { agent: this.name, task, result });
            return result;
        } catch (error) {
            this.status = 'error';
            this.logger.error(`❌ Task failed: ${task.type}`, error);
            this.emit('task-failed', { agent: this.name, task, error });
            throw error;
        }
    }

    async processTask(task) {
        // Override this method in specific agents
        throw new Error(`Task processing not implemented for ${this.name}`);
    }

    async communicate(message) {
        this.logger.info(`💬 ${this.name} sending message: ${message.type}`);
        this.emit('message-sent', { from: this.name, message });
        return message;
    }

    async receiveMessage(message) {
        this.logger.info(`📨 ${this.name} received message: ${message.type}`);
        this.emit('message-received', { to: this.name, message });

        // Store in memory
        const messageKey = `message_${Date.now()}`;
        this.memory.set(messageKey, {
            ...message,
            receivedAt: new Date().toISOString()
        });

        return this.handleMessage(message);
    }

    async handleMessage(message) {
        // Override this method in specific agents
        this.logger.info(`📝 ${this.name} handling message: ${message.type}`);
        return { status: 'received', agent: this.name };
    }

    getStatus() {
        return {
            name: this.name,
            type: this.type,
            status: this.status,
            capabilities: this.capabilities,
            taskCount: this.tasks.length,
            memorySize: this.memory.size,
            lastActivity: this.tasks.length > 0 ? this.tasks[this.tasks.length - 1].timestamp : null
        };
    }

    async healthCheck() {
        const health = {
            agent: this.name,
            status: this.status,
            memory: this.memory.size,
            tasks: this.tasks.length,
            timestamp: new Date().toISOString()
        };

        this.logger.info(`🏥 Health check for ${this.name}:`, health);
        return health;
    }
}

module.exports = BaseAgent;
