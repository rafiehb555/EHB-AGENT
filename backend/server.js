const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'EHB AI Robot Backend',
        version: '1.0.0'
    });
});

// Import task scheduler and action engine
const taskScheduler = require('./services/taskScheduler');
const actionEngine = require('./services/actionEngine');

// API Routes
app.use('/api/voice', require('./routes/voice'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/actions', require('./routes/actions'));
app.use('/api/wake-word', require('./routes/wakeWord'));
app.use('/api/whisper', require('./routes/whisper'));
app.use('/api/files', require('./routes/files'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/franchise', require('./routes/franchise'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/scheduler', require('./routes/scheduler'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

// Start server
app.listen(PORT, async () => {
    console.log('🚀 EHB AI Robot Backend Starting...');
    console.log('===============================================');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('===============================================');

    // Start task scheduler and action engine
    try {
        await taskScheduler.start();
        console.log('✅ Task Scheduler started successfully');

        await actionEngine.start();
        console.log('✅ Action Engine started successfully');
    } catch (error) {
        console.error('❌ Failed to start services:', error);
    }

    console.log('✅ EHB AI Robot Backend is ready!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📡 Received SIGTERM signal');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📡 Received SIGINT signal');
    process.exit(0);
});

module.exports = app;
