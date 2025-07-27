const mongoose = require('mongoose');
const config = require('../config/environment');

// Database connection class
class DatabaseManager {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.connectionOptions = {
            ...config.database.options,
            bufferCommands: false,
            bufferMaxEntries: 0
        };
    }

    // Connect to MongoDB
    async connect() {
        try {
            console.log('🔌 Connecting to MongoDB...');

            this.connection = await mongoose.connect(config.database.uri, this.connectionOptions);
            this.isConnected = true;

            console.log('✅ MongoDB connection established');

            // Set up connection event handlers
            mongoose.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 MongoDB reconnected');
                this.isConnected = true;
            });

            return this.connection;
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    // Disconnect from MongoDB
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.disconnect();
                this.isConnected = false;
                console.log('✅ MongoDB disconnected');
            }
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    // Check database health
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return {
                    status: 'disconnected',
                    message: 'Database not connected'
                };
            }

            // Test connection with a simple query
            await mongoose.connection.db.admin().ping();

            return {
                status: 'healthy',
                message: 'Database connection is healthy',
                uptime: process.uptime(),
                collections: await this.getCollectionStats()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Database health check failed',
                error: error.message
            };
        }
    }

    // Get collection statistics
    async getCollectionStats() {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            const stats = {};

            for (const collection of collections) {
                const collectionName = collection.name;
                const count = await mongoose.connection.db.collection(collectionName).countDocuments();
                stats[collectionName] = {
                    documentCount: count,
                    size: await this.getCollectionSize(collectionName)
                };
            }

            return stats;
        } catch (error) {
            console.error('Error getting collection stats:', error);
            return {};
        }
    }

    // Get collection size
    async getCollectionSize(collectionName) {
        try {
            const stats = await mongoose.connection.db.collection(collectionName).stats();
            return stats.size || 0;
        } catch (error) {
            return 0;
        }
    }

    // Create indexes for all models
    async createIndexes() {
        try {
            console.log('📊 Creating database indexes...');

            // Get all registered models
            const modelNames = mongoose.modelNames();

            for (const modelName of modelNames) {
                const model = mongoose.model(modelName);
                if (model.createIndexes) {
                    await model.createIndexes();
                    console.log(`✅ Indexes created for ${modelName}`);
                }
            }

            console.log('✅ All indexes created successfully');
        } catch (error) {
            console.error('❌ Error creating indexes:', error);
            throw error;
        }
    }

    // Backup database
    async backup(backupPath = './backups/') {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = `${backupPath}ehb-agent-backup-${timestamp}.gz`;

            // Create backup directory if it doesn't exist
            const fs = require('fs');
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }

            // Extract database name from URI
            const dbName = config.database.uri.split('/').pop().split('?')[0];

            const command = `mongodump --uri="${config.database.uri}" --archive="${backupFile}" --gzip`;

            await execAsync(command);

            console.log(`✅ Database backup created: ${backupFile}`);
            return backupFile;
        } catch (error) {
            console.error('❌ Database backup failed:', error);
            throw error;
        }
    }

    // Restore database from backup
    async restore(backupFile) {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const command = `mongorestore --uri="${config.database.uri}" --archive="${backupFile}" --gzip`;

            await execAsync(command);

            console.log(`✅ Database restored from: ${backupFile}`);
        } catch (error) {
            console.error('❌ Database restore failed:', error);
            throw error;
        }
    }

    // Clean old backups
    async cleanOldBackups(backupPath = './backups/', retentionDays = 30) {
        try {
            const fs = require('fs');
            const path = require('path');

            if (!fs.existsSync(backupPath)) {
                return;
            }

            const files = fs.readdirSync(backupPath);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            let deletedCount = 0;

            for (const file of files) {
                if (file.endsWith('.gz')) {
                    const filePath = path.join(backupPath, file);
                    const stats = fs.statSync(filePath);

                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        console.log(`🗑️ Deleted old backup: ${file}`);
                    }
                }
            }

            console.log(`✅ Cleaned ${deletedCount} old backups`);
        } catch (error) {
            console.error('❌ Error cleaning old backups:', error);
        }
    }

    // Get database statistics
    async getDatabaseStats() {
        try {
            if (!this.isConnected) {
                return null;
            }

            const stats = await mongoose.connection.db.stats();
            const collections = await this.getCollectionStats();

            return {
                database: stats.db,
                collections: Object.keys(collections).length,
                dataSize: stats.dataSize,
                storageSize: stats.storageSize,
                indexes: stats.indexes,
                objects: stats.objects,
                avgObjSize: stats.avgObjSize,
                collections: collections
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return null;
        }
    }

    // Monitor database performance
    async monitorPerformance() {
        try {
            const stats = await this.getDatabaseStats();

            if (stats) {
                console.log('📊 Database Performance Stats:');
                console.log(`   Collections: ${stats.collections}`);
                console.log(`   Documents: ${stats.objects}`);
                console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Indexes: ${stats.indexes}`);
            }
        } catch (error) {
            console.error('Error monitoring database performance:', error);
        }
    }
}

// Create and export database manager instance
const databaseManager = new DatabaseManager();

// Export the manager and mongoose for convenience
module.exports = {
    DatabaseManager,
    databaseManager,
    mongoose,
    connect: () => databaseManager.connect(),
    disconnect: () => databaseManager.disconnect(),
    healthCheck: () => databaseManager.healthCheck(),
    createIndexes: () => databaseManager.createIndexes(),
    backup: (path) => databaseManager.backup(path),
    restore: (file) => databaseManager.restore(file),
    cleanOldBackups: (path, days) => databaseManager.cleanOldBackups(path, days),
    getDatabaseStats: () => databaseManager.getDatabaseStats(),
    monitorPerformance: () => databaseManager.monitorPerformance()
};
