import crypto from 'crypto';

// Audit Log Interface
interface AuditLog {
    id: string;
    userId: string;
    actionType: string;
    actionData: any;
    timestamp: string;
    hash: string;
    blockchainTxId?: string;
    verified: boolean;
    status: 'pending' | 'completed' | 'failed';
}

// Action Verification Interface
interface ActionVerification {
    actionId: string;
    hash: string;
    verified: boolean;
    timestamp: string;
    blockchainProof?: string;
}

class RobotAudit {
    private auditLogs: Map<string, AuditLog> = new Map();
    private verificationCache: Map<string, ActionVerification> = new Map();

    constructor() {
        console.log('✅ Robot Audit system initialized');
    }

    // Generate action hash
    generateActionHash(actionData: any): string {
        const actionString = JSON.stringify(actionData);
        return crypto.createHash('sha256').update(actionString).digest('hex');
    }

    // Create audit log entry
    createAuditLog(userId: string, actionType: string, actionData: any): AuditLog {
        const id = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        const hash = this.generateActionHash({
            id,
            userId,
            actionType,
            actionData,
            timestamp
        });

        const auditLog: AuditLog = {
            id,
            userId,
            actionType,
            actionData,
            timestamp,
            hash,
            verified: false,
            status: 'pending'
        };

        this.auditLogs.set(id, auditLog);
        return auditLog;
    }

    // Log action with blockchain proof
    async logActionWithProof(
        userId: string,
        actionType: string,
        actionData: any,
        blockchainTxId?: string
    ): Promise<{ success: boolean; logId: string; hash: string; message: string }> {
        try {
            const auditLog = this.createAuditLog(userId, actionType, actionData);

            if (blockchainTxId) {
                auditLog.blockchainTxId = blockchainTxId;
                auditLog.verified = true;
                auditLog.status = 'completed';
            }

            // Simulate blockchain verification
            await this.simulateBlockchainVerification(auditLog);

            return {
                success: true,
                logId: auditLog.id,
                hash: auditLog.hash,
                message: `🧾 ${this.getActionMessage(actionType)}. Blockchain Log ID: ${auditLog.hash.substring(0, 10)}...`
            };
        } catch (error) {
            console.error('Log action with proof error:', error);
            return {
                success: false,
                logId: '',
                hash: '',
                message: '❌ Failed to log action'
            };
        }
    }

    // Verify action on blockchain
    async verifyAction(actionHash: string): Promise<ActionVerification> {
        try {
            // Check cache first
            const cached = this.verificationCache.get(actionHash);
            if (cached) {
                return cached;
            }

            // Simulate blockchain verification
            const verified = await this.simulateBlockchainVerificationByHash(actionHash);

            const verification: ActionVerification = {
                actionId: actionHash,
                hash: actionHash,
                verified,
                timestamp: new Date().toISOString(),
                blockchainProof: verified ? `0x${crypto.randomBytes(32).toString('hex')}` : undefined
            };

            this.verificationCache.set(actionHash, verification);
            return verification;
        } catch (error) {
            console.error('Verify action error:', error);
            return {
                actionId: actionHash,
                hash: actionHash,
                verified: false,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Get audit logs for user
    getUserAuditLogs(userId: string, filter?: string): AuditLog[] {
        const logs = Array.from(this.auditLogs.values())
            .filter(log => log.userId === userId);

        if (filter) {
            return logs.filter(log => log.actionType.includes(filter));
        }

        return logs;
    }

    // Get all audit logs
    getAllAuditLogs(): AuditLog[] {
        return Array.from(this.auditLogs.values());
    }

    // Get audit log by ID
    getAuditLogById(logId: string): AuditLog | null {
        return this.auditLogs.get(logId) || null;
    }

    // Get audit statistics
    getAuditStatistics(): {
        totalLogs: number;
        verifiedLogs: number;
        pendingLogs: number;
        failedLogs: number;
        recentLogs: AuditLog[];
    } {
        const logs = Array.from(this.auditLogs.values());
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return {
            totalLogs: logs.length,
            verifiedLogs: logs.filter(log => log.verified).length,
            pendingLogs: logs.filter(log => log.status === 'pending').length,
            failedLogs: logs.filter(log => log.status === 'failed').length,
            recentLogs: logs.filter(log => new Date(log.timestamp) > oneDayAgo)
        };
    }

    // Export audit logs
    exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
        const logs = Array.from(this.auditLogs.values());

        if (format === 'csv') {
            const headers = ['ID', 'User ID', 'Action Type', 'Timestamp', 'Hash', 'Verified', 'Status'];
            const rows = logs.map(log => [
                log.id,
                log.userId,
                log.actionType,
                log.timestamp,
                log.hash,
                log.verified.toString(),
                log.status
            ]);

            return [headers, ...rows]
                .map(row => row.join(','))
                .join('\n');
        }

        return JSON.stringify(logs, null, 2);
    }

    // Clear old audit logs
    clearOldLogs(daysOld: number = 30): number {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);

        let clearedCount = 0;
        for (const [id, log] of this.auditLogs.entries()) {
            if (new Date(log.timestamp) < cutoff) {
                this.auditLogs.delete(id);
                clearedCount++;
            }
        }

        return clearedCount;
    }

    // Private helper methods
    private getActionMessage(actionType: string): string {
        const messages: { [key: string]: string } = {
            'appointment_booked': 'Appointment booked',
            'appointment_cancelled': 'Appointment cancelled',
            'payment_processed': 'Payment processed',
            'validator_stake': 'Validator stake updated',
            'rewards_claimed': 'Rewards claimed',
            'vip_service_used': 'VIP service used',
            'marketplace_order': 'Marketplace order placed',
            'portfolio_rebalanced': 'Portfolio rebalanced',
            'automated_task': 'Automated task executed',
            'wallet_verified': 'Wallet verified',
            'permissions_updated': 'Permissions updated'
        };

        return messages[actionType] || 'Action completed';
    }

    private async simulateBlockchainVerification(auditLog: AuditLog): Promise<void> {
        // Simulate blockchain verification delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate 95% success rate
        const success = Math.random() > 0.05;

        if (success) {
            auditLog.verified = true;
            auditLog.status = 'completed';
        } else {
            auditLog.status = 'failed';
        }
    }

    private async simulateBlockchainVerificationByHash(hash: string): Promise<boolean> {
        // Simulate blockchain verification delay
        await new Promise(resolve => setTimeout(resolve, 50));

        // Simulate 90% verification success rate
        return Math.random() > 0.1;
    }

    // Generate blockchain proof
    generateBlockchainProof(auditLog: AuditLog): string {
        const proofData = {
            logId: auditLog.id,
            hash: auditLog.hash,
            timestamp: auditLog.timestamp,
            blockchainTxId: auditLog.blockchainTxId
        };

        return crypto.createHash('sha256')
            .update(JSON.stringify(proofData))
            .digest('hex');
    }

    // Validate audit log integrity
    validateAuditLogIntegrity(auditLog: AuditLog): boolean {
        try {
            const expectedHash = this.generateActionHash({
                id: auditLog.id,
                userId: auditLog.userId,
                actionType: auditLog.actionType,
                actionData: auditLog.actionData,
                timestamp: auditLog.timestamp
            });

            return expectedHash === auditLog.hash;
        } catch (error) {
            console.error('Validate audit log integrity error:', error);
            return false;
        }
    }

    // Get audit log summary
    getAuditLogSummary(): {
        totalActions: number;
        verifiedActions: number;
        pendingActions: number;
        failedActions: number;
        successRate: number;
        averageResponseTime: number;
    } {
        const logs = Array.from(this.auditLogs.values());
        const verified = logs.filter(log => log.verified).length;
        const pending = logs.filter(log => log.status === 'pending').length;
        const failed = logs.filter(log => log.status === 'failed').length;

        return {
            totalActions: logs.length,
            verifiedActions: verified,
            pendingActions: pending,
            failedActions: failed,
            successRate: logs.length > 0 ? (verified / logs.length) * 100 : 0,
            averageResponseTime: 150 // Mock average response time in ms
        };
    }
}

export default RobotAudit;
