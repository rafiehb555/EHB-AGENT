/**
 * 🔄 EHB Task Dispatcher - Task Management System
 * 
 * Manages task delegation, dependency resolution, and task lifecycle
 * across the EHB AI Dev Agent ecosystem.
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class TaskDispatcher extends EventEmitter {
    constructor(agentBridge) {
        super();
        this.bridge = agentBridge;
        this.taskQueue = [];
        this.activeTasks = new Map();
        this.completedTasks = new Map();
        this.failedTasks = new Map();
        this.taskDependencies = new Map();
        this.taskPriorities = new Map();
        
        // Task types and their handlers
        this.taskHandlers = new Map();
        
        // Initialize task handlers
        this.initTaskHandlers();
        
        // Listen to bridge events
        this.setupBridgeListeners();
        
        console.log('🔄 EHB Task Dispatcher initialized');
    }

    /**
     * Initialize task handlers for different task types
     */
    initTaskHandlers() {
        // Development tasks
        this.taskHandlers.set('code-generation', this.handleCodeGeneration.bind(this));
        this.taskHandlers.set('code-review', this.handleCodeReview.bind(this));
        this.taskHandlers.set('testing', this.handleTesting.bind(this));
        this.taskHandlers.set('deployment', this.handleDeployment.bind(this));
        
        // Healthcare tasks
        this.taskHandlers.set('patient-data-processing', this.handlePatientDataProcessing.bind(this));
        this.taskHandlers.set('medical-record-validation', this.handleMedicalRecordValidation.bind(this));
        this.taskHandlers.set('hipaa-compliance-check', this.handleHipaaComplianceCheck.bind(this));
        
        // Infrastructure tasks
        this.taskHandlers.set('database-setup', this.handleDatabaseSetup.bind(this));
        this.taskHandlers.set('api-development', this.handleApiDevelopment.bind(this));
        this.taskHandlers.set('ui-development', this.handleUiDevelopment.bind(this));
        
        // Business tasks
        this.taskHandlers.set('billing-processing', this.handleBillingProcessing.bind(this));
        this.taskHandlers.set('report-generation', this.handleReportGeneration.bind(this));
        this.taskHandlers.set('notification-sending', this.handleNotificationSending.bind(this));
    }

    /**
     * Setup listeners for bridge events
     */
    setupBridgeListeners() {
        this.bridge.on('task-started', (task) => {
            this.handleTaskStarted(task);
        });

        this.bridge.on('task-completed', (task) => {
            this.handleTaskCompleted(task);
        });

        this.bridge.on('task-ready', (task) => {
            this.handleTaskReady(task);
        });
    }

    /**
     * Submit a new task for processing
     */
    submitTask(taskData, options = {}) {
        const task = {
            id: this.generateTaskId(),
            type: taskData.type,
            data: taskData.data,
            priority: options.priority || 'normal',
            dependencies: options.dependencies || [],
            estimatedTime: options.estimatedTime || 30000,
            maxRetries: options.maxRetries || 3,
            retryCount: 0,
            status: 'pending',
            submittedAt: Date.now(),
            assignedAgent: null,
            result: null,
            error: null
        };

        // Add to queue
        this.taskQueue.push(task);
        
        // Sort queue by priority
        this.sortTaskQueue();
        
        // Log task submission
        this.bridge.logMessage('system', 'task-submitted', {
            taskId: task.id,
            taskType: task.type,
            priority: task.priority
        });

        // Try to assign task
        this.processTaskQueue();

        return task.id;
    }

    /**
     * Process the task queue and assign tasks to available agents
     */
    processTaskQueue() {
        const availableAgents = this.bridge.getActiveAgents();
        
        for (let i = 0; i < this.taskQueue.length; i++) {
            const task = this.taskQueue[i];
            
            // Skip if task has dependencies
            if (task.dependencies.length > 0) {
                const pendingDeps = task.dependencies.filter(dep => 
                    !this.completedTasks.has(dep)
                );
                
                if (pendingDeps.length > 0) {
                    continue; // Wait for dependencies
                }
            }

            // Find suitable agent
            const suitableAgent = this.findSuitableAgent(task, availableAgents);
            
            if (suitableAgent) {
                // Remove from queue
                this.taskQueue.splice(i, 1);
                
                // Assign task
                this.assignTask(task, suitableAgent);
                i--; // Adjust index
            }
        }
    }

    /**
     * Find suitable agent for a task
     */
    findSuitableAgent(task, availableAgents) {
        // Filter agents by capabilities
        const capableAgents = availableAgents.filter(agent => 
            agent.capabilities.includes(task.type) || 
            agent.capabilities.includes('general')
        );

        if (capableAgents.length === 0) {
            return null;
        }

        // Sort by priority and workload
        capableAgents.sort((a, b) => {
            const priorityA = this.getPriorityLevel(a.priority);
            const priorityB = this.getPriorityLevel(b.priority);
            
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }
            
            // If same priority, choose agent with less workload
            const workloadA = this.getAgentWorkload(a.id);
            const workloadB = this.getAgentWorkload(b.id);
            
            return workloadA - workloadB;
        });

        return capableAgents[0];
    }

    /**
     * Get agent workload
     */
    getAgentWorkload(agentId) {
        let workload = 0;
        this.activeTasks.forEach(task => {
            if (task.assignedAgent === agentId) {
                workload++;
            }
        });
        return workload;
    }

    /**
     * Assign task to agent
     */
    assignTask(task, agent) {
        task.assignedAgent = agent.id;
        task.status = 'assigned';
        task.assignedAt = Date.now();

        // Add to active tasks
        this.activeTasks.set(task.id, task);

        // Delegate via bridge
        this.bridge.delegateTask('system', agent.id, {
            type: task.type,
            data: task.data,
            taskId: task.id
        }, {
            priority: task.priority,
            estimatedTime: task.estimatedTime
        });

        // Log assignment
        this.bridge.logMessage('system', 'task-assigned', {
            taskId: task.id,
            agentId: agent.id,
            taskType: task.type
        });

        this.emit('task-assigned', task, agent);
    }

    /**
     * Handle task started
     */
    handleTaskStarted(task) {
        const activeTask = this.activeTasks.get(task.id);
        if (activeTask) {
            activeTask.status = 'in-progress';
            activeTask.startedAt = Date.now();
            
            this.emit('task-started', activeTask);
        }
    }

    /**
     * Handle task completed
     */
    handleTaskCompleted(task) {
        const activeTask = this.activeTasks.get(task.id);
        if (activeTask) {
            activeTask.status = 'completed';
            activeTask.result = task.result;
            activeTask.completedAt = Date.now();

            // Move to completed tasks
            this.activeTasks.delete(task.id);
            this.completedTasks.set(task.id, activeTask);

            // Process dependent tasks
            this.processDependentTasks(task.id);

            // Log completion
            this.bridge.logMessage('system', 'task-completed', {
                taskId: task.id,
                result: task.result
            });

            this.emit('task-completed', activeTask);
        }
    }

    /**
     * Handle task ready (dependencies met)
     */
    handleTaskReady(task) {
        // Task is ready to be processed
        this.processTaskQueue();
    }

    /**
     * Process tasks that were waiting for dependencies
     */
    processDependentTasks(completedTaskId) {
        this.taskQueue.forEach(task => {
            if (task.dependencies.includes(completedTaskId)) {
                task.dependencies = task.dependencies.filter(dep => dep !== completedTaskId);
                
                if (task.dependencies.length === 0) {
                    // All dependencies met, task is ready
                    this.emit('task-ready', task);
                }
            }
        });
    }

    /**
     * Handle task failure
     */
    handleTaskFailure(taskId, error) {
        const activeTask = this.activeTasks.get(taskId);
        if (activeTask) {
            activeTask.error = error;
            activeTask.retryCount++;

            if (activeTask.retryCount >= activeTask.maxRetries) {
                // Max retries reached, mark as failed
                activeTask.status = 'failed';
                this.activeTasks.delete(taskId);
                this.failedTasks.set(taskId, activeTask);

                this.bridge.logMessage('system', 'task-failed', {
                    taskId,
                    error: error.message,
                    retryCount: activeTask.retryCount
                });

                this.emit('task-failed', activeTask);
            } else {
                // Retry task
                activeTask.status = 'pending';
                this.taskQueue.unshift(activeTask); // Add to front of queue
                this.activeTasks.delete(taskId);

                this.bridge.logMessage('system', 'task-retry', {
                    taskId,
                    retryCount: activeTask.retryCount
                });

                this.emit('task-retry', activeTask);
            }
        }
    }

    /**
     * Sort task queue by priority
     */
    sortTaskQueue() {
        this.taskQueue.sort((a, b) => {
            const priorityA = this.getPriorityLevel(a.priority);
            const priorityB = this.getPriorityLevel(b.priority);
            
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }
            
            // If same priority, FIFO
            return a.submittedAt - b.submittedAt;
        });
    }

    /**
     * Get priority level as number
     */
    getPriorityLevel(priority) {
        const levels = { 'high': 3, 'medium': 2, 'low': 1, 'normal': 2 };
        return levels[priority] || 1;
    }

    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get task status
     */
    getTaskStatus(taskId) {
        if (this.activeTasks.has(taskId)) {
            return this.activeTasks.get(taskId);
        }
        if (this.completedTasks.has(taskId)) {
            return this.completedTasks.get(taskId);
        }
        if (this.failedTasks.has(taskId)) {
            return this.failedTasks.get(taskId);
        }
        return null;
    }

    /**
     * Get all tasks for an agent
     */
    getAgentTasks(agentId) {
        const tasks = [];
        
        this.activeTasks.forEach(task => {
            if (task.assignedAgent === agentId) {
                tasks.push(task);
            }
        });
        
        return tasks;
    }

    /**
     * Get system statistics
     */
    getStats() {
        return {
            queueSize: this.taskQueue.length,
            activeTasks: this.activeTasks.size,
            completedTasks: this.completedTasks.size,
            failedTasks: this.failedTasks.size,
            totalTasks: this.taskQueue.length + this.activeTasks.size + 
                       this.completedTasks.size + this.failedTasks.size
        };
    }

    // Task handlers for different task types
    handleCodeGeneration(task) {
        // Handle code generation tasks
        console.log(`🔧 Code generation task: ${task.id}`);
    }

    handleCodeReview(task) {
        // Handle code review tasks
        console.log(`🔍 Code review task: ${task.id}`);
    }

    handleTesting(task) {
        // Handle testing tasks
        console.log(`🧪 Testing task: ${task.id}`);
    }

    handleDeployment(task) {
        // Handle deployment tasks
        console.log(`🚀 Deployment task: ${task.id}`);
    }

    handlePatientDataProcessing(task) {
        // Handle patient data processing tasks
        console.log(`🏥 Patient data processing task: ${task.id}`);
    }

    handleMedicalRecordValidation(task) {
        // Handle medical record validation tasks
        console.log(`📋 Medical record validation task: ${task.id}`);
    }

    handleHipaaComplianceCheck(task) {
        // Handle HIPAA compliance check tasks
        console.log(`🔒 HIPAA compliance check task: ${task.id}`);
    }

    handleDatabaseSetup(task) {
        // Handle database setup tasks
        console.log(`🗄️ Database setup task: ${task.id}`);
    }

    handleApiDevelopment(task) {
        // Handle API development tasks
        console.log(`🔌 API development task: ${task.id}`);
    }

    handleUiDevelopment(task) {
        // Handle UI development tasks
        console.log(`🎨 UI development task: ${task.id}`);
    }

    handleBillingProcessing(task) {
        // Handle billing processing tasks
        console.log(`💰 Billing processing task: ${task.id}`);
    }

    handleReportGeneration(task) {
        // Handle report generation tasks
        console.log(`📊 Report generation task: ${task.id}`);
    }

    handleNotificationSending(task) {
        // Handle notification sending tasks
        console.log(`📧 Notification sending task: ${task.id}`);
    }
}

module.exports = TaskDispatcher; 