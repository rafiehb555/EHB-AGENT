/**
 * 🧠 EHB Agent Bridge - Core Message Handler
 * 
 * This is the central nervous system of the EHB AI Dev Agent ecosystem.
 * It manages real-time communication between agents, task delegation,
 * dependency management, and shared context memory.
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AgentBridge extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.messageQueue = [];
        this.sharedLog = [];
        this.taskRegistry = new Map();
        this.dependencies = new Map();
        this.conflictResolver = null;
        
        // Initialize core directories
        this.initDirectories();
        
        // Load existing shared log
        this.loadSharedLog();
        
        console.log('🧠 EHB Agent Bridge initialized');
    }

    /**
     * Initialize required directories
     */
    initDirectories() {
        const dirs = [
            'logs',
            'shared',
            'temp',
            'exports'
        ];

        dirs.forEach(dir => {
            const dirPath = path.join(__dirname, '..', dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }

    /**
     * Register an agent with the bridge
     */
    registerAgent(agentId, agentConfig) {
        const agent = {
            id: agentId,
            name: agentConfig.name || agentId,
            role: agentConfig.role || 'utility',
            priority: agentConfig.priority || 'low',
            capabilities: agentConfig.capabilities || [],
            status: 'active',
            lastSeen: Date.now(),
            ...agentConfig
        };

        this.agents.set(agentId, agent);
        
        // Log agent registration
        this.logMessage('system', 'agent-registered', {
            agentId,
            agentName: agent.name,
            role: agent.role,
            priority: agent.priority
        });

        console.log(`✅ Agent registered: ${agent.name} (${agent.role})`);
        return agent;
    }

    /**
     * Send message between agents
     */
    sendMessage(fromAgentId, toAgentId, messageType, payload, options = {}) {
        const message = {
            id: this.generateMessageId(),
            from: fromAgentId,
            to: toAgentId,
            type: messageType,
            payload,
            timestamp: Date.now(),
            priority: options.priority || 'normal',
            requiresResponse: options.requiresResponse || false,
            correlationId: options.correlationId || null
        };

        // Add to queue
        this.messageQueue.push(message);

        // Log the message
        this.logMessage(fromAgentId, messageType, payload);

        // Emit event for real-time processing
        this.emit('message', message);

        // Process message immediately if target agent is available
        this.processMessage(message);

        return message.id;
    }

    /**
     * Broadcast message to all agents
     */
    broadcastMessage(fromAgentId, messageType, payload, options = {}) {
        const message = {
            id: this.generateMessageId(),
            from: fromAgentId,
            to: 'broadcast',
            type: messageType,
            payload,
            timestamp: Date.now(),
            priority: options.priority || 'normal',
            isBroadcast: true
        };

        this.messageQueue.push(message);
        this.logMessage(fromAgentId, `broadcast-${messageType}`, payload);
        this.emit('broadcast', message);

        // Process broadcast
        this.agents.forEach((agent, agentId) => {
            if (agentId !== fromAgentId && agent.status === 'active') {
                this.processMessage({ ...message, to: agentId });
            }
        });

        return message.id;
    }

    /**
     * Delegate task to another agent
     */
    delegateTask(fromAgentId, toAgentId, taskData, options = {}) {
        const task = {
            id: this.generateTaskId(),
            from: fromAgentId,
            to: toAgentId,
            type: 'task-delegation',
            task: taskData,
            status: 'pending',
            priority: options.priority || 'normal',
            dependencies: options.dependencies || [],
            estimatedTime: options.estimatedTime || 30000, // 30 seconds default
            timestamp: Date.now()
        };

        // Register task
        this.taskRegistry.set(task.id, task);

        // Send delegation message
        this.sendMessage(fromAgentId, toAgentId, 'task-delegation', {
            taskId: task.id,
            task: taskData,
            dependencies: task.dependencies,
            estimatedTime: task.estimatedTime
        }, { requiresResponse: true });

        // Log delegation
        this.logMessage(fromAgentId, 'task-delegated', {
            taskId: task.id,
            toAgent: toAgentId,
            taskType: taskData.type
        });

        return task.id;
    }

    /**
     * Process incoming message
     */
    processMessage(message) {
        const targetAgent = this.agents.get(message.to);
        
        if (!targetAgent) {
            console.warn(`⚠️ Target agent not found: ${message.to}`);
            return;
        }

        if (targetAgent.status !== 'active') {
            console.warn(`⚠️ Target agent inactive: ${message.to}`);
            return;
        }

        // Update agent last seen
        targetAgent.lastSeen = Date.now();

        // Emit agent-specific event
        this.emit(`agent-${message.to}`, message);

        // Handle different message types
        switch (message.type) {
            case 'task-delegation':
                this.handleTaskDelegation(message);
                break;
            case 'task-completion':
                this.handleTaskCompletion(message);
                break;
            case 'dependency-ready':
                this.handleDependencyReady(message);
                break;
            case 'conflict-resolution':
                this.handleConflictResolution(message);
                break;
            default:
                // Generic message processing
                this.emit('message-processed', message);
        }
    }

    /**
     * Handle task delegation
     */
    handleTaskDelegation(message) {
        const task = this.taskRegistry.get(message.payload.taskId);
        if (!task) return;

        // Check dependencies
        if (message.payload.dependencies && message.payload.dependencies.length > 0) {
            const pendingDeps = message.payload.dependencies.filter(dep => 
                !this.dependencies.has(dep) || this.dependencies.get(dep).status !== 'completed'
            );

            if (pendingDeps.length > 0) {
                task.status = 'waiting-dependencies';
                this.dependencies.set(task.id, {
                    taskId: task.id,
                    dependencies: pendingDeps,
                    status: 'pending'
                });
                return;
            }
        }

        // Task can proceed
        task.status = 'in-progress';
        this.emit('task-started', task);
    }

    /**
     * Handle task completion
     */
    handleTaskCompletion(message) {
        const task = this.taskRegistry.get(message.payload.taskId);
        if (!task) return;

        task.status = 'completed';
        task.result = message.payload.result;
        task.completedAt = Date.now();

        // Notify dependent tasks
        this.notifyDependentTasks(task.id);

        // Log completion
        this.logMessage(message.from, 'task-completed', {
            taskId: task.id,
            result: message.payload.result
        });

        this.emit('task-completed', task);
    }

    /**
     * Notify tasks waiting for dependencies
     */
    notifyDependentTasks(completedTaskId) {
        this.dependencies.forEach((dep, taskId) => {
            if (dep.dependencies.includes(completedTaskId)) {
                dep.dependencies = dep.dependencies.filter(d => d !== completedTaskId);
                
                if (dep.dependencies.length === 0) {
                    // All dependencies met
                    const task = this.taskRegistry.get(taskId);
                    if (task) {
                        task.status = 'ready';
                        this.emit('task-ready', task);
                    }
                }
            }
        });
    }

    /**
     * Handle dependency ready
     */
    handleDependencyReady(message) {
        this.notifyDependentTasks(message.payload.dependencyId);
    }

    /**
     * Handle conflict resolution
     */
    handleConflictResolution(message) {
        if (this.conflictResolver) {
            this.conflictResolver(message);
        } else {
            // Default conflict resolution: higher priority agent wins
            const agent1 = this.agents.get(message.payload.agent1);
            const agent2 = this.agents.get(message.payload.agent2);
            
            if (agent1 && agent2) {
                const priority1 = this.getPriorityLevel(agent1.priority);
                const priority2 = this.getPriorityLevel(agent2.priority);
                
                const winner = priority1 >= priority2 ? message.payload.agent1 : message.payload.agent2;
                
                this.sendMessage('system', winner, 'conflict-resolved', {
                    conflictId: message.payload.conflictId,
                    resolution: 'priority-based',
                    winner
                });
            }
        }
    }

    /**
     * Get priority level as number
     */
    getPriorityLevel(priority) {
        const levels = { 'high': 3, 'medium': 2, 'low': 1 };
        return levels[priority] || 1;
    }

    /**
     * Log message to shared log
     */
    logMessage(agentId, messageType, payload) {
        const logEntry = {
            timestamp: Date.now(),
            agentId,
            type: messageType,
            payload,
            logId: this.generateLogId()
        };

        this.sharedLog.push(logEntry);

        // Save to file
        this.saveSharedLog();

        // Emit log event
        this.emit('log-entry', logEntry);
    }

    /**
     * Load shared log from file
     */
    loadSharedLog() {
        const logPath = path.join(__dirname, '..', 'logs', 'sharedLog.json');
        try {
            if (fs.existsSync(logPath)) {
                const data = fs.readFileSync(logPath, 'utf8');
                this.sharedLog = JSON.parse(data);
            }
        } catch (error) {
            console.warn('⚠️ Could not load shared log:', error.message);
        }
    }

    /**
     * Save shared log to file
     */
    saveSharedLog() {
        const logPath = path.join(__dirname, '..', 'logs', 'sharedLog.json');
        try {
            fs.writeFileSync(logPath, JSON.stringify(this.sharedLog, null, 2));
        } catch (error) {
            console.error('❌ Error saving shared log:', error.message);
        }
    }

    /**
     * Get agent status
     */
    getAgentStatus(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return null;

        return {
            id: agent.id,
            name: agent.name,
            role: agent.role,
            status: agent.status,
            lastSeen: agent.lastSeen,
            capabilities: agent.capabilities
        };
    }

    /**
     * Get all active agents
     */
    getActiveAgents() {
        const active = [];
        this.agents.forEach((agent, id) => {
            if (agent.status === 'active') {
                active.push(this.getAgentStatus(id));
            }
        });
        return active;
    }

    /**
     * Get task status
     */
    getTaskStatus(taskId) {
        return this.taskRegistry.get(taskId);
    }

    /**
     * Get recent messages
     */
    getRecentMessages(limit = 50) {
        return this.messageQueue.slice(-limit);
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique log ID
     */
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Set conflict resolver
     */
    setConflictResolver(resolver) {
        this.conflictResolver = resolver;
    }

    /**
     * Cleanup old messages and tasks
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Clean old messages
        this.messageQueue = this.messageQueue.filter(msg => 
            now - msg.timestamp < maxAge
        );

        // Clean completed tasks older than 1 hour
        this.taskRegistry.forEach((task, id) => {
            if (task.status === 'completed' && now - task.completedAt > 60 * 60 * 1000) {
                this.taskRegistry.delete(id);
            }
        });

        // Clean old log entries (keep last 1000)
        if (this.sharedLog.length > 1000) {
            this.sharedLog = this.sharedLog.slice(-1000);
        }
    }

    /**
     * Get system statistics
     */
    getStats() {
        return {
            totalAgents: this.agents.size,
            activeAgents: this.getActiveAgents().length,
            pendingTasks: Array.from(this.taskRegistry.values()).filter(t => t.status === 'pending').length,
            activeTasks: Array.from(this.taskRegistry.values()).filter(t => t.status === 'in-progress').length,
            messageQueueSize: this.messageQueue.length,
            logEntries: this.sharedLog.length
        };
    }
}

module.exports = AgentBridge; 