const AutoGitHubPusher = require('../auto-github-push.js');
const fs = require('fs');
const path = require('path');

class GitHubIntegrationAgent {
    constructor() {
        this.autoPusher = new AutoGitHubPusher();
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }

    // Initialize GitHub integration
    async initialize() {
        try {
            console.log('🔧 Initializing GitHub Integration Agent...');
            
            // Initialize repository
            this.autoPusher.pusher.initializeRepository();
            
            // Check current status
            const status = this.autoPusher.pusher.checkStatus();
            
            console.log('✅ GitHub Integration Agent initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing GitHub Integration Agent:', error.message);
            return false;
        }
    }

    // Start auto monitoring
    startAutoMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Auto monitoring is already running');
            return;
        }

        console.log('🚀 Starting GitHub auto monitoring...');
        this.isMonitoring = true;
        
        // Start auto push monitoring
        this.autoPusher.startAutoPush();
        
        console.log('✅ GitHub auto monitoring started');
    }

    // Stop auto monitoring
    stopAutoMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️ Auto monitoring is not running');
            return;
        }

        console.log('🛑 Stopping GitHub auto monitoring...');
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('✅ GitHub auto monitoring stopped');
    }

    // Manual push with custom message
    async manualPush(message = null) {
        try {
            console.log('🔄 Performing manual GitHub push...');
            
            const success = await this.autoPusher.manualPush(message);
            
            if (success) {
                console.log('✅ Manual push completed successfully');
                this.logActivity('manual_push', { success: true, message });
            } else {
                console.log('❌ Manual push failed');
                this.logActivity('manual_push', { success: false, message });
            }
            
            return success;
        } catch (error) {
            console.error('❌ Error during manual push:', error.message);
            this.logActivity('manual_push', { success: false, error: error.message });
            return false;
        }
    }

    // Get push statistics
    getStatistics() {
        try {
            const stats = this.autoPusher.getPushStats();
            
            console.log('📊 GitHub Push Statistics:');
            console.log(`Total pushes: ${stats.totalPushes}`);
            console.log(`Last push: ${stats.lastPush || 'Never'}`);
            console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
            
            return stats;
        } catch (error) {
            console.error('❌ Error getting statistics:', error.message);
            return null;
        }
    }

    // Check repository status
    checkRepositoryStatus() {
        try {
            console.log('📊 Checking repository status...');
            
            const status = this.autoPusher.pusher.checkStatus();
            const hasChanges = this.autoPusher.hasChanges();
            const changedFiles = this.autoPusher.getChangedFiles();
            
            const statusInfo = {
                hasChanges,
                changedFilesCount: changedFiles.length,
                changedFiles: changedFiles.slice(0, 10), // Show first 10 files
                status: status
            };
            
            console.log('Repository Status:', statusInfo);
            return statusInfo;
        } catch (error) {
            console.error('❌ Error checking repository status:', error.message);
            return null;
        }
    }

    // Log activity
    logActivity(action, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            data,
            agent: 'GitHubIntegrationAgent'
        };

        const logFile = path.join(__dirname, 'logs', 'github-agent.log');
        const logDir = path.dirname(logFile);
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Append to log file
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }

    // Get agent status
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            lastActivity: new Date().toISOString(),
            agentName: 'GitHubIntegrationAgent',
            features: [
                'Auto push monitoring',
                'Manual push',
                'Statistics tracking',
                'Repository status checking'
            ]
        };
    }

    // Emergency push (for critical updates)
    async emergencyPush(criticalMessage = '🚨 CRITICAL UPDATE') {
        try {
            console.log('🚨 Performing emergency GitHub push...');
            
            const message = `${criticalMessage}\n\n🚨 Emergency update at ${new Date().toLocaleString()}`;
            const success = await this.autoPusher.pushAll(message);
            
            if (success) {
                console.log('✅ Emergency push completed successfully');
                this.logActivity('emergency_push', { success: true, message });
            } else {
                console.log('❌ Emergency push failed');
                this.logActivity('emergency_push', { success: false, message });
            }
            
            return success;
        } catch (error) {
            console.error('❌ Error during emergency push:', error.message);
            this.logActivity('emergency_push', { success: false, error: error.message });
            return false;
        }
    }

    // Health check
    async healthCheck() {
        try {
            console.log('🏥 Performing GitHub Integration Agent health check...');
            
            const status = this.getStatus();
            const repoStatus = this.checkRepositoryStatus();
            const stats = this.getStatistics();
            
            const healthReport = {
                agentStatus: status,
                repositoryStatus: repoStatus,
                statistics: stats,
                timestamp: new Date().toISOString(),
                health: 'healthy'
            };
            
            console.log('✅ Health check completed');
            return healthReport;
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            return {
                health: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export for use in other modules
module.exports = GitHubIntegrationAgent;

// If run directly
if (require.main === module) {
    const agent = new GitHubIntegrationAgent();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--init')) {
        // Initialize agent
        agent.initialize();
    } else if (args.includes('--start')) {
        // Start auto monitoring
        agent.initialize().then(() => {
            agent.startAutoMonitoring();
        });
    } else if (args.includes('--stop')) {
        // Stop auto monitoring
        agent.stopAutoMonitoring();
    } else if (args.includes('--push')) {
        // Manual push
        const message = args.find(arg => arg.startsWith('--message='))?.split('=')[1];
        agent.initialize().then(() => {
            agent.manualPush(message);
        });
    } else if (args.includes('--stats')) {
        // Show statistics
        agent.getStatistics();
    } else if (args.includes('--status')) {
        // Check status
        agent.checkRepositoryStatus();
    } else if (args.includes('--health')) {
        // Health check
        agent.healthCheck();
    } else if (args.includes('--emergency')) {
        // Emergency push
        const message = args.find(arg => arg.startsWith('--message='))?.split('=')[1];
        agent.initialize().then(() => {
            agent.emergencyPush(message);
        });
    } else {
        // Default: initialize and show status
        agent.initialize().then(() => {
            console.log('GitHub Integration Agent Status:', agent.getStatus());
        });
    }
} 