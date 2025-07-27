const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { serverStartup } = require('./scripts/start-server');
const { LoggingUtils } = require('./utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const ordersRoutes = require('./backend/routes/orders');
const walletRoutes = require('./backend/routes/wallet');
const productsRoutes = require('./backend/routes/products');
const servicesRoutes = require('./backend/routes/services');
const robotLogsRoutes = require('./backend/routes/robot-logs');
const authRoutes = require('./backend/routes/auth');
const userRoutes = require('./backend/routes/user');

// Import Blockchain routes
const robotMemoryRoutes = require('./routes/blockchain/robot-memory');
const validatorStatusRoutes = require('./routes/blockchain/validator-status');

// Import Blockchain utilities
const RobotBlockchain = require('./utils/robotBlockchain');
const RobotAudit = require('./utils/robotAudit');
const RobotPermission = require('./utils/robotPermission');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true
}));

// Compression middleware
app.use(compression());

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/orders', ordersRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/robot-logs', robotLogsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Blockchain Routes
app.use('/api/blockchain/robot-memory', robotMemoryRoutes);
app.use('/api/blockchain/validator-status', validatorStatusRoutes);

// Phase 6 - Multi-Agent System Routes
const robotBridgeRoutes = require('./routes/robot-bridge');
app.use('/api/robot-bridge', robotBridgeRoutes);

// Phase 7 - Role-Based AI Agents Routes
app.get('/seller-bot', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/robots/SellerBot.tsx'));
});

app.get('/franchise-bot', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/robots/FranchiseBot.tsx'));
});

app.get('/admin-bot', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/robots/AdminBot.tsx'));
});

// Phase 4 - AI Smart Learning & Personalization Routes
const robotFeedbackRoutes = require('./routes/robot-feedback');
const robotRemindersRoutes = require('./routes/robot-reminders');

app.use('/api/robot-feedback', robotFeedbackRoutes);
app.use('/api/robot-reminders', robotRemindersRoutes);

// Phase 3 - Task Scheduler Routes
const taskRoutes = require('./routes/task');
app.use('/api/tasks', taskRoutes);

// Phase 9 - Personal AI Brain Routes
const brainRoutes = require('./routes/brain');
app.use('/api/brain', brainRoutes);

// Phase 10 - DAO Voting Routes
const daoVoteRoutes = require('./routes/dao/vote');
app.use('/api/dao/vote', daoVoteRoutes);

// Phase 21 - AI-Based Service Matching Routes
const aiMatchRoutes = require('./routes/ai/match-products');
app.use('/api/ai/match-products', aiMatchRoutes);

// Phase 22 - Order Management Routes
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

// Phase 4 - Smart Learning Components
app.get('/robot-suggestions', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/components/EhbRobot/RobotSuggestions.tsx'));
});

app.get('/robot-reminder-form', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/components/EhbRobot/RobotReminderForm.tsx'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// EHB Robot page
app.get('/ehb-robot', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/ehb-robot.html'));
});

// Validator Activity Log page
app.get('/ehb-validator/robot-log', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/ehb-validator/robot-log.tsx'));
});

// Phase 6 - Multi-Agent System pages
app.get('/multi-agent', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/robot/MultiAgentEngine.tsx'));
});

app.get('/mobile-launcher', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/robot/RobotMobileLauncher.tsx'));
});

// PWA Manifest
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifest/manifest.json'));
});

// Test pages
app.get('/test-robot', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-robot.html'));
});

app.get('/test-robot-phase2', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-robot-phase2.html'));
});

app.get('/test-robot-phase3', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-robot-phase3.html'));
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Start server
const server = app.listen(PORT, async () => {
    try {
        console.log('🚀 EHB-Agent Platform starting...');
        console.log('===============================================');
        console.log(`🌐 Main App: http://localhost:${PORT}`);
        console.log(`🤖 EHB Robot: http://localhost:${PORT}/ehb-robot`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
        console.log('===============================================');

        // Initialize server systems
        await serverStartup.initialize();

        console.log('✅ EHB-Agent Platform is ready!');
        console.log('🤖 EHB Robot system is active');

        // Log successful startup
        LoggingUtils.logSystemEvent('application_started', {
            port: PORT,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        LoggingUtils.logError(error, { context: 'server_startup' });
        process.exit(1);
    }
});

// Handle server shutdown
process.on('SIGTERM', async () => {
    console.log('📡 Received SIGTERM signal');
    await serverStartup.shutdown();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('📡 Received SIGINT signal');
    await serverStartup.shutdown();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
