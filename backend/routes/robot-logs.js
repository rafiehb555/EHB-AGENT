const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for robot logs
const logLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many log requests, please try again later.'
});

// Robot Log Schema
const robotLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: String,
    responseTime: Number,
    logId: {
        type: String,
        unique: true,
        required: true
    }
});

const RobotLog = mongoose.model('RobotLog', robotLogSchema);

// Generate unique log ID
function generateLogId() {
    return `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// POST /api/robot-logs - Log robot activity
router.post('/', auth, logLimiter, async (req, res) => {
    try {
        const { action, data } = req.body;
        const userId = req.user.id;

        if (!action) {
            return res.status(400).json({
                success: false,
                message: 'Action is required'
            });
        }

        const log = new RobotLog({
            userId,
            action,
            data: data || {},
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
            sessionId: req.session?.id,
            logId: generateLogId()
        });

        await log.save();

        res.status(201).json({
            success: true,
            message: 'Activity logged successfully',
            logId: log.logId
        });

    } catch (error) {
        console.error('Robot log creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log activity'
        });
    }
});

// GET /api/robot-logs - Get robot activity logs (admin only)
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, action, startDate, endDate, success } = req.query;

        // Build query
        const query = {};

        if (userId) {
            query.userId = userId;
        }

        if (action) {
            query.action = action;
        }

        if (success !== undefined) {
            query.success = success === 'true';
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        const logs = await RobotLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await RobotLog.countDocuments(query);

        res.json({
            success: true,
            logs,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalLogs: count
        });

    } catch (error) {
        console.error('Get robot logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch robot logs'
        });
    }
});

// GET /api/robot-logs/analytics - Get robot analytics
router.get('/analytics', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.timestamp = {};
            if (startDate) {
                dateFilter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.timestamp.$lte = new Date(endDate);
            }
        }

        // Get total actions
        const totalActions = await RobotLog.countDocuments(dateFilter);

        // Get actions by type
        const actionsByType = await RobotLog.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get success rate
        const successCount = await RobotLog.countDocuments({
            ...dateFilter,
            success: true
        });
        const successRate = totalActions > 0 ? (successCount / totalActions) * 100 : 0;

        // Get top users
        const topUsers = await RobotLog.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$userId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get daily activity
        const dailyActivity = await RobotLog.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$timestamp' },
                        month: { $month: '$timestamp' },
                        day: { $dayOfMonth: '$timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $limit: 30 }
        ]);

        res.json({
            success: true,
            analytics: {
                totalActions,
                successRate: Math.round(successRate * 100) / 100,
                actionsByType,
                topUsers,
                dailyActivity
            }
        });

    } catch (error) {
        console.error('Get robot analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch robot analytics'
        });
    }
});

// GET /api/robot-logs/user/:userId - Get user's robot activity
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, action } = req.query;

        // Only allow users to view their own logs or admins
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const query = { userId };
        if (action) {
            query.action = action;
        }

        const logs = await RobotLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await RobotLog.countDocuments(query);

        res.json({
            success: true,
            logs,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalLogs: count
        });

    } catch (error) {
        console.error('Get user robot logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user robot logs'
        });
    }
});

// DELETE /api/robot-logs/:id - Delete specific log (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const log = await RobotLog.findOne({ logId: req.params.id });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        await RobotLog.deleteOne({ logId: req.params.id });

        res.json({
            success: true,
            message: 'Log deleted successfully'
        });

    } catch (error) {
        console.error('Delete robot log error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete log'
        });
    }
});

// POST /api/robot-logs/clear - Clear old logs (admin only)
router.post('/clear', auth, async (req, res) => {
    try {
        const { days = 30 } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await RobotLog.deleteMany({
            timestamp: { $lt: cutoffDate }
        });

        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} old logs`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Clear robot logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear old logs'
        });
    }
});

module.exports = router;
