const EventEmitter = require('events');
const winston = require('winston');

class TaskExecutor extends EventEmitter {
    constructor() {
        super();
        this.tasks = new Map();
        this.executingTasks = new Map();
        this.completedTasks = new Map();
        this.failedTasks = new Map();
        this.agents = new Map();
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
                new winston.transports.File({ filename: 'logs/task-executor.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    registerAgent(agent) {
        this.agents.set(agent.name, agent);
        this.logger.info(`🤖 Registered agent: ${agent.name}`);

        // Listen to agent events
        agent.on('task-completed', (data) => {
            this.handleTaskCompleted(data);
        });

        agent.on('task-failed', (data) => {
            this.handleTaskFailed(data);
        });

        agent.on('agent-ready', (agentName) => {
            this.logger.info(`✅ Agent ready: ${agentName}`);
        });
    }

    async executeTask(task) {
        const taskId = this.generateTaskId();
        task.id = taskId;
        task.status = 'pending';
        task.createdAt = new Date().toISOString();

        this.tasks.set(taskId, task);
        this.logger.info(`🎯 New task created: ${taskId} - ${task.type}`);

        try {
            const agent = this.findBestAgent(task);
            if (!agent) {
                throw new Error(`No suitable agent found for task: ${task.type}`);
            }

            task.status = 'executing';
            task.assignedAgent = agent.name;
            this.executingTasks.set(taskId, task);

            this.logger.info(`🚀 Executing task ${taskId} with agent ${agent.name}`);
            const result = await agent.executeTask(task);

            return { taskId, result, status: 'completed' };
        } catch (error) {
            this.logger.error(`❌ Task execution failed: ${taskId}`, error);
            task.status = 'failed';
            task.error = error.message;
            this.failedTasks.set(taskId, task);
            throw error;
        }
    }

    findBestAgent(task) {
        const suitableAgents = [];

        for (const [name, agent] of this.agents) {
            if (agent.status === 'ready' && this.canHandleTask(agent, task)) {
                suitableAgents.push(agent);
            }
        }

        if (suitableAgents.length === 0) {
            return null;
        }

        // Simple priority-based selection
        return suitableAgents.sort((a, b) => {
            const aPriority = this.getAgentPriority(a, task);
            const bPriority = this.getAgentPriority(b, task);
            return bPriority - aPriority;
        })[0];
    }

    canHandleTask(agent, task) {
        // Check if agent has the required capabilities
        if (task.requiredCapabilities) {
            return task.requiredCapabilities.every(cap =>
                agent.capabilities.includes(cap)
            );
        }

        // Check agent type compatibility
        if (task.agentType) {
            return agent.type === task.agentType;
        }

        return true;
    }

    getAgentPriority(agent, task) {
        let priority = 0;

        // Higher priority for agents with matching capabilities
        if (task.requiredCapabilities) {
            const matchingCaps = task.requiredCapabilities.filter(cap =>
                agent.capabilities.includes(cap)
            ).length;
            priority += matchingCaps * 10;
        }

        // Higher priority for agents with less current load
        priority += (10 - agent.tasks.length);

        // Higher priority for agents that have been idle longer
        if (agent.tasks.length > 0) {
            const lastTask = agent.tasks[agent.tasks.length - 1];
            const timeSinceLastTask = Date.now() - new Date(lastTask.timestamp).getTime();
            priority += Math.min(timeSinceLastTask / 1000, 10); // Max 10 points for time
        }

        return priority;
    }

    handleTaskCompleted(data) {
        const { agent, task, result } = data;
        const taskId = task.id;

        this.logger.info(`✅ Task completed: ${taskId} by ${agent}`);

        const executingTask = this.executingTasks.get(taskId);
        if (executingTask) {
            executingTask.status = 'completed';
            executingTask.result = result;
            executingTask.completedAt = new Date().toISOString();
            executingTask.completedBy = agent;

            this.completedTasks.set(taskId, executingTask);
            this.executingTasks.delete(taskId);

            this.emit('task-completed', { taskId, agent, result });
        }
    }

    handleTaskFailed(data) {
        const { agent, task, error } = data;
        const taskId = task.id;

        this.logger.error(`❌ Task failed: ${taskId} by ${agent}`, error);

        const executingTask = this.executingTasks.get(taskId);
        if (executingTask) {
            executingTask.status = 'failed';
            executingTask.error = error.message;
            executingTask.failedAt = new Date().toISOString();
            executingTask.failedBy = agent;

            this.failedTasks.set(taskId, executingTask);
            this.executingTasks.delete(taskId);

            this.emit('task-failed', { taskId, agent, error });
        }
    }

    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async monitorProgress(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        return {
            taskId,
            status: task.status,
            progress: this.calculateProgress(task),
            assignedAgent: task.assignedAgent,
            createdAt: task.createdAt,
            result: task.result,
            error: task.error
        };
    }

    calculateProgress(task) {
        switch (task.status) {
            case 'pending': return 0;
            case 'executing': return 50;
            case 'completed': return 100;
            case 'failed': return -1;
            default: return 0;
        }
    }

    async handleError(error) {
        this.logger.error('🚨 Task executor error:', error);

        // Try to recover or retry failed tasks
        for (const [taskId, task] of this.failedTasks) {
            if (task.retryCount < (task.maxRetries || 3)) {
                task.retryCount = (task.retryCount || 0) + 1;
                task.status = 'pending';
                this.logger.info(`🔄 Retrying task: ${taskId} (attempt ${task.retryCount})`);

                // Move back to pending tasks
                this.tasks.set(taskId, task);
                this.failedTasks.delete(taskId);

                // Re-execute
                try {
                    await this.executeTask(task);
                } catch (retryError) {
                    this.logger.error(`❌ Retry failed for task: ${taskId}`, retryError);
                }
            }
        }
    }

    getStatus() {
        return {
            totalTasks: this.tasks.size,
            executingTasks: this.executingTasks.size,
            completedTasks: this.completedTasks.size,
            failedTasks: this.failedTasks.size,
            registeredAgents: this.agents.size,
            activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'ready').length
        };
    }

    async healthCheck() {
        const health = {
            executor: 'TaskExecutor',
            status: 'healthy',
            tasks: this.getStatus(),
            agents: Array.from(this.agents.values()).map(agent => agent.getStatus()),
            timestamp: new Date().toISOString()
        };

        this.logger.info('🏥 Task executor health check:', health);
        return health;
    }
}

module.exports = TaskExecutor;
