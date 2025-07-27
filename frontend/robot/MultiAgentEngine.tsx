import React, { useState, useEffect } from 'react';

interface Task {
    id: string;
    type: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    assignedAgent: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: string;
    completedAt?: string;
    result?: any;
}

interface Agent {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    status: 'available' | 'busy' | 'offline';
    currentTask?: string;
    performance: {
        tasksCompleted: number;
        successRate: number;
        averageTime: number;
    };
}

interface TaskQueue {
    id: string;
    userId: string;
    steps: Task[];
    status: 'active' | 'paused' | 'completed' | 'failed';
    createdAt: string;
    estimatedCompletion: string;
}

class MultiAgentEngine {
    private agents: Map<string, Agent> = new Map();
    private taskQueue: Map<string, TaskQueue> = new Map();
    private userMemory: Map<string, any> = new Map();

    constructor() {
        this.initializeAgents();
        console.log('✅ Multi-Agent Engine initialized');
    }

    private initializeAgents() {
        // Initialize specialized agents
        const agentTypes = [
            {
                id: 'grocery-agent',
                name: 'Grocery Agent',
                type: 'shopping',
                capabilities: ['order_groceries', 'track_delivery', 'manage_inventory'],
                status: 'available'
            },
            {
                id: 'service-agent',
                name: 'Service Agent',
                type: 'appointment',
                capabilities: ['book_appointments', 'schedule_services', 'manage_calendar'],
                status: 'available'
            },
            {
                id: 'reminder-agent',
                name: 'Reminder Agent',
                type: 'notification',
                capabilities: ['set_reminders', 'send_notifications', 'track_events'],
                status: 'available'
            },
            {
                id: 'payment-agent',
                name: 'Payment Agent',
                type: 'financial',
                capabilities: ['process_payments', 'manage_billing', 'track_expenses'],
                status: 'available'
            },
            {
                id: 'delivery-agent',
                name: 'Delivery Agent',
                type: 'logistics',
                capabilities: ['track_deliveries', 'manage_schedule', 'coordinate_pickup'],
                status: 'available'
            },
            {
                id: 'health-agent',
                name: 'Health Agent',
                type: 'medical',
                capabilities: ['book_medical', 'track_appointments', 'manage_prescriptions'],
                status: 'available'
            }
        ];

        agentTypes.forEach(agent => {
            this.agents.set(agent.id, {
                ...agent,
                performance: {
                    tasksCompleted: 0,
                    successRate: 95,
                    averageTime: 120 // seconds
                }
            });
        });
    }

    // Assign task to appropriate agent
    async assignTask(taskId: string, taskDescription: string, userId: string): Promise<{
        success: boolean;
        assignedAgent: string;
        estimatedTime: number;
        message: string;
    }> {
        try {
            // Analyze task and find best agent
            const bestAgent = this.findBestAgent(taskDescription);

            if (!bestAgent) {
                return {
                    success: false,
                    assignedAgent: '',
                    estimatedTime: 0,
                    message: '❌ No suitable agent available for this task'
                };
            }

            // Create task
            const task: Task = {
                id: taskId,
                type: this.categorizeTask(taskDescription),
                description: taskDescription,
                status: 'pending',
                assignedAgent: bestAgent.id,
                priority: this.determinePriority(taskDescription),
                createdAt: new Date().toISOString()
            };

            // Update agent status
            bestAgent.status = 'busy';
            bestAgent.currentTask = taskId;

            // Store in user memory
            this.userMemory.set(`${userId}_${taskId}`, {
                task,
                agent: bestAgent,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                assignedAgent: bestAgent.name,
                estimatedTime: bestAgent.performance.averageTime,
                message: `✅ Task assigned to ${bestAgent.name}. Estimated completion: ${Math.round(bestAgent.performance.averageTime / 60)} minutes`
            };
        } catch (error) {
            console.error('Assign task error:', error);
            return {
                success: false,
                assignedAgent: '',
                estimatedTime: 0,
                message: '❌ Failed to assign task'
            };
        }
    }

    // Create multi-step task queue
    async createTaskQueue(userId: string, complexRequest: string): Promise<{
        success: boolean;
        queueId: string;
        steps: Task[];
        message: string;
    }> {
        try {
            const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Parse complex request into steps
            const steps = this.parseComplexRequest(complexRequest);

            const taskQueue: TaskQueue = {
                id: queueId,
                userId,
                steps,
                status: 'active',
                createdAt: new Date().toISOString(),
                estimatedCompletion: this.calculateEstimatedCompletion(steps)
            };

            this.taskQueue.set(queueId, taskQueue);

            return {
                success: true,
                queueId,
                steps,
                message: `✅ Created task queue with ${steps.length} steps. Estimated completion: ${taskQueue.estimatedCompletion}`
            };
        } catch (error) {
            console.error('Create task queue error:', error);
            return {
                success: false,
                queueId: '',
                steps: [],
                message: '❌ Failed to create task queue'
            };
        }
    }

    // Execute task queue
    async executeTaskQueue(queueId: string): Promise<{
        success: boolean;
        results: any[];
        message: string;
    }> {
        try {
            const queue = this.taskQueue.get(queueId);
            if (!queue) {
                return {
                    success: false,
                    results: [],
                    message: '❌ Task queue not found'
                };
            }

            const results = [];

            for (const step of queue.steps) {
                const result = await this.executeTask(step);
                results.push(result);

                // Update step status
                step.status = result.success ? 'completed' : 'failed';
                step.completedAt = new Date().toISOString();
                step.result = result;
            }

            // Update queue status
            const allCompleted = queue.steps.every(step => step.status === 'completed');
            queue.status = allCompleted ? 'completed' : 'failed';

            return {
                success: allCompleted,
                results,
                message: allCompleted ?
                    '✅ All tasks completed successfully!' :
                    '⚠️ Some tasks failed. Check results for details.'
            };
        } catch (error) {
            console.error('Execute task queue error:', error);
            return {
                success: false,
                results: [],
                message: '❌ Failed to execute task queue'
            };
        }
    }

    // Get agent status
    getAgentStatus(agentId: string): Agent | null {
        return this.agents.get(agentId) || null;
    }

    // Get all agents
    getAllAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    // Get task queue status
    getTaskQueueStatus(queueId: string): TaskQueue | null {
        return this.taskQueue.get(queueId) || null;
    }

    // Get user's active tasks
    getUserActiveTasks(userId: string): Task[] {
        const tasks: Task[] = [];

        for (const queue of this.taskQueue.values()) {
            if (queue.userId === userId && queue.status === 'active') {
                tasks.push(...queue.steps.filter(step => step.status === 'pending' || step.status === 'in-progress'));
            }
        }

        return tasks;
    }

    // Private helper methods
    private findBestAgent(taskDescription: string): Agent | null {
        const availableAgents = Array.from(this.agents.values())
            .filter(agent => agent.status === 'available');

        if (availableAgents.length === 0) {
            return null;
        }

        // Simple matching based on task keywords
        const taskLower = taskDescription.toLowerCase();

        for (const agent of availableAgents) {
            for (const capability of agent.capabilities) {
                if (taskLower.includes(capability.replace('_', ' '))) {
                    return agent;
                }
            }
        }

        // Default to first available agent
        return availableAgents[0];
    }

    private categorizeTask(description: string): string {
        const taskLower = description.toLowerCase();

        if (taskLower.includes('grocery') || taskLower.includes('food') || taskLower.includes('order')) {
            return 'shopping';
        } else if (taskLower.includes('appointment') || taskLower.includes('book') || taskLower.includes('schedule')) {
            return 'appointment';
        } else if (taskLower.includes('remind') || taskLower.includes('notification')) {
            return 'notification';
        } else if (taskLower.includes('payment') || taskLower.includes('pay') || taskLower.includes('bill')) {
            return 'financial';
        } else if (taskLower.includes('delivery') || taskLower.includes('pickup')) {
            return 'logistics';
        } else if (taskLower.includes('doctor') || taskLower.includes('medical') || taskLower.includes('health')) {
            return 'medical';
        }

        return 'general';
    }

    private determinePriority(description: string): 'low' | 'medium' | 'high' | 'urgent' {
        const taskLower = description.toLowerCase();

        if (taskLower.includes('urgent') || taskLower.includes('emergency') || taskLower.includes('immediately')) {
            return 'urgent';
        } else if (taskLower.includes('important') || taskLower.includes('priority')) {
            return 'high';
        } else if (taskLower.includes('routine') || taskLower.includes('weekly')) {
            return 'low';
        }

        return 'medium';
    }

    private parseComplexRequest(request: string): Task[] {
        const steps: Task[] = [];
        const taskId = `task_${Date.now()}`;

        // Simple parsing - in real implementation, this would use NLP
        const sentences = request.split(/[.!?]+/).filter(s => s.trim());

        sentences.forEach((sentence, index) => {
            if (sentence.trim()) {
                steps.push({
                    id: `${taskId}_step_${index + 1}`,
                    type: this.categorizeTask(sentence),
                    description: sentence.trim(),
                    status: 'pending',
                    assignedAgent: '',
                    priority: this.determinePriority(sentence),
                    createdAt: new Date().toISOString()
                });
            }
        });

        return steps;
    }

    private calculateEstimatedCompletion(steps: Task[]): string {
        const totalTime = steps.reduce((sum, step) => {
            const agent = this.findBestAgent(step.description);
            return sum + (agent?.performance.averageTime || 120);
        }, 0);

        const completionTime = new Date(Date.now() + totalTime * 1000);
        return completionTime.toISOString();
    }

    private async executeTask(task: Task): Promise<{
        success: boolean;
        result: any;
        message: string;
    }> {
        // Simulate task execution
        await new Promise(resolve => setTimeout(resolve, 1000));

        const success = Math.random() > 0.1; // 90% success rate

        return {
            success,
            result: {
                taskId: task.id,
                executedAt: new Date().toISOString(),
                duration: Math.random() * 60 + 30 // 30-90 seconds
            },
            message: success ?
                `✅ ${task.description} completed successfully` :
                `❌ Failed to complete: ${task.description}`
        };
    }
}

// React Component for Multi-Agent Engine
const MultiAgentEngineComponent: React.FC = () => {
    const [engine] = useState(() => new MultiAgentEngine());
    const [agents, setAgents] = useState<Agent[]>([]);
    const [activeTasks, setActiveTasks] = useState<Task[]>([]);
    const [taskQueues, setTaskQueues] = useState<TaskQueue[]>([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setAgents(engine.getAllAgents());
        setActiveTasks(engine.getUserActiveTasks('user123'));
        setTaskQueues(Array.from(engine.taskQueue.values()));
    };

    const handleComplexRequest = async () => {
        if (!userInput.trim()) return;

        setLoading(true);
        try {
            const result = await engine.createTaskQueue('user123', userInput);

            if (result.success) {
                const executionResult = await engine.executeTaskQueue(result.queueId);
                alert(executionResult.message);
                setUserInput('');
                loadData();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Handle complex request error:', error);
            alert('❌ Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">🤖 Multi-Agent Task Engine</h1>

                {/* Complex Request Input */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Complex Task Request</h2>
                    <div className="flex space-x-4">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="e.g., Set my weekly groceries every Friday, AC checkup every Saturday 9am, and remind me every Wednesday for doctor appointment"
                            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                        />
                        <button
                            onClick={handleComplexRequest}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg px-6 py-2 font-medium transition-colors"
                        >
                            {loading ? 'Processing...' : 'Execute'}
                        </button>
                    </div>
                </div>

                {/* Agents Status */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Agent Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {agents.map(agent => (
                            <div key={agent.id} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">{agent.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        agent.status === 'available' ? 'bg-green-500/20 text-green-400' :
                                        agent.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        {agent.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 mb-2">{agent.type}</p>
                                <div className="text-xs text-gray-400">
                                    <div>Tasks: {agent.performance.tasksCompleted}</div>
                                    <div>Success: {agent.performance.successRate}%</div>
                                    <div>Avg Time: {Math.round(agent.performance.averageTime / 60)}m</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Tasks */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Active Tasks</h2>
                    <div className="space-y-4">
                        {activeTasks.map(task => (
                            <div key={task.id} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{task.description}</h3>
                                        <p className="text-sm text-gray-300">Type: {task.type}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                            task.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                            task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {task.status}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                            task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-green-500/20 text-green-400'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activeTasks.length === 0 && (
                            <p className="text-gray-300 text-center py-4">No active tasks</p>
                        )}
                    </div>
                </div>

                {/* Task Queues */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Task Queues</h2>
                    <div className="space-y-4">
                        {taskQueues.map(queue => (
                            <div key={queue.id} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">Queue {queue.id.slice(-8)}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        queue.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                        queue.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                        queue.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {queue.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-300">
                                    <div>Steps: {queue.steps.length}</div>
                                    <div>Created: {new Date(queue.createdAt).toLocaleString()}</div>
                                    <div>Estimated: {new Date(queue.estimatedCompletion).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                        {taskQueues.length === 0 && (
                            <p className="text-gray-300 text-center py-4">No task queues</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiAgentEngineComponent;
