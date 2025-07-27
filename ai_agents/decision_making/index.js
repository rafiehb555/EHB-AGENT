const EventEmitter = require('events');
const winston = require('winston');

class DecisionMaking extends EventEmitter {
    constructor() {
        super();
        this.decisionHistory = [];
        this.priorityQueue = [];
        this.resourceAllocation = new Map();
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
                new winston.transports.File({ filename: 'logs/decision-making.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async makeDecision(context) {
        const decisionId = this.generateDecisionId();
        const decision = {
            id: decisionId,
            context: context,
            timestamp: new Date().toISOString(),
            status: 'processing'
        };

        this.logger.info(`🧠 Making decision: ${decisionId} for context: ${context.type}`);

        try {
            const result = await this.processDecision(context);
            decision.result = result;
            decision.status = 'completed';

            this.decisionHistory.push(decision);
            this.emit('decision-made', { decisionId, context, result });

            this.logger.info(`✅ Decision completed: ${decisionId}`);
            return result;
        } catch (error) {
            decision.status = 'failed';
            decision.error = error.message;
            this.logger.error(`❌ Decision failed: ${decisionId}`, error);
            this.emit('decision-failed', { decisionId, context, error });
            throw error;
        }
    }

    async processDecision(context) {
        switch (context.type) {
            case 'task_prioritization':
                return await this.prioritizeTasks(context.data);
            case 'resource_allocation':
                return await this.allocateResources(context.data);
            case 'agent_selection':
                return await this.selectBestAgent(context.data);
            case 'error_recovery':
                return await this.determineRecoveryStrategy(context.data);
            case 'performance_optimization':
                return await this.optimizePerformance(context.data);
            default:
                throw new Error(`Unknown decision type: ${context.type}`);
        }
    }

    async prioritizeTasks(tasks) {
        this.logger.info(`📋 Prioritizing ${tasks.length} tasks`);

        const prioritizedTasks = tasks.map(task => {
            let priority = 0;

            // Priority based on task type
            const typePriorities = {
                'critical': 100,
                'high': 80,
                'medium': 50,
                'low': 20
            };
            priority += typePriorities[task.priority] || 30;

            // Priority based on urgency
            if (task.deadline) {
                const timeUntilDeadline = new Date(task.deadline) - new Date();
                const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);
                if (hoursUntilDeadline < 1) priority += 50;
                else if (hoursUntilDeadline < 24) priority += 30;
                else if (hoursUntilDeadline < 168) priority += 10; // 1 week
            }

            // Priority based on dependencies
            if (task.dependencies && task.dependencies.length > 0) {
                priority += task.dependencies.length * 10;
            }

            // Priority based on resource requirements
            if (task.resourceIntensity) {
                priority += task.resourceIntensity * 5;
            }

            return { ...task, calculatedPriority: priority };
        });

        // Sort by priority (highest first)
        prioritizedTasks.sort((a, b) => b.calculatedPriority - a.calculatedPriority);

        this.logger.info(`✅ Tasks prioritized. Top priority: ${prioritizedTasks[0]?.type}`);
        return prioritizedTasks;
    }

    async allocateResources(resources) {
        this.logger.info(`💾 Allocating ${resources.length} resources`);

        const allocation = {
            cpu: { allocated: 0, available: resources.cpu || 100 },
            memory: { allocated: 0, available: resources.memory || 100 },
            storage: { allocated: 0, available: resources.storage || 100 },
            network: { allocated: 0, available: resources.network || 100 }
        };

        // Calculate current resource usage
        for (const resource of resources.currentUsage || []) {
            allocation[resource.type].allocated += resource.amount;
        }

        // Determine optimal allocation
        const optimalAllocation = {};
        for (const [resourceType, resource] of Object.entries(allocation)) {
            const usage = (resource.allocated / resource.available) * 100;
            optimalAllocation[resourceType] = {
                currentUsage: usage,
                recommended: usage > 80 ? 'reduce' : usage < 20 ? 'increase' : 'maintain',
                available: resource.available - resource.allocated
            };
        }

        this.logger.info(`✅ Resource allocation calculated`);
        return optimalAllocation;
    }

    async selectBestAgent(requirements) {
        this.logger.info(`🤖 Selecting best agent for requirements: ${requirements.type}`);

        const agentScores = [];

        for (const agent of requirements.availableAgents || []) {
            let score = 0;

            // Score based on capability match
            if (requirements.requiredCapabilities) {
                const matchingCapabilities = requirements.requiredCapabilities.filter(cap =>
                    agent.capabilities.includes(cap)
                ).length;
                score += matchingCapabilities * 20;
            }

            // Score based on agent status
            if (agent.status === 'ready') score += 30;
            else if (agent.status === 'busy') score += 10;
            else score -= 50; // Error or offline

            // Score based on performance history
            if (agent.performanceScore) {
                score += agent.performanceScore * 10;
            }

            // Score based on current load
            const loadFactor = Math.max(0, 10 - agent.tasks.length);
            score += loadFactor * 5;

            // Score based on response time
            if (agent.avgResponseTime) {
                const responseScore = Math.max(0, 100 - agent.avgResponseTime);
                score += responseScore * 0.1;
            }

            agentScores.push({ agent, score });
        }

        // Sort by score (highest first)
        agentScores.sort((a, b) => b.score - a.score);

        const bestAgent = agentScores[0];
        this.logger.info(`✅ Best agent selected: ${bestAgent.agent.name} (score: ${bestAgent.score})`);

        return {
            selectedAgent: bestAgent.agent,
            score: bestAgent.score,
            alternatives: agentScores.slice(1, 3) // Top 3 alternatives
        };
    }

    async determineRecoveryStrategy(error) {
        this.logger.info(`🔧 Determining recovery strategy for error: ${error.type}`);

        const strategies = {
            'network_error': {
                action: 'retry_with_backoff',
                maxRetries: 3,
                backoffDelay: 5000
            },
            'resource_unavailable': {
                action: 'find_alternative',
                fallbackOptions: ['alternative_resource', 'reduce_requirements']
            },
            'agent_failure': {
                action: 'replace_agent',
                replacementStrategy: 'best_match'
            },
            'timeout_error': {
                action: 'extend_timeout',
                newTimeout: 30000
            },
            'permission_error': {
                action: 'request_permissions',
                requiredPermissions: error.requiredPermissions
            }
        };

        const strategy = strategies[error.type] || {
            action: 'log_and_continue',
            logLevel: 'warning'
        };

        this.logger.info(`✅ Recovery strategy determined: ${strategy.action}`);
        return strategy;
    }

    async optimizePerformance(metrics) {
        this.logger.info(`⚡ Optimizing performance based on metrics`);

        const optimizations = [];

        // CPU optimization
        if (metrics.cpuUsage > 80) {
            optimizations.push({
                type: 'cpu_optimization',
                action: 'reduce_concurrent_tasks',
                target: Math.floor(metrics.cpuUsage * 0.8)
            });
        }

        // Memory optimization
        if (metrics.memoryUsage > 85) {
            optimizations.push({
                type: 'memory_optimization',
                action: 'clear_cache',
                target: 'reduce_memory_usage'
            });
        }

        // Response time optimization
        if (metrics.avgResponseTime > 2000) {
            optimizations.push({
                type: 'response_time_optimization',
                action: 'optimize_algorithms',
                target: 'reduce_response_time'
            });
        }

        // Throughput optimization
        if (metrics.throughput < metrics.targetThroughput) {
            optimizations.push({
                type: 'throughput_optimization',
                action: 'increase_parallel_processing',
                target: 'improve_throughput'
            });
        }

        this.logger.info(`✅ Performance optimizations calculated: ${optimizations.length} recommendations`);
        return optimizations;
    }

    generateDecisionId() {
        return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async getDecisionHistory(limit = 50) {
        return this.decisionHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    async getPerformanceMetrics() {
        const recentDecisions = this.decisionHistory.slice(-100);
        const successfulDecisions = recentDecisions.filter(d => d.status === 'completed');
        const failedDecisions = recentDecisions.filter(d => d.status === 'failed');

        return {
            totalDecisions: recentDecisions.length,
            successRate: recentDecisions.length > 0 ? (successfulDecisions.length / recentDecisions.length) * 100 : 0,
            averageDecisionTime: this.calculateAverageDecisionTime(recentDecisions),
            decisionTypes: this.getDecisionTypeDistribution(recentDecisions),
            recentFailures: failedDecisions.slice(-5)
        };
    }

    calculateAverageDecisionTime(decisions) {
        if (decisions.length === 0) return 0;

        const totalTime = decisions.reduce((sum, decision) => {
            const startTime = new Date(decision.timestamp);
            const endTime = decision.completedAt ? new Date(decision.completedAt) : new Date();
            return sum + (endTime - startTime);
        }, 0);

        return totalTime / decisions.length;
    }

    getDecisionTypeDistribution(decisions) {
        const distribution = {};
        decisions.forEach(decision => {
            const type = decision.context.type;
            distribution[type] = (distribution[type] || 0) + 1;
        });
        return distribution;
    }

    async healthCheck() {
        const health = {
            decisionMaking: 'DecisionMaking',
            status: 'healthy',
            totalDecisions: this.decisionHistory.length,
            performanceMetrics: await this.getPerformanceMetrics(),
            timestamp: new Date().toISOString()
        };

        this.logger.info('🏥 Decision making system health check:', health);
        return health;
    }
}

module.exports = DecisionMaking;
