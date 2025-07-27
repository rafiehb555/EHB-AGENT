import express from 'express';
import RobotBlockchain from '../../utils/robotBlockchain';
import RobotPermission from '../../utils/robotPermission';

const router = express.Router();
const robotBlockchain = new RobotBlockchain();
const robotPermission = new RobotPermission();

// GET /api/validator-status/:walletAddress
router.get('/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required'
            });
        }

        // Get validator status from blockchain
        const validatorStatus = await robotBlockchain.getValidatorStatus(walletAddress);

        // Get permission level
        const permissionLevel = await robotPermission.getUserPermissionLevel(walletAddress);

        // Get VIP access status
        const vipAccess = await robotPermission.checkVIPAccess(walletAddress);

        // Get validator permissions
        const validatorPermissions = await robotPermission.checkValidatorPermissions(walletAddress);

        res.json({
            success: true,
            walletAddress,
            validator: {
                isValidator: validatorStatus.isValidator,
                stakedAmount: validatorStatus.stakedAmount,
                uptime: validatorStatus.uptime,
                penalties: validatorStatus.penalties,
                rank: validatorStatus.rank,
                totalValidators: validatorStatus.totalValidators,
                rewards: validatorStatus.rewards,
                lastStake: validatorStatus.lastStake
            },
            permissions: {
                level: permissionLevel.level,
                features: permissionLevel.features,
                hasVIP: vipAccess.hasVIP,
                validatorPermissions: validatorPermissions
            },
            message: validatorStatus.isValidator ?
                `You're ranked #${validatorStatus.rank} out of ${validatorStatus.totalValidators} validators` :
                'You are not currently a validator',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get validator status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get validator status'
        });
    }
});

// POST /api/validator-status/stake
router.post('/stake', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body;

        if (!walletAddress || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address and amount are required'
            });
        }

        // Check validator permissions
        const validatorPermissions = await robotPermission.checkValidatorPermissions(walletAddress);

        if (!validatorPermissions.canStake) {
            return res.status(403).json({
                success: false,
                error: validatorPermissions.message
            });
        }

        // Mock staking transaction
        const stakeResult = {
            success: true,
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            amount: amount,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            message: `Successfully staked ${amount} EHBGC`,
            transaction: stakeResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Stake error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process stake'
        });
    }
});

// POST /api/validator-status/unstake
router.post('/unstake', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body;

        if (!walletAddress || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address and amount are required'
            });
        }

        // Check validator permissions
        const validatorPermissions = await robotPermission.checkValidatorPermissions(walletAddress);

        if (!validatorPermissions.canUnstake) {
            return res.status(403).json({
                success: false,
                error: validatorPermissions.message
            });
        }

        // Mock unstaking transaction
        const unstakeResult = {
            success: true,
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            amount: amount,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            message: `Successfully unstaked ${amount} EHBGC`,
            transaction: unstakeResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Unstake error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process unstake'
        });
    }
});

// POST /api/validator-status/claim-rewards
router.post('/claim-rewards', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required'
            });
        }

        // Check validator permissions
        const validatorPermissions = await robotPermission.checkValidatorPermissions(walletAddress);

        if (!validatorPermissions.canClaimRewards) {
            return res.status(403).json({
                success: false,
                error: validatorPermissions.message
            });
        }

        // Get validator status to calculate rewards
        const validatorStatus = await robotBlockchain.getValidatorStatus(walletAddress);
        const rewards = validatorStatus.rewards;

        // Mock claim transaction
        const claimResult = {
            success: true,
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            rewards: rewards,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            message: `Successfully claimed ${rewards} EHBGC rewards`,
            transaction: claimResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Claim rewards error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to claim rewards'
        });
    }
});

// GET /api/validator-status/ranking/:walletAddress
router.get('/ranking/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const validatorStatus = await robotBlockchain.getValidatorStatus(walletAddress);

        res.json({
            success: true,
            walletAddress,
            ranking: {
                rank: validatorStatus.rank,
                totalValidators: validatorStatus.totalValidators,
                percentage: ((validatorStatus.totalValidators - validatorStatus.rank) / validatorStatus.totalValidators * 100).toFixed(2),
                tier: this.getRankingTier(validatorStatus.rank, validatorStatus.totalValidators)
            },
            performance: {
                uptime: validatorStatus.uptime,
                penalties: validatorStatus.penalties,
                stakedAmount: validatorStatus.stakedAmount,
                rewards: validatorStatus.rewards
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get ranking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get ranking'
        });
    }
});

// GET /api/validator-status/statistics
router.get('/statistics/overview', async (req, res) => {
    try {
        const permissionStats = robotPermission.getPermissionStatistics();

        res.json({
            success: true,
            statistics: {
                totalValidators: permissionStats.validatorUsers,
                totalUsers: permissionStats.totalUsers,
                vipUsers: permissionStats.vipUsers,
                averageTokens: permissionStats.averageTokens.toFixed(2),
                validatorPercentage: ((permissionStats.validatorUsers / permissionStats.totalUsers) * 100).toFixed(2)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
});

// POST /api/validator-status/auto-stake
router.post('/auto-stake', async (req, res) => {
    try {
        const { walletAddress, enabled, frequency = 'weekly' } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required'
            });
        }

        // Check validator permissions
        const validatorPermissions = await robotPermission.checkValidatorPermissions(walletAddress);

        if (!validatorPermissions.isValidator) {
            return res.status(403).json({
                success: false,
                error: 'Auto-stake is only available for active validators'
            });
        }

        // Mock auto-stake configuration
        const autoStakeConfig = {
            enabled,
            frequency,
            walletAddress,
            lastExecution: new Date().toISOString(),
            nextExecution: this.calculateNextExecution(frequency)
        };

        res.json({
            success: true,
            message: `Auto-stake ${enabled ? 'enabled' : 'disabled'} for ${frequency} frequency`,
            config: autoStakeConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Auto-stake error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to configure auto-stake'
        });
    }
});

// Helper methods
private getRankingTier(rank: number, totalValidators: number): string {
    const percentage = (rank / totalValidators) * 100;

    if (percentage <= 10) return 'Elite';
    if (percentage <= 25) return 'Gold';
    if (percentage <= 50) return 'Silver';
    if (percentage <= 75) return 'Bronze';
    return 'Standard';
}

private calculateNextExecution(frequency: string): string {
    const now = new Date();
    let nextExecution: Date;

    switch (frequency) {
        case 'daily':
            nextExecution = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
        case 'weekly':
            nextExecution = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
        case 'monthly':
            nextExecution = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            nextExecution = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return nextExecution.toISOString();
}

export default router;
