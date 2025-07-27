import express from 'express';
import RobotBlockchain from '../../utils/robotBlockchain';
import RobotAudit from '../../utils/robotAudit';

const router = express.Router();
const robotBlockchain = new RobotBlockchain();
const robotAudit = new RobotAudit();

// POST /blockchain/save-robot-memory
router.post('/save-robot-memory', async (req, res) => {
    try {
        const { userId, memoryHash, timestamp } = req.body;

        if (!userId || !memoryHash) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, memoryHash'
            });
        }

        // Create robot memory object
        const robotMemory = {
            userId,
            preferences: req.body.preferences || {},
            tasks: req.body.tasks || [],
            logs: req.body.logs || [],
            timestamp: timestamp || new Date().toISOString(),
            hash: memoryHash
        };

        // Save to blockchain
        const result = await robotBlockchain.saveRobotMemory(robotMemory);

        if (result.success) {
            // Log the action
            await robotAudit.logActionWithProof(
                userId,
                'robot_memory_saved',
                { memoryHash, timestamp },
                result.txId
            );

            res.json({
                success: true,
                message: 'Robot memory saved to blockchain successfully',
                hash: result.hash,
                txId: result.txId,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to save robot memory to blockchain'
            });
        }
    } catch (error) {
        console.error('Save robot memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /blockchain/robot-memory/:userId
router.get('/robot-memory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const memory = await robotBlockchain.getRobotMemory(userId);

        if (memory) {
            res.json({
                success: true,
                memory,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Robot memory not found'
            });
        }
    } catch (error) {
        console.error('Get robot memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /blockchain/memory-hash/:userId
router.get('/memory-hash/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const memory = await robotBlockchain.getRobotMemory(userId);

        if (memory) {
            res.json({
                success: true,
                hash: memory.hash,
                timestamp: memory.timestamp,
                lastUpdated: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Memory hash not found'
            });
        }
    } catch (error) {
        console.error('Get memory hash error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /blockchain/update-robot-memory
router.post('/update-robot-memory', async (req, res) => {
    try {
        const { userId, updates } = req.body;

        if (!userId || !updates) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, updates'
            });
        }

        // Get current memory
        const currentMemory = await robotBlockchain.getRobotMemory(userId);

        if (!currentMemory) {
            return res.status(404).json({
                success: false,
                error: 'Robot memory not found'
            });
        }

        // Update memory
        const updatedMemory = {
            ...currentMemory,
            ...updates,
            timestamp: new Date().toISOString()
        };

        // Save updated memory to blockchain
        const result = await robotBlockchain.saveRobotMemory(updatedMemory);

        if (result.success) {
            // Log the update action
            await robotAudit.logActionWithProof(
                userId,
                'robot_memory_updated',
                { updates, previousHash: currentMemory.hash },
                result.txId
            );

            res.json({
                success: true,
                message: 'Robot memory updated successfully',
                hash: result.hash,
                txId: result.txId,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update robot memory'
            });
        }
    } catch (error) {
        console.error('Update robot memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// DELETE /blockchain/robot-memory/:userId
router.delete('/robot-memory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Log the deletion action
        await robotAudit.logActionWithProof(
            userId,
            'robot_memory_deleted',
            { userId, deletedAt: new Date().toISOString() }
        );

        res.json({
            success: true,
            message: 'Robot memory deletion logged',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Delete robot memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /blockchain/memory-statistics
router.get('/memory-statistics', async (req, res) => {
    try {
        const auditStats = robotAudit.getAuditStatistics();

        res.json({
            success: true,
            statistics: {
                totalMemoryEntries: auditStats.totalLogs,
                verifiedEntries: auditStats.verifiedLogs,
                pendingEntries: auditStats.pendingLogs,
                failedEntries: auditStats.failedLogs,
                successRate: auditStats.successRate,
                averageResponseTime: auditStats.averageResponseTime
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get memory statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /blockchain/export-memory
router.post('/export-memory', async (req, res) => {
    try {
        const { userId, format = 'json' } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: userId'
            });
        }

        const memory = await robotBlockchain.getRobotMemory(userId);

        if (!memory) {
            return res.status(404).json({
                success: false,
                error: 'Robot memory not found'
            });
        }

        let exportData: string;
        let contentType: string;

        if (format === 'csv') {
            exportData = `User ID,Timestamp,Hash,Preferences Count,Tasks Count,Logs Count\n${userId},${memory.timestamp},${memory.hash},${Object.keys(memory.preferences).length},${memory.tasks.length},${memory.logs.length}`;
            contentType = 'text/csv';
        } else {
            exportData = JSON.stringify(memory, null, 2);
            contentType = 'application/json';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="robot-memory-${userId}-${new Date().toISOString().split('T')[0]}.${format}"`);

        res.send(exportData);
    } catch (error) {
        console.error('Export memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
