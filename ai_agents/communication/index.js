const EventEmitter = require('events');
const winston = require('winston');

class AgentCommunication extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.messageQueue = [];
        this.broadcastHistory = [];
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
                new winston.transports.File({ filename: 'logs/agent-communication.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    registerAgent(agent) {
        this.agents.set(agent.name, agent);
        this.logger.info(`📡 Registered agent for communication: ${agent.name}`);

        // Listen to agent communication events
        agent.on('message-sent', (data) => {
            this.handleMessageSent(data);
        });

        agent.on('message-received', (data) => {
            this.handleMessageReceived(data);
        });

        // Set up agent's communication methods
        agent.sendMessage = (to, message) => this.sendMessage(agent.name, to, message);
        agent.broadcast = (message) => this.broadcast(agent.name, message);
        agent.getConnectedAgents = () => this.getConnectedAgents();
    }

    async sendMessage(from, to, message) {
        const messageId = this.generateMessageId();
        const fullMessage = {
            id: messageId,
            from: from,
            to: to,
            type: message.type,
            data: message.data,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        this.logger.info(`💬 Message sent: ${from} -> ${to} (${message.type})`);

        try {
            const targetAgent = this.agents.get(to);
            if (!targetAgent) {
                throw new Error(`Target agent not found: ${to}`);
            }

            const response = await targetAgent.receiveMessage(fullMessage);
            fullMessage.status = 'delivered';
            fullMessage.response = response;

            this.messageQueue.push(fullMessage);
            this.emit('message-delivered', { messageId, from, to, response });

            return { messageId, status: 'delivered', response };
        } catch (error) {
            fullMessage.status = 'failed';
            fullMessage.error = error.message;
            this.logger.error(`❌ Message delivery failed: ${from} -> ${to}`, error);
            this.emit('message-failed', { messageId, from, to, error });
            throw error;
        }
    }

    async broadcast(from, message) {
        const messageId = this.generateMessageId();
        const broadcastMessage = {
            id: messageId,
            from: from,
            type: 'broadcast',
            data: message.data,
            timestamp: new Date().toISOString(),
            recipients: []
        };

        this.logger.info(`📢 Broadcast from ${from}: ${message.type}`);

        const promises = [];
        const responses = [];

        for (const [name, agent] of this.agents) {
            if (name !== from) {
                const individualMessage = {
                    ...broadcastMessage,
                    to: name,
                    type: message.type
                };

                promises.push(
                    agent.receiveMessage(individualMessage)
                        .then(response => {
                            responses.push({ agent: name, response });
                            broadcastMessage.recipients.push(name);
                        })
                        .catch(error => {
                            this.logger.error(`❌ Broadcast failed for ${name}:`, error);
                            responses.push({ agent: name, error: error.message });
                        })
                );
            }
        }

        await Promise.all(promises);
        broadcastMessage.status = 'completed';
        broadcastMessage.responses = responses;

        this.broadcastHistory.push(broadcastMessage);
        this.emit('broadcast-completed', { messageId, from, responses });

        return { messageId, recipients: broadcastMessage.recipients, responses };
    }

    async handleMessageSent(data) {
        const { from, message } = data;
        this.logger.info(`📤 Message sent by ${from}: ${message.type}`);
        this.emit('message-sent', data);
    }

    async handleMessageReceived(data) {
        const { to, message } = data;
        this.logger.info(`📥 Message received by ${to}: ${message.type}`);
        this.emit('message-received', data);
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getConnectedAgents() {
        return Array.from(this.agents.keys());
    }

    async getAgentStatus(agentName) {
        const agent = this.agents.get(agentName);
        if (!agent) {
            return { status: 'not_found' };
        }

        return {
            name: agentName,
            status: agent.status,
            capabilities: agent.capabilities,
            messageCount: agent.memory.size,
            lastActivity: agent.tasks.length > 0 ? agent.tasks[agent.tasks.length - 1].timestamp : null
        };
    }

    async getAllAgentsStatus() {
        const statuses = {};
        for (const [name, agent] of this.agents) {
            statuses[name] = await this.getAgentStatus(name);
        }
        return statuses;
    }

    async sendDirectMessage(from, to, messageType, data) {
        return this.sendMessage(from, to, {
            type: messageType,
            data: data
        });
    }

    async broadcastToType(from, agentType, messageType, data) {
        const targetAgents = Array.from(this.agents.values())
            .filter(agent => agent.type === agentType);

        if (targetAgents.length === 0) {
            throw new Error(`No agents found of type: ${agentType}`);
        }

        const promises = targetAgents.map(agent =>
            this.sendMessage(from, agent.name, {
                type: messageType,
                data: data
            })
        );

        return Promise.all(promises);
    }

    async getMessageHistory(agentName = null, limit = 50) {
        let messages = this.messageQueue;

        if (agentName) {
            messages = messages.filter(msg =>
                msg.from === agentName || msg.to === agentName
            );
        }

        return messages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    async getBroadcastHistory(limit = 20) {
        return this.broadcastHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    async clearMessageHistory() {
        this.messageQueue = [];
        this.broadcastHistory = [];
        this.logger.info('🗑️ Message history cleared');
    }

    async healthCheck() {
        const health = {
            communication: 'AgentCommunication',
            status: 'healthy',
            connectedAgents: this.agents.size,
            messageQueueSize: this.messageQueue.length,
            broadcastHistorySize: this.broadcastHistory.length,
            agentStatuses: await this.getAllAgentsStatus(),
            timestamp: new Date().toISOString()
        };

        this.logger.info('🏥 Communication system health check:', health);
        return health;
    }

    async getCommunicationStats() {
        const stats = {
            totalMessages: this.messageQueue.length,
            totalBroadcasts: this.broadcastHistory.length,
            connectedAgents: this.agents.size,
            activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'ready').length,
            recentMessages: this.messageQueue.slice(-10),
            recentBroadcasts: this.broadcastHistory.slice(-5)
        };

        return stats;
    }
}

module.exports = AgentCommunication;
