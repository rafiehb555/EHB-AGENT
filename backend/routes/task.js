const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// POST: Create a new task
router.post("/schedule", async (req, res) => {
  try {
    const {
      user,
      command,
      runAt,
      category = "general",
      priority = "medium",
      recurring = false,
      recurringPattern,
      maxExecutions = 1,
      notes,
      tags = [],
      voiceCommand = false,
      language = "english",
      location,
      budget,
      autoConfirm = false
    } = req.body;

    if (!command || !runAt) {
      return res.status(400).json({
        success: false,
        error: "Command and runAt are required"
      });
    }

    const newTask = new Task({
      user: user || "default",
      command,
      runAt: new Date(runAt),
      category,
      priority,
      recurring,
      recurringPattern,
      maxExecutions,
      notes,
      tags,
      voiceCommand,
      language,
      location,
      budget,
      autoConfirm
    });

    await newTask.save();

    console.log(`⏰ Task scheduled: "${command}" at ${newTask.runAt}`);

    res.json({
      success: true,
      task: newTask,
      message: `Task scheduled for ${newTask.runAt.toLocaleString()}`
    });
  } catch (err) {
    console.error("Scheduler error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to schedule task"
    });
  }
});

// GET: Get all tasks for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, category } = req.query;

    let query = { user: userId };
    if (status) query.status = status;
    if (category) query.category = category;

    const tasks = await Task.find(query).sort({ runAt: 1 });

    res.json({
      success: true,
      data: {
        tasks,
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completed: tasks.filter(t => t.status === 'done').length,
        failed: tasks.filter(t => t.status === 'failed').length
      }
    });
  } catch (err) {
    console.error("Get user tasks error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to get tasks"
    });
  }
});

// GET: Get due tasks (for scheduler)
router.get("/due", async (req, res) => {
  try {
    const dueTasks = await Task.getDueTasks();

    res.json({
      success: true,
      data: {
        tasks: dueTasks,
        count: dueTasks.length
      }
    });
  } catch (err) {
    console.error("Get due tasks error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to get due tasks"
    });
  }
});

// PUT: Update task status
router.put("/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found"
      });
    }

    task.status = status;
    if (notes) task.notes = notes;

    if (status === 'done') {
      task.lastExecuted = new Date();
      task.executionCount += 1;
    }

    await task.save();

    res.json({
      success: true,
      task,
      message: `Task marked as ${status}`
    });
  } catch (err) {
    console.error("Update task status error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update task"
    });
  }
});

// DELETE: Delete a task
router.delete("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete task"
    });
  }
});

// GET: Get task statistics
router.get("/statistics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const tasks = await Task.find({ user: userId });

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      completed: tasks.filter(t => t.status === 'done').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      overdue: tasks.filter(t => t.isOverdue()).length,
      byCategory: tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {}),
      byPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {}),
      recurring: tasks.filter(t => t.recurring).length,
      voiceCommands: tasks.filter(t => t.voiceCommand).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error("Get task statistics error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to get statistics"
    });
  }
});

// POST: Execute a task immediately
router.post("/:taskId/execute", async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found"
      });
    }

    if (task.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: "Task is not pending"
      });
    }

    // Execute the task
    console.log(`🤖 Executing task: "${task.command}"`);

    // Here you would integrate with AI and action execution
    // For now, we'll just mark it as done
    await task.markAsExecuted();

    res.json({
      success: true,
      task,
      message: "Task executed successfully"
    });
  } catch (err) {
    console.error("Execute task error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to execute task"
    });
  }
});

// POST: Schedule recurring task
router.post("/schedule-recurring", async (req, res) => {
  try {
    const {
      user,
      command,
      pattern, // "daily", "weekly", "monthly"
      startDate,
      endDate,
      maxExecutions = 10,
      category = "general"
    } = req.body;

    if (!command || !pattern || !startDate) {
      return res.status(400).json({
        success: false,
        error: "Command, pattern, and startDate are required"
      });
    }

    const tasks = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year default

    let currentDate = new Date(start);
    let executionCount = 0;

    while (currentDate <= end && executionCount < maxExecutions) {
      const task = new Task({
        user: user || "default",
        command,
        runAt: new Date(currentDate),
        category,
        recurring: true,
        recurringPattern: pattern,
        maxExecutions: 1, // Each individual task has max 1 execution
        voiceCommand: false
      });

      tasks.push(task);
      executionCount++;

      // Calculate next date based on pattern
      switch (pattern) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: "Invalid pattern. Use 'daily', 'weekly', or 'monthly'"
          });
      }
    }

    await Task.insertMany(tasks);

    res.json({
      success: true,
      data: {
        tasksCreated: tasks.length,
        firstTask: tasks[0],
        lastTask: tasks[tasks.length - 1]
      },
      message: `Scheduled ${tasks.length} recurring tasks`
    });
  } catch (err) {
    console.error("Schedule recurring task error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to schedule recurring task"
    });
  }
});

module.exports = router;
