import express from 'express';
import RobotMemory from '../../utils/robotMemory';

const router = express.Router();
const robotMemory = new RobotMemory();

// Log user feedback
router.post('/log-feedback', async (req, res) => {
    try {
        const { userId, interactionId, feedback, context } = req.body;

        if (!userId || !interactionId || !feedback) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, interactionId, feedback'
            });
        }

        const success = await robotMemory.addFeedback(userId, interactionId, feedback);

        if (success) {
            res.json({
                success: true,
                message: 'Feedback logged successfully',
                data: {
                    userId,
                    interactionId,
                    feedback,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Interaction not found'
            });
        }
    } catch (error) {
        console.error('Log feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get feedback statistics
router.get('/statistics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const history = await robotMemory.getInteractionHistory(userId, 1000);

        const feedbackStats = {
            total: history.length,
            positive: history.filter(log => log.feedback === 'positive').length,
            negative: history.filter(log => log.feedback === 'negative').length,
            neutral: history.filter(log => log.feedback === 'neutral').length,
            noFeedback: history.filter(log => !log.feedback).length
        };

        const satisfactionRate = feedbackStats.total > 0
            ? ((feedbackStats.positive + feedbackStats.neutral) / feedbackStats.total * 100).toFixed(1)
            : '0';

        res.json({
            success: true,
            data: {
                ...feedbackStats,
                satisfactionRate: `${satisfactionRate}%`
            }
        });
    } catch (error) {
        console.error('Get feedback statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user insights
router.get('/insights/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const insights = await robotMemory.getUserInsights(userId);

        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        console.error('Get user insights error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Export user data (for GDPR compliance)
router.get('/export-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = await robotMemory.exportUserData(userId);

        if (userData) {
            res.json({
                success: true,
                data: userData
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User data not found'
            });
        }
    } catch (error) {
        console.error('Export user data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Clear user data (for privacy)
router.delete('/clear-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const success = await robotMemory.clearUserData(userId);

        if (success) {
            res.json({
                success: true,
                message: 'User data cleared successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Clear user data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get interaction history
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const history = await robotMemory.getInteractionHistory(userId, Number(limit));

        res.json({
            success: true,
            data: {
                interactions: history,
                total: history.length
            }
        });
    } catch (error) {
        console.error('Get interaction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user preferences
router.put('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { preferences } = req.body;

        if (!preferences) {
            return res.status(400).json({
                success: false,
                message: 'Missing preferences data'
            });
        }

        const success = await robotMemory.saveUserPreferences(userId, preferences);

        if (success) {
            res.json({
                success: true,
                message: 'Preferences updated successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user preferences
router.get('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const preferences = await robotMemory.loadUserPreferences(userId);

        if (preferences) {
            res.json({
                success: true,
                data: preferences
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User preferences not found'
            });
        }
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
