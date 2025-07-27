const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

// In-memory scheduled tasks (replace with database in production)
let scheduledTasks = [];

// Schedule a new task
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            cronExpression,
            action,
            data = {},
            enabled = true
        } = req.body;

        const scheduledTask = {
            id: uuidv4(),
            title,
            description,
            cronExpression,
            action,
            data,
            enabled,
            lastRun: null,
            nextRun: null,
            runCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate cron expression
        if (!cron.validate(cronExpression)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid cron expression'
            });
        }

        // Schedule the task
        if (enabled) {
            scheduleTask(scheduledTask);
        }

        scheduledTasks.push(scheduledTask);

        res.json({
            success: true,
            scheduledTask,
            message: 'Task scheduled successfully'
        });
    } catch (error) {
        console.error('Schedule Task Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to schedule task'
        });
    }
});

// Get all scheduled tasks
router.get('/', async (req, res) => {
    try {
        const { enabled } = req.query;

        let filteredTasks = scheduledTasks;

        if (enabled !== undefined) {
            filteredTasks = filteredTasks.filter(task => task.enabled === (enabled === 'true'));
        }

        res.json({
            success: true,
            tasks: filteredTasks,
            total: filteredTasks.length
        });
    } catch (error) {
        console.error('Get Scheduled Tasks Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve scheduled tasks'
        });
    }
});

// Get scheduled task by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const task = scheduledTasks.find(t => t.id === id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Scheduled task not found'
            });
        }

        res.json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Get Scheduled Task Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve scheduled task'
        });
    }
});

// Update scheduled task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const taskIndex = scheduledTasks.findIndex(t => t.id === id);

        if (taskIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Scheduled task not found'
            });
        }

        // If cron expression is being updated, validate it
        if (updates.cronExpression && !cron.validate(updates.cronExpression)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid cron expression'
            });
        }

        scheduledTasks[taskIndex] = {
            ...scheduledTasks[taskIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Re-schedule if enabled status changed
        if (updates.enabled !== undefined) {
            if (updates.enabled) {
                scheduleTask(scheduledTasks[taskIndex]);
            } else {
                // TODO: Stop the scheduled task
            }
        }

        res.json({
            success: true,
            task: scheduledTasks[taskIndex],
            message: 'Scheduled task updated successfully'
        });
    } catch (error) {
        console.error('Update Scheduled Task Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update scheduled task'
        });
    }
});

// Delete scheduled task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const taskIndex = scheduledTasks.findIndex(t => t.id === id);

        if (taskIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Scheduled task not found'
            });
        }

        const deletedTask = scheduledTasks.splice(taskIndex, 1)[0];

        res.json({
            success: true,
            message: 'Scheduled task deleted successfully',
            task: deletedTask
        });
    } catch (error) {
        console.error('Delete Scheduled Task Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete scheduled task'
        });
    }
});

// Execute scheduled task immediately
router.post('/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const task = scheduledTasks.find(t => t.id === id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Scheduled task not found'
            });
        }

        // Execute the task
        const result = await executeTask(task);

        // Update task stats
        task.lastRun = new Date().toISOString();
        task.runCount += 1;

        res.json({
            success: true,
            result,
            message: 'Task executed successfully',
            task
        });
    } catch (error) {
        console.error('Execute Task Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute task'
        });
    }
});

// Get scheduler statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = {
            total: scheduledTasks.length,
            enabled: scheduledTasks.filter(t => t.enabled).length,
            disabled: scheduledTasks.filter(t => !t.enabled).length,
            running: scheduledTasks.filter(t => t.lastRun &&
                new Date(t.lastRun) > new Date(Date.now() - 60000)).length, // Last minute
            totalRuns: scheduledTasks.reduce((sum, task) => sum + task.runCount, 0)
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Scheduler Stats Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve scheduler statistics'
        });
    }
});

// Helper function to schedule a task
function scheduleTask(task) {
    try {
        cron.schedule(task.cronExpression, async () => {
            console.log(`🕐 Executing scheduled task: ${task.title}`);

            try {
                await executeTask(task);

                // Update task stats
                task.lastRun = new Date().toISOString();
                task.runCount += 1;

                console.log(`✅ Scheduled task completed: ${task.title}`);
            } catch (error) {
                console.error(`❌ Scheduled task failed: ${task.title}`, error);
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        console.log(`📅 Task scheduled: ${task.title} with cron: ${task.cronExpression}`);
    } catch (error) {
        console.error('Schedule Task Error:', error);
    }
}

// Helper function to execute a task
async function executeTask(task) {
    console.log(`🚀 Executing task: ${task.title}`);
    console.log(`Action: ${task.action}`);
    console.log(`Data:`, task.data);

    // Simulate task execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        success: true,
        message: `Task "${task.title}" executed successfully`,
        timestamp: new Date().toISOString()
    };
}

// Initialize existing scheduled tasks on startup
function initializeScheduledTasks() {
    console.log('🔄 Initializing scheduled tasks...');

    scheduledTasks.forEach(task => {
        if (task.enabled) {
            scheduleTask(task);
        }
    });

    console.log(`✅ Initialized ${scheduledTasks.filter(t => t.enabled).length} scheduled tasks`);
}

// Start the scheduler
initializeScheduledTasks();

module.exports = router;
