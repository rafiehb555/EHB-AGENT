const cron = require("node-cron");
const Task = require("../models/Task");

// Import AI response function (you'll need to create this)
const getAIResponse = require("../ai-core/gptRouter");

class TaskScheduler {
  constructor() {
    this.isRunning = false;
    this.lastCheck = null;
    this.stats = {
      totalExecuted: 0,
      totalFailed: 0,
      lastExecution: null
    };
  }

  // Start the scheduler
  start() {
    console.log("🚀 Starting Task Scheduler...");

    // Run every minute
    cron.schedule("* * * * *", async () => {
      await this.checkAndExecuteTasks();
    });

    // Run every 5 minutes for maintenance
    cron.schedule("*/5 * * * *", async () => {
      await this.performMaintenance();
    });

    this.isRunning = true;
    console.log("✅ Task Scheduler started successfully");
  }

  // Stop the scheduler
  stop() {
    console.log("🛑 Stopping Task Scheduler...");
    this.isRunning = false;
  }

  // Check and execute due tasks
  async checkAndExecuteTasks() {
    try {
      const now = new Date();
      this.lastCheck = now;

      // Get all due tasks
      const dueTasks = await Task.getDueTasks();

      if (dueTasks.length === 0) {
        return;
      }

      console.log(`⏰ Found ${dueTasks.length} due tasks`);

      // Execute each task
      for (let task of dueTasks) {
        await this.executeTask(task);
      }

      this.stats.lastExecution = now;
      console.log(`✅ Executed ${dueTasks.length} tasks at ${now.toLocaleTimeString()}`);

    } catch (error) {
      console.error("❌ Task scheduler error:", error);
    }
  }

  // Execute a single task
  async executeTask(task) {
    try {
      console.log(`🤖 Executing task: "${task.command}" (ID: ${task._id})`);

      // Check if task should be executed
      if (task.status !== 'pending') {
        console.log(`⚠️ Task ${task._id} is not pending (status: ${task.status})`);
        return;
      }

      if (task.executionCount >= task.maxExecutions) {
        console.log(`⚠️ Task ${task._id} has reached max executions`);
        await task.markAsFailed("Max executions reached");
        return;
      }

      // Execute the command via AI
      const aiResponse = await this.processCommandWithAI(task.command, task);

      if (aiResponse.success) {
        // Mark task as executed
        await task.markAsExecuted();
        this.stats.totalExecuted++;

        console.log(`✅ Task executed successfully: "${task.command}"`);
        console.log(`🤖 AI Response: ${aiResponse.response}`);

        // Handle recurring tasks
        if (task.recurring && task.recurringPattern) {
          await this.scheduleNextRecurringTask(task);
        }

        // Send notification if needed
        await this.sendTaskNotification(task, aiResponse.response);

      } else {
        // Mark task as failed
        await task.markAsFailed(aiResponse.error || "AI processing failed");
        this.stats.totalFailed++;

        console.log(`❌ Task failed: "${task.command}" - ${aiResponse.error}`);
      }

    } catch (error) {
      console.error(`❌ Error executing task ${task._id}:`, error);

      // Mark task as failed
      await task.markAsFailed(error.message);
      this.stats.totalFailed++;
    }
  }

  // Process command with AI
  async processCommandWithAI(command, task) {
    try {
      // Here you would integrate with your AI system
      // For now, we'll simulate AI processing

      const aiResponse = await getAIResponse(command);

      // Parse the AI response to determine if action should be taken
      const shouldExecute = this.parseAIResponse(aiResponse, command);

      return {
        success: shouldExecute,
        response: aiResponse,
        action: shouldExecute ? "executed" : "skipped"
      };

    } catch (error) {
      console.error("AI processing error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parse AI response to determine if action should be executed
  parseAIResponse(aiResponse, originalCommand) {
    const response = aiResponse.toLowerCase();
    const command = originalCommand.toLowerCase();

    // Check for confirmation keywords
    const confirmKeywords = ['yes', 'confirm', 'proceed', 'execute', 'done', 'completed'];
    const denyKeywords = ['no', 'cancel', 'skip', 'ignore', 'failed'];

    // Check for order-related commands
    const orderKeywords = ['order', 'buy', 'purchase', 'book', 'schedule'];
    const isOrderCommand = orderKeywords.some(keyword => command.includes(keyword));

    // If it's an order command, be more careful
    if (isOrderCommand) {
      // Check if AI response indicates success
      return confirmKeywords.some(keyword => response.includes(keyword)) &&
             !denyKeywords.some(keyword => response.includes(keyword));
    }

    // For other commands, be more permissive
    return !denyKeywords.some(keyword => response.includes(keyword));
  }

  // Schedule next recurring task
  async scheduleNextRecurringTask(task) {
    try {
      const nextRunAt = this.calculateNextRunTime(task.runAt, task.recurringPattern);

      if (nextRunAt) {
        const nextTask = new Task({
          user: task.user,
          command: task.command,
          runAt: nextRunAt,
          category: task.category,
          priority: task.priority,
          recurring: true,
          recurringPattern: task.recurringPattern,
          maxExecutions: task.maxExecutions,
          notes: task.notes,
          tags: task.tags,
          voiceCommand: task.voiceCommand,
          language: task.language,
          location: task.location,
          budget: task.budget,
          autoConfirm: task.autoConfirm
        });

        await nextTask.save();
        console.log(`🔄 Scheduled next recurring task for ${nextRunAt.toLocaleString()}`);
      }
    } catch (error) {
      console.error("Error scheduling next recurring task:", error);
    }
  }

  // Calculate next run time for recurring tasks
  calculateNextRunTime(currentRunAt, pattern) {
    const next = new Date(currentRunAt);

    switch (pattern) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        return null;
    }

    return next;
  }

  // Send task notification
  async sendTaskNotification(task, aiResponse) {
    try {
      // Here you would integrate with your notification system
      // For now, we'll just log it

      const notification = {
        type: "task_executed",
        taskId: task._id,
        command: task.command,
        response: aiResponse,
        timestamp: new Date(),
        user: task.user
      };

      console.log(`🔔 Task notification: ${task.command} - ${aiResponse}`);

      // In real implementation, you would:
      // - Send push notification
      // - Send email
      // - Update UI
      // - Play sound

    } catch (error) {
      console.error("Error sending task notification:", error);
    }
  }

  // Perform maintenance tasks
  async performMaintenance() {
    try {
      console.log("🧹 Performing scheduler maintenance...");

      // Clean up old completed tasks (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await Task.deleteMany({
        status: 'done',
        lastExecuted: { $lt: thirtyDaysAgo }
      });

      if (deletedCount.deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${deletedCount.deletedCount} old completed tasks`);
      }

      // Mark overdue tasks as failed
      const overdueTasks = await Task.find({
        status: 'pending',
        runAt: { $lt: new Date() }
      });

      for (const task of overdueTasks) {
        await task.markAsFailed("Task was overdue");
      }

      if (overdueTasks.length > 0) {
        console.log(`⚠️ Marked ${overdueTasks.length} overdue tasks as failed`);
      }

    } catch (error) {
      console.error("Maintenance error:", error);
    }
  }

  // Get scheduler statistics
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      uptime: this.lastCheck ? Date.now() - this.lastCheck.getTime() : 0
    };
  }
}

// Create and export scheduler instance
const taskScheduler = new TaskScheduler();

module.exports = taskScheduler;
