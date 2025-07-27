const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'EHB-Agent Platform running on port 4000',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        system: 'healthy'
    });
});

// Main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Homepage route
app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

// EHB Play System Homepage route
app.get('/play', (req, res) => {
    res.sendFile(path.join(__dirname, 'ehb-play-homepage.html'));
});

// EHB Dev Agent route
app.get('/ehb-dev-agent', (req, res) => {
    res.sendFile(path.join(__dirname, 'ehb-dev-agent.html'));
});

// EHB Robot route
app.get('/ehb-robot', (req, res) => {
    res.sendFile(path.join(__dirname, 'ehb-robot.html'));
});

// Test Cards route
app.get('/test-cards', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-cards.html'));
});

// EHB Robot page
app.get('/ehb-robot', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/ehb-robot.html'));
});

// Agent routes
app.get('/backend-agent', (req, res) => {
    res.json({
        agent: 'Backend Agent',
        status: 'Active',
        features: ['API Development', 'Database Management', 'Server Optimization'],
        performance: '98%',
        apiCalls: '1,234/min'
    });
});

app.get('/frontend-agent', (req, res) => {
    res.json({
        agent: 'Frontend Agent',
        status: 'Active',
        features: ['UI Development', 'Responsive Design', 'User Experience'],
        performance: '95%',
        components: '156'
    });
});

app.get('/testing-agent', (req, res) => {
    res.json({
        agent: 'Testing Agent',
        status: 'Active',
        features: ['Unit Testing', 'Integration Testing', 'QA Automation'],
        performance: '99%',
        testsPassed: '1,567'
    });
});

app.get('/deployment-agent', (req, res) => {
    res.json({
        agent: 'Deployment Agent',
        status: 'Active',
        features: ['CI/CD Pipeline', 'Containerization', 'Cloud Deployment'],
        performance: '97%',
        deployments: '23'
    });
});

app.get('/security-agent', (req, res) => {
    res.json({
        agent: 'Security Agent',
        status: 'Active',
        features: ['Security Scanning', 'Vulnerability Assessment', 'Compliance Validation'],
        performance: '100%',
        vulnerabilities: '0'
    });
});

app.get('/health-agent', (req, res) => {
    res.json({
        agent: 'Health Agent',
        status: 'Active',
        features: ['HIPAA Compliance', 'Medical Data Processing', 'Healthcare Workflow'],
        performance: '96%',
        hipaaCompliant: 'Yes'
    });
});

// API stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        agents: {
            totalAgents: 7,
            activeAgents: 7,
            systemHealth: '100%',
            uptime: '99.9%',
            performance: '98%'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 EHB-Agent Platform starting...');
    console.log('===============================================');
    console.log(`🌐 Main App: http://localhost:${PORT}`);
    console.log(`🤖 EHB Robot: http://localhost:${PORT}/ehb-robot`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('===============================================');
    console.log('✅ EHB-Agent Platform is ready!');
    console.log('🤖 EHB Robot system is active');

    // Automatically open browser
    setTimeout(() => {
        const url = `http://localhost:${PORT}`;
        exec(`start ${url}`, (error) => {
            if (error) {
                console.log('❌ Could not open browser automatically:', error.message);
            } else {
                console.log('🌐 Browser opened automatically!');
            }
        });
    }, 1000);
});
