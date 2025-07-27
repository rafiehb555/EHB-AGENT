// EHB Agent Environment Configuration

module.exports = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
        host: process.env.HOST || 'localhost'
    },

    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ehb-agent',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'ehb-agent-secret-key-2024-super-secure',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: '7d'
    },

    // Security Configuration
    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4000']
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs/ehb-agent.log',
        maxSize: '20m',
        maxFiles: '14d'
    },

    // EHB Robot Configuration
    robot: {
        enabled: process.env.ROBOT_ENABLED === 'true' || true,
        defaultMode: process.env.ROBOT_DEFAULT_MODE || 'robot',
        voiceEnabled: process.env.ROBOT_VOICE_ENABLED === 'true' || true,
        languageDetection: process.env.ROBOT_LANGUAGE_DETECTION === 'true' || true,
        maxMessageLength: 1000,
        sessionTimeout: 30 * 60 * 1000 // 30 minutes
    },

    // Wallet Configuration
    wallet: {
        currency: process.env.WALLET_CURRENCY || 'EHBGC',
        defaultBalance: parseFloat(process.env.WALLET_DEFAULT_BALANCE) || 100,
        minLockAmount: parseFloat(process.env.WALLET_MIN_LOCK_AMOUNT) || 10,
        maxTransactionAmount: 10000,
        lockDurationHours: 24
    },

    // Order Configuration
    orders: {
        defaultStatus: process.env.ORDER_DEFAULT_STATUS || 'pending',
        maxItems: parseInt(process.env.ORDER_MAX_ITEMS) || 50,
        deliveryBufferHours: parseInt(process.env.ORDER_DELIVERY_BUFFER_HOURS) || 2,
        maxDeliveryDistance: 50, // km
        cancellationWindowHours: 1
    },

    // Service Configuration
    services: {
        bookingBufferHours: parseInt(process.env.SERVICE_BOOKING_BUFFER_HOURS) || 2,
        maxBookingsPerDay: parseInt(process.env.SERVICE_MAX_BOOKINGS_PER_DAY) || 5,
        maxBookingDuration: 4, // hours
        cancellationWindowHours: 2
    },

    // Product Configuration
    products: {
        defaultCurrency: process.env.PRODUCT_DEFAULT_CURRENCY || 'EHBGC',
        maxSearchResults: parseInt(process.env.PRODUCT_MAX_SEARCH_RESULTS) || 50,
        minStockAlert: 5,
        maxPrice: 10000
    },

    // API Configuration
    api: {
        version: process.env.API_VERSION || 'v1',
        rateLimitEnabled: process.env.API_RATE_LIMIT_ENABLED === 'true' || true,
        documentationEnabled: process.env.API_DOCUMENTATION_ENABLED === 'true' || true,
        maxRequestSize: '10mb'
    },

    // Development Tools
    development: {
        debugMode: process.env.DEBUG_MODE === 'true' || true,
        hotReload: process.env.HOT_RELOAD === 'true' || true,
        autoSeedData: process.env.AUTO_SEED_DATA === 'true' || true,
        mockDataEnabled: true
    },

    // External Services (for future integration)
    externalServices: {
        paymentGateway: {
            url: process.env.PAYMENT_GATEWAY_URL || '',
            apiKey: process.env.PAYMENT_GATEWAY_API_KEY || '',
            secretKey: process.env.PAYMENT_GATEWAY_SECRET_KEY || ''
        },
        emailService: {
            url: process.env.EMAIL_SERVICE_URL || '',
            apiKey: process.env.EMAIL_SERVICE_API_KEY || ''
        },
        smsService: {
            url: process.env.SMS_SERVICE_URL || '',
            apiKey: process.env.SMS_SERVICE_API_KEY || ''
        },
        pushNotification: {
            url: process.env.PUSH_NOTIFICATION_URL || '',
            apiKey: process.env.PUSH_NOTIFICATION_API_KEY || ''
        }
    },

    // Monitoring and Analytics
    monitoring: {
        analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true' || true,
        performanceMonitoring: process.env.PERFORMANCE_MONITORING === 'true' || true,
        errorTracking: process.env.ERROR_TRACKING === 'true' || true,
        healthCheckInterval: 5 * 60 * 1000 // 5 minutes
    },

    // File Upload Configuration
    fileUpload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
        allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf'
        ],
        uploadPath: './uploads/',
        tempPath: './temp/'
    },

    // Cache Configuration
    cache: {
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: parseInt(process.env.CACHE_TTL) || 3600,
        maxMemory: '100mb'
    },

    // WebSocket Configuration
    websocket: {
        port: parseInt(process.env.WS_PORT) || 3001,
        heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
        maxConnections: 1000
    },

    // Backup Configuration
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true' || true,
        intervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24,
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
        backupPath: './backups/'
    },

    // Feature Flags
    features: {
        voiceRecognition: true,
        languageDetection: true,
        realTimeChat: true,
        orderTracking: true,
        serviceBooking: true,
        walletIntegration: true,
        analytics: true,
        notifications: true,
        fileUpload: true,
        backup: true
    }
};
