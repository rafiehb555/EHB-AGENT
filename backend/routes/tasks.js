const express = require('express');
const router = express.Router();
const taskScheduler = require('../services/taskScheduler');
const Task = require('../models/Task');
const { processVoiceText } = require('../controllers/aiController');

// Helper function to extract user ID (for now, using a default)
const getUserId = (req) => {
  return req.headers['user-id'] || 'default-user';
};

// Get all tasks for a user
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status, type, limit = 50, page = 1 } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .sort({ scheduledFor: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tasks'
    });
  }
});

// Get a specific task
router.get('/:taskId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get task'
    });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      title,
      description,
      type = 'reminder',
      scheduledFor,
      recurring = {},
      priority = 'medium',
      voiceCommand,
      aiPrompt,
      context = {},
      tags = [],
      category
    } = req.body;

    if (!title || !scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Title and scheduledFor are required'
      });
    }

    const taskData = {
      title,
      description,
      type,
      scheduledFor: new Date(scheduledFor),
      recurring,
      priority,
      voiceCommand,
      aiPrompt,
      context,
      tags,
      category,
      userId
    };

    const task = await taskScheduler.scheduleTask(taskData);

    res.status(201).json({
      success: true,
      task,
      message: 'Task scheduled successfully'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
});

// Schedule task from voice command
router.post('/voice', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { voiceCommand, scheduledFor, context = {} } = req.body;

    if (!voiceCommand || !scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Voice command and scheduledFor are required'
      });
    }

    // Parse natural language for scheduling
    const parsedSchedule = await parseVoiceSchedule(voiceCommand, scheduledFor);

    const task = await taskScheduler.scheduleFromVoice(
      userId,
      voiceCommand,
      parsedSchedule
    );

    res.status(201).json({
      success: true,
      task,
      message: 'Voice task scheduled successfully'
    });
  } catch (error) {
    console.error('Schedule voice task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule voice task'
    });
  }
});

// Update a task
router.put('/:taskId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { taskId } = req.params;
    const updates = req.body;

    const task = await taskScheduler.updateTask(taskId, userId, updates);

    res.json({
      success: true,
      task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update task'
    });
  }
});

// Cancel a task
router.delete('/:taskId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { taskId } = req.params;

    const task = await taskScheduler.cancelTask(taskId, userId);

    res.json({
      success: true,
      task,
      message: 'Task cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel task'
    });
  }
});

// Execute a task immediately
router.post('/:taskId/execute', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const result = await task.execute();

    res.json({
      success: true,
      result,
      task,
      message: 'Task executed successfully'
    });
  } catch (error) {
    console.error('Execute task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute task'
    });
  }
});

// Get task statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = getUserId(req);

    const stats = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      stats: {
        total: totalTasks,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        schedulerStatus: taskScheduler.getStatus()
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get task statistics'
    });
  }
});

// Get upcoming tasks
router.get('/upcoming/list', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { limit = 10 } = req.query;

    const upcomingTasks = await Task.find({
      userId,
      status: 'pending',
      scheduledFor: { $gte: new Date() }
    })
    .sort({ scheduledFor: 1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      tasks: upcomingTasks
    });
  } catch (error) {
    console.error('Get upcoming tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming tasks'
    });
  }
});

// Get overdue tasks
router.get('/overdue/list', async (req, res) => {
  try {
    const userId = getUserId(req);

    const overdueTasks = await Task.find({
      userId,
      status: 'pending',
      scheduledFor: { $lt: new Date() }
    }).sort({ scheduledFor: 1 });

    res.json({
      success: true,
      tasks: overdueTasks
    });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get overdue tasks'
    });
  }
});

// Bulk operations
router.post('/bulk/delete', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({
        success: false,
        error: 'Task IDs array is required'
      });
    }

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, userId },
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} tasks cancelled`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk delete tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk delete tasks'
    });
  }
});

// Parse voice schedule using AI
async function parseVoiceSchedule(voiceCommand, defaultTime) {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
    Parse this voice command and extract scheduling information:
    Voice Command: "${voiceCommand}"
    Default Time: ${defaultTime}

    Return only a JSON object with:
    {
      "scheduledFor": "ISO date string",
      "recurring": {
        "enabled": boolean,
        "pattern": "daily|weekly|monthly|yearly",
        "interval": number
      },
      "priority": "low|medium|high|urgent"
    }

    Examples:
    - "remind me to take medicine tomorrow at 9am" → scheduledFor: tomorrow 9am
    - "daily reminder to exercise" → recurring: daily
    - "urgent meeting in 2 hours" → priority: urgent, scheduledFor: now + 2 hours
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a scheduling assistant. Parse voice commands and extract scheduling information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200
    });

    const response = completion.choices[0].message.content;
    const parsed = JSON.parse(response);

    return new Date(parsed.scheduledFor);
  } catch (error) {
    console.error('Error parsing voice schedule:', error);
    // Fallback to default time
    return new Date(defaultTime);
  }
}

module.exports = router;
