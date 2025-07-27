const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/environment');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }

        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;

        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }

        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'ehb-agent' },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        }),

        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        }),

        // Robot specific log file
        new winston.transports.File({
            filename: path.join(logsDir, 'robot.log'),
            level: 'info',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),

        // API requests log file
        new winston.transports.File({
            filename: path.join(logsDir, 'api.log'),
            level: 'info',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

// Add console transport for development
if (config.server.nodeEnv === 'development') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Create specialized loggers
const robotLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'ehb-robot' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'robot.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

const apiLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'ehb-api' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'api.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

const databaseLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'ehb-database' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'database.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

// Logging utility functions
class LoggingUtils {
    // Log robot activity
    static logRobotActivity(action, data = {}, userId = null) {
        robotLogger.info('Robot Activity', {
            action,
            data,
            userId,
            timestamp: new Date().toISOString()
        });
    }

    // Log API request
    static logApiRequest(method, url, statusCode, responseTime, userId = null) {
        apiLogger.info('API Request', {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            userId,
            timestamp: new Date().toISOString()
        });
    }

    // Log API error
    static logApiError(method, url, error, userId = null) {
        apiLogger.error('API Error', {
            method,
            url,
            error: error.message,
            stack: error.stack,
            userId,
            timestamp: new Date().toISOString()
        });
    }

    // Log database operation
    static logDatabaseOperation(operation, collection, duration, success = true, error = null) {
        databaseLogger.info('Database Operation', {
            operation,
            collection,
            duration: `${duration}ms`,
            success,
            error: error?.message,
            timestamp: new Date().toISOString()
        });
    }

    // Log user action
    static logUserAction(userId, action, data = {}) {
        logger.info('User Action', {
            userId,
            action,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Log system event
    static logSystemEvent(event, data = {}) {
        logger.info('System Event', {
            event,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Log security event
    static logSecurityEvent(event, data = {}) {
        logger.warn('Security Event', {
            event,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Log performance metric
    static logPerformanceMetric(metric, value, unit = 'ms') {
        logger.info('Performance Metric', {
            metric,
            value,
            unit,
            timestamp: new Date().toISOString()
        });
    }

    // Log error with context
    static logError(error, context = {}) {
        logger.error('Application Error', {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    }

    // Log warning
    static logWarning(message, data = {}) {
        logger.warn('Warning', {
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Log info
    static logInfo(message, data = {}) {
        logger.info('Info', {
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Log debug
    static logDebug(message, data = {}) {
        logger.debug('Debug', {
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Get log statistics
    static async getLogStats() {
        try {
            const logFiles = [
                'error.log',
                'combined.log',
                'robot.log',
                'api.log',
                'database.log'
            ];

            const stats = {};

            for (const file of logFiles) {
                const filePath = path.join(logsDir, file);
                if (fs.existsSync(filePath)) {
                    const fileStats = fs.statSync(filePath);
                    stats[file] = {
                        size: fileStats.size,
                        modified: fileStats.mtime,
                        exists: true
                    };
                } else {
                    stats[file] = {
                        exists: false
                    };
                }
            }

            return stats;
        } catch (error) {
            logger.error('Error getting log stats:', error);
            return {};
        }
    }

    // Clean old log files
    static async cleanOldLogs(retentionDays = 30) {
        try {
            const files = fs.readdirSync(logsDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            let deletedCount = 0;

            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(logsDir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        logger.info(`Deleted old log file: ${file}`);
                    }
                }
            }

            logger.info(`Cleaned ${deletedCount} old log files`);
            return deletedCount;
        } catch (error) {
            logger.error('Error cleaning old logs:', error);
            return 0;
        }
    }
}

// Export logger and utilities
module.exports = {
    logger,
    robotLogger,
    apiLogger,
    databaseLogger,
    LoggingUtils
};
