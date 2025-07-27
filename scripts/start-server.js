const { databaseManager } = require('../database/mongodb');
const { LoggingUtils } = require('../utils/logger');
const config = require('../config/environment');
const { seedAll } = require('./seed-data');

// Server startup class
class ServerStartup {
    constructor() {
        this.isInitialized = false;
        this.startTime = null;
    }

    // Initialize database
    async initializeDatabase() {
        try {
            console.log('🔌 Initializing database connection...');

            await databaseManager.connect();

            // Create indexes
            await databaseManager.createIndexes();

            console.log('✅ Database initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            LoggingUtils.logError(error, { context: 'database_initialization' });
            throw error;
        }
    }

    // Seed initial data if needed
    async seedInitialData() {
        try {
            if (config.development.autoSeedData) {
                console.log('🌱 Seeding initial data...');
                await seedAll();
                console.log('✅ Initial data seeded successfully');
            } else {
                console.log('⏭️ Skipping data seeding (disabled in config)');
            }
        } catch (error) {
            console.error('❌ Data seeding failed:', error);
            LoggingUtils.logError(error, { context: 'data_seeding' });
            // Don't throw error for seeding failures
        }
    }

    // Initialize logging
    initializeLogging() {
        try {
            console.log('📝 Initializing logging system...');

            // Log startup event
            LoggingUtils.logSystemEvent('server_startup', {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: config.server.nodeEnv
            });

            console.log('✅ Logging system initialized');
            return true;
        } catch (error) {
            console.error('❌ Logging initialization failed:', error);
            return false;
        }
    }

    // Health check
    async performHealthCheck() {
        try {
            console.log('🏥 Performing health check...');

            const dbHealth = await databaseManager.healthCheck();

            if (dbHealth.status === 'healthy') {
                console.log('✅ Health check passed');
                return true;
            } else {
                console.error('❌ Health check failed:', dbHealth);
                return false;
            }
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return false;
        }
    }

    // Initialize all systems
    async initialize() {
        try {
            this.startTime = new Date();
            console.log('🚀 Starting EHB Agent Server...');
            console.log('===============================================');

            // Initialize logging first
            this.initializeLogging();

            // Initialize database
            await this.initializeDatabase();

            // Perform health check
            const healthCheckPassed = await this.performHealthCheck();
            if (!healthCheckPassed) {
                throw new Error('Health check failed');
            }

            // Seed initial data
            await this.seedInitialData();

            this.isInitialized = true;

            const startupTime = Date.now() - this.startTime.getTime();
            console.log('===============================================');
            console.log('✅ Server initialization completed successfully');
            console.log(`⏱️ Startup time: ${startupTime}ms`);
            console.log('🎯 Server is ready to handle requests');
            console.log('===============================================');

            // Log successful startup
            LoggingUtils.logSystemEvent('server_initialized', {
                startupTime: `${startupTime}ms`,
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('❌ Server initialization failed:', error);
            LoggingUtils.logError(error, { context: 'server_initialization' });
            throw error;
        }
    }

    // Graceful shutdown
    async shutdown() {
        try {
            console.log('🛑 Shutting down server gracefully...');

            // Disconnect from database
            await databaseManager.disconnect();

            // Log shutdown event
            LoggingUtils.logSystemEvent('server_shutdown', {
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });

            console.log('✅ Server shutdown completed');
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            LoggingUtils.logError(error, { context: 'server_shutdown' });
        }
    }

    // Get server status
    getStatus() {
        return {
            initialized: this.isInitialized,
            startTime: this.startTime,
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
            environment: config.server.nodeEnv,
            version: '1.0.0'
        };
    }
}

// Create server startup instance
const serverStartup = new ServerStartup();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📡 Received SIGTERM signal');
    await serverStartup.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📡 Received SIGINT signal');
    await serverStartup.shutdown();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    LoggingUtils.logError(error, { context: 'uncaught_exception' });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    LoggingUtils.logError(new Error(reason), { context: 'unhandled_rejection' });
    process.exit(1);
});

// Export for use in other modules
module.exports = {
    ServerStartup,
    serverStartup,
    initialize: () => serverStartup.initialize(),
    shutdown: () => serverStartup.shutdown(),
    getStatus: () => serverStartup.getStatus()
};
