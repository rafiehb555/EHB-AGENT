const cron = require('node-cron');
const Task = require('../models/Task');
const { processVoiceText } = require('../controllers/aiController');

class TaskScheduler {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
    this.checkInterval = null;
  }

  // Start the scheduler
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Task scheduler is already running');
      return;
    }

    console.log('🚀 Starting EHB AI Robot Task Scheduler...');
    this.isRunning = true;

    // Start the main task checker
    this.startTaskChecker();

    // Start recurring task scheduler
    this.startRecurringScheduler();

    console.log('✅ Task scheduler started successfully');
  }

  // Stop the scheduler
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Task scheduler is not running');
      return;
    }

    console.log('🛑 Stopping Task Scheduler...');
    this.isRunning = false;

    // Clear all jobs
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();

    // Clear check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('✅ Task scheduler stopped');
  }

  // Start the main task checker (runs every 30 seconds)
  startTaskChecker() {
    this.checkInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.checkAndExecuteTasks();
      } catch (error) {
        console.error('❌ Task checker error:', error);
      }
    }, 30000); // Check every 30 seconds

    console.log('⏰ Task checker started (30s intervals)');
  }

  // Start recurring task scheduler
  startRecurringScheduler() {
    // Daily recurring tasks
    cron.schedule('0 0 * * *', async () => {
      if (!this.isRunning) return;
      await this.processRecurringTasks('daily');
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Weekly recurring tasks
    cron.schedule('0 0 * * 0', async () => {
      if (!this.isRunning) return;
      await this.processRecurringTasks('weekly');
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Monthly recurring tasks
    cron.schedule('0 0 1 * *', async () => {
      if (!this.isRunning) return;
      await this.processRecurringTasks('monthly');
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('🔄 Recurring task scheduler started');
  }

  // Check and execute pending tasks
  async checkAndExecuteTasks() {
    try {
      const pendingTasks = await Task.findPendingTasks();

      if (pendingTasks.length === 0) {
        return;
      }

      console.log(`📋 Found ${pendingTasks.length} pending tasks`);

      for (const task of pendingTasks) {
        try {
          console.log(`⚡ Executing task: ${task.title} (${task.type})`);

          const result = await task.execute();

          if (result.success) {
            console.log(`✅ Task executed successfully: ${task.title}`);
            console.log(`📊 Duration: ${result.duration}ms`);

            // Send notification if needed
            await this.sendTaskNotification(task, result);
          } else {
            console.error(`❌ Task execution failed: ${task.title}`);
            console.error(`🔍 Error: ${result.error}`);
          }
        } catch (error) {
          console.error(`❌ Error executing task ${task.title}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error checking tasks:', error);
    }
  }

  // Process recurring tasks
  async processRecurringTasks(pattern) {
    try {
      const recurringTasks = await Task.find({
        'recurring.enabled': true,
        'recurring.pattern': pattern,
        status: 'pending'
      });

      console.log(`🔄 Processing ${recurringTasks.length} ${pattern} recurring tasks`);

      for (const task of recurringTasks) {
        try {
          const result = await task.execute();
          console.log(`✅ Recurring task executed: ${task.title}`);
        } catch (error) {
          console.error(`❌ Recurring task error: ${task.title}`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${pattern} recurring tasks:`, error);
    }
  }

  // Schedule a new task
  async scheduleTask(taskData) {
    try {
      const task = new Task(taskData);
      await task.save();

      console.log(`📅 Task scheduled: ${task.title} for ${task.scheduledFor}`);

      // If it's a recurring task, set up the next execution
      if (task.recurring.enabled) {
        task.updateNextExecution();
        await task.save();
      }

      return task;
    } catch (error) {
      console.error('❌ Error scheduling task:', error);
      throw error;
    }
  }

  // Schedule task from voice command
  async scheduleFromVoice(userId, voiceCommand, scheduledFor) {
    try {
      const task = await Task.createFromVoice(userId, voiceCommand, scheduledFor);

      console.log(`🎤 Voice task scheduled: "${voiceCommand}" for ${scheduledFor}`);

      return task;
    } catch (error) {
      console.error('❌ Error scheduling voice task:', error);
      throw error;
    }
  }

  // Get user's tasks
  async getUserTasks(userId, status = null) {
    try {
      return await Task.findUserTasks(userId, status);
    } catch (error) {
      console.error('❌ Error getting user tasks:', error);
      throw error;
    }
  }

  // Cancel a task
  async cancelTask(taskId, userId) {
    try {
      const task = await Task.findOne({ _id: taskId, userId });

      if (!task) {
        throw new Error('Task not found or access denied');
      }

      task.status = 'cancelled';
      await task.save();

      console.log(`❌ Task cancelled: ${task.title}`);
      return task;
    } catch (error) {
      console.error('❌ Error cancelling task:', error);
      throw error;
    }
  }

  // Update task
  async updateTask(taskId, userId, updates) {
    try {
      const task = await Task.findOne({ _id: taskId, userId });

      if (!task) {
        throw new Error('Task not found or access denied');
      }

      Object.assign(task, updates);
      await task.save();

      console.log(`✏️ Task updated: ${task.title}`);
      return task;
    } catch (error) {
      console.error('❌ Error updating task:', error);
      throw error;
    }
  }

  // Send task notification
  async sendTaskNotification(task, result) {
    try {
      // TODO: Implement notification system (email, push, etc.)
      console.log(`📢 Task notification: ${task.title} - ${result.result}`);

      // For now, just log the notification
      return true;
    } catch (error) {
      console.error('❌ Error sending task notification:', error);
      return false;
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.size,
      lastCheck: new Date().toISOString()
    };
  }

  // Get task statistics
  async getStatistics() {
    try {
      const stats = await Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalTasks = stats.reduce((sum, stat) => sum + stat.count, 0);

      return {
        total: totalTasks,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        schedulerStatus: this.getStatus()
      };
    } catch (error) {
      console.error('❌ Error getting task statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const taskScheduler = new TaskScheduler();

module.exports = taskScheduler;
