// Permission levels and token requirements
const PERMISSION_LEVELS = {
    BASIC: {
        name: 'Basic',
        requiredTokens: 10,
        features: ['Basic robot commands', 'Simple queries', 'View status']
    },
    STANDARD: {
        name: 'Standard',
        requiredTokens: 100,
        features: ['Appointment booking', 'Payment processing', 'Basic automation']
    },
    PREMIUM: {
        name: 'Premium',
        requiredTokens: 500,
        features: ['VIP services', 'Advanced automation', 'Priority support']
    },
    VIP: {
        name: 'VIP',
        requiredTokens: 1000,
        features: ['All features', 'Unlimited access', 'Priority execution', 'Custom automation']
    },
    VALIDATOR: {
        name: 'Validator',
        requiredTokens: 5000,
        features: ['Validator tools', 'Staking management', 'Rewards automation', 'Uptime monitoring']
    }
};

// Action permissions
const ACTION_PERMISSIONS = {
    'appointment_book': { requiredTokens: 10, level: 'BASIC' },
    'appointment_cancel': { requiredTokens: 10, level: 'BASIC' },
    'payment_process': { requiredTokens: 100, level: 'STANDARD' },
    'vip_service': { requiredTokens: 1000, level: 'VIP' },
    'validator_stake': { requiredTokens: 5000, level: 'VALIDATOR' },
    'validator_unstake': { requiredTokens: 5000, level: 'VALIDATOR' },
    'claim_rewards': { requiredTokens: 5000, level: 'VALIDATOR' },
    'auto_stake': { requiredTokens: 5000, level: 'VALIDATOR' },
    'marketplace_order': { requiredTokens: 100, level: 'STANDARD' },
    'portfolio_rebalance': { requiredTokens: 500, level: 'PREMIUM' },
    'automated_trading': { requiredTokens: 1000, level: 'VIP' },
    'custom_automation': { requiredTokens: 1000, level: 'VIP' }
};

// User roles
const USER_ROLES = {
    USER: 'user',
    VALIDATOR: 'validator',
    ADMIN: 'admin',
    VIP: 'vip'
};

interface WalletInfo {
    address: string;
    balance: number;
    lockedTokens: number;
    stakedAmount: number;
    isValidator: boolean;
    lastActivity: string;
}

interface PermissionCheck {
    allowed: boolean;
    message: string;
    requiredTokens: number;
    currentTokens: number;
    level: string;
    features: string[];
}

class RobotPermission {
    private userPermissions: Map<string, any> = new Map();
    private walletCache: Map<string, WalletInfo> = new Map();

    constructor() {
        console.log('✅ Robot Permission system initialized');
    }

    // Check if user can perform action
    async checkActionPermission(
        walletAddress: string,
        action: string
    ): Promise<PermissionCheck> {
        try {
            const actionPermission = ACTION_PERMISSIONS[action];
            if (!actionPermission) {
                return {
                    allowed: false,
                    message: '❌ Unknown action. Permission denied.',
                    requiredTokens: 0,
                    currentTokens: 0,
                    level: 'NONE',
                    features: []
                };
            }

            const walletInfo = await this.getWalletInfo(walletAddress);
            const hasEnoughTokens = walletInfo.balance >= actionPermission.requiredTokens;

            if (hasEnoughTokens) {
                const level = PERMISSION_LEVELS[actionPermission.level];
                return {
                    allowed: true,
                    message: `✅ Access granted for ${action}. You have ${walletInfo.balance} EHBGC.`,
                    requiredTokens: actionPermission.requiredTokens,
                    currentTokens: walletInfo.balance,
                    level: level.name,
                    features: level.features
                };
            } else {
                return {
                    allowed: false,
                    message: `❌ Insufficient tokens for ${action}. Required: ${actionPermission.requiredTokens} EHBGC, Available: ${walletInfo.balance} EHBGC.`,
                    requiredTokens: actionPermission.requiredTokens,
                    currentTokens: walletInfo.balance,
                    level: 'INSUFFICIENT',
                    features: []
                };
            }
        } catch (error) {
            console.error('Check action permission error:', error);
            return {
                allowed: false,
                message: '❌ Failed to check permissions.',
                requiredTokens: 0,
                currentTokens: 0,
                level: 'ERROR',
                features: []
            };
        }
    }

    // Get user permission level
    async getUserPermissionLevel(walletAddress: string): Promise<{
        level: string;
        features: string[];
        message: string;
        nextLevel?: string;
        tokensToNextLevel?: number;
    }> {
        try {
            const walletInfo = await this.getWalletInfo(walletAddress);

            // Determine current level
            let currentLevel = 'BASIC';
            for (const [level, config] of Object.entries(PERMISSION_LEVELS)) {
                if (walletInfo.balance >= config.requiredTokens) {
                    currentLevel = level;
                } else {
                    break;
                }
            }

            const levelConfig = PERMISSION_LEVELS[currentLevel];
            const nextLevel = this.getNextLevel(currentLevel);
            const tokensToNextLevel = nextLevel ?
                PERMISSION_LEVELS[nextLevel].requiredTokens - walletInfo.balance : 0;

            return {
                level: levelConfig.name,
                features: levelConfig.features,
                message: `Current level: ${levelConfig.name} (${walletInfo.balance} EHBGC)`,
                nextLevel: nextLevel ? PERMISSION_LEVELS[nextLevel].name : undefined,
                tokensToNextLevel: tokensToNextLevel > 0 ? tokensToNextLevel : 0
            };
        } catch (error) {
            console.error('Get user permission level error:', error);
            return {
                level: 'ERROR',
                features: [],
                message: '❌ Failed to get permission level.'
            };
        }
    }

    // Check VIP access
    async checkVIPAccess(walletAddress: string): Promise<{
        hasVIP: boolean;
        message: string;
        features: string[];
    }> {
        try {
            const walletInfo = await this.getWalletInfo(walletAddress);
            const hasVIP = walletInfo.balance >= 1000;

            if (hasVIP) {
                return {
                    hasVIP: true,
                    message: '✅ VIP access granted. You have access to all premium features.',
                    features: PERMISSION_LEVELS.VIP.features
                };
            } else {
                const tokensNeeded = 1000 - walletInfo.balance;
                return {
                    hasVIP: false,
                    message: `⚠️ VIP access required. You need ${tokensNeeded} more EHBGC for VIP access.`,
                    features: []
                };
            }
        } catch (error) {
            console.error('Check VIP access error:', error);
            return {
                hasVIP: false,
                message: '❌ Failed to check VIP access.',
                features: []
            };
        }
    }

    // Check validator permissions
    async checkValidatorPermissions(walletAddress: string): Promise<{
        isValidator: boolean;
        canStake: boolean;
        canUnstake: boolean;
        canClaimRewards: boolean;
        message: string;
    }> {
        try {
            const walletInfo = await this.getWalletInfo(walletAddress);
            const hasValidatorTokens = walletInfo.balance >= 5000;

            if (walletInfo.isValidator && hasValidatorTokens) {
                return {
                    isValidator: true,
                    canStake: true,
                    canUnstake: true,
                    canClaimRewards: true,
                    message: '✅ Validator permissions granted. You can manage staking and rewards.'
                };
            } else if (hasValidatorTokens) {
                return {
                    isValidator: false,
                    canStake: true,
                    canUnstake: false,
                    canClaimRewards: false,
                    message: '⚠️ You have enough tokens to become a validator. Stake to activate validator features.'
                };
            } else {
                const tokensNeeded = 5000 - walletInfo.balance;
                return {
                    isValidator: false,
                    canStake: false,
                    canUnstake: false,
                    canClaimRewards: false,
                    message: `❌ Validator access requires 5000 EHBGC. You need ${tokensNeeded} more tokens.`
                };
            }
        } catch (error) {
            console.error('Check validator permissions error:', error);
            return {
                isValidator: false,
                canStake: false,
                canUnstake: false,
                canClaimRewards: false,
                message: '❌ Failed to check validator permissions.'
            };
        }
    }

    // Get available actions for user
    async getAvailableActions(walletAddress: string): Promise<{
        actions: string[];
        message: string;
    }> {
        try {
            const walletInfo = await this.getWalletInfo(walletAddress);
            const availableActions: string[] = [];

            for (const [action, permission] of Object.entries(ACTION_PERMISSIONS)) {
                if (walletInfo.balance >= permission.requiredTokens) {
                    availableActions.push(action);
                }
            }

            return {
                actions: availableActions,
                message: `You have access to ${availableActions.length} actions with ${walletInfo.balance} EHBGC.`
            };
        } catch (error) {
            console.error('Get available actions error:', error);
            return {
                actions: [],
                message: '❌ Failed to get available actions.'
            };
        }
    }

    // Update user permissions
    async updateUserPermissions(walletAddress: string, permissions: any): Promise<boolean> {
        try {
            this.userPermissions.set(walletAddress, {
                ...this.userPermissions.get(walletAddress),
                ...permissions,
                updatedAt: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Update user permissions error:', error);
            return false;
        }
    }

    // Get permission statistics
    getPermissionStatistics(): {
        totalUsers: number;
        vipUsers: number;
        validatorUsers: number;
        averageTokens: number;
    } {
        const users = Array.from(this.walletCache.values());

        return {
            totalUsers: users.length,
            vipUsers: users.filter(user => user.balance >= 1000).length,
            validatorUsers: users.filter(user => user.isValidator).length,
            averageTokens: users.length > 0 ?
                users.reduce((sum, user) => sum + user.balance, 0) / users.length : 0
        };
    }

    // Private helper methods
    private async getWalletInfo(walletAddress: string): Promise<WalletInfo> {
        // Check cache first
        const cached = this.walletCache.get(walletAddress);
        if (cached) {
            return cached;
        }

        // Mock wallet info (in real implementation, this would query blockchain)
        const walletInfo: WalletInfo = {
            address: walletAddress,
            balance: Math.floor(Math.random() * 2000) + 100, // 100-2100 EHBGC
            lockedTokens: Math.floor(Math.random() * 500),
            stakedAmount: Math.floor(Math.random() * 1000),
            isValidator: Math.random() > 0.7, // 30% chance of being validator
            lastActivity: new Date().toISOString()
        };

        this.walletCache.set(walletAddress, walletInfo);
        return walletInfo;
    }

    private getNextLevel(currentLevel: string): string | null {
        const levels = Object.keys(PERMISSION_LEVELS);
        const currentIndex = levels.indexOf(currentLevel);

        if (currentIndex < levels.length - 1) {
            return levels[currentIndex + 1];
        }

        return null;
    }

    // Clear old cache entries
    clearOldCache(hoursOld: number = 24): number {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hoursOld);

        let clearedCount = 0;
        for (const [address, info] of this.walletCache.entries()) {
            if (new Date(info.lastActivity) < cutoff) {
                this.walletCache.delete(address);
                clearedCount++;
            }
        }

        return clearedCount;
    }
}

export default RobotPermission;
