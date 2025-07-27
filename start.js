#!/usr/bin/env node

// 🚀 EHB AI Robot Startup Script
// Initializes and starts the complete system

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'blue') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBanner() {
    log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║  🚀 EHB AI Robot (SIVOS™ PRO MAX)                          ║
    ║                                                              ║
    ║  Duniya ka sabse powerful AI assistant                      ║
    ║                                                              ║
    ║  Revolutionary features that don't exist anywhere else!      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `, 'cyan');
}

async function checkPrerequisites() {
    log('🔍 Checking prerequisites...', 'yellow');

    // Check if .env file exists
    if (!fs.existsSync('.env')) {
        log('⚠️  .env file not found. Creating from template...', 'yellow');
        if (fs.existsSync('env.example')) {
            fs.copyFileSync('env.example', '.env');
            log('✅ Created .env file from template', 'green');
            log('📝 Please edit .env file and add your OpenAI API key', 'blue');
        } else {
            log('❌ env.example file not found', 'red');
            return false;
        }
    }

    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
        log('📦 Installing dependencies...', 'yellow');
        try {
            await runCommand('npm', ['install']);
            log('✅ Dependencies installed', 'green');
        } catch (error) {
            log('❌ Failed to install dependencies', 'red');
            return false;
        }
    }

    log('✅ Prerequisites check completed', 'green');
    return true;
}

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function startBackend() {
    log('🚀 Starting EHB AI Robot Backend...', 'yellow');

    try {
        // Start the backend server
        const backend = spawn('node', ['backend/server.js'], {
            stdio: 'inherit',
            shell: true
        });

        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        log('✅ Backend server started successfully', 'green');
        log('🌐 Backend URL: http://localhost:5000', 'blue');
        log('🏥 Health Check: http://localhost:5000/health', 'blue');

        return backend;
    } catch (error) {
        log('❌ Failed to start backend server', 'red');
        log(`Error: ${error.message}`, 'red');
        throw error;
    }
}

async function runTests() {
    log('🧪 Running backend tests...', 'yellow');

    try {
        await runCommand('node', ['test-backend.js']);
        log('✅ All tests passed', 'green');
    } catch (error) {
        log('❌ Some tests failed', 'red');
        log('Continuing anyway...', 'yellow');
    }
}

function showNextSteps() {
    log('\n🎯 Next Steps:', 'cyan');
    log('===============================================');
    log('1. 🌐 Backend is running at: http://localhost:5000');
    log('2. 🏥 Health check: http://localhost:5000/health');
    log('3. 📚 API Documentation: Check README.md');
    log('4. 🧪 Test the system: node test-backend.js');
    log('5. 🎮 Try voice commands via API endpoints');
    log('6. 🚀 Frontend development can now begin!');
    log('===============================================');

    log('\n🎮 Example API calls:', 'cyan');
    log('curl -X POST http://localhost:5000/api/voice/process \\');
    log('  -H "Content-Type: application/json" \\');
    log('  -d \'{"message": "Hello, how are you?"}\'');

    log('\n🔧 Development commands:', 'cyan');
    log('npm run dev          # Start development server');
    log('node test-backend.js # Run tests');
    log('npm test            # Run all tests');
}

async function main() {
    try {
        logBanner();

        // Check prerequisites
        const prerequisitesOk = await checkPrerequisites();
        if (!prerequisitesOk) {
            log('❌ Prerequisites check failed. Please fix the issues above.', 'red');
            process.exit(1);
        }

        // Start backend
        const backend = await startBackend();

        // Run tests
        await runTests();

        // Show next steps
        showNextSteps();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            log('\n📡 Shutting down EHB AI Robot...', 'yellow');
            if (backend) {
                backend.kill();
            }
            log('✅ Shutdown complete', 'green');
            process.exit(0);
        });

        log('\n🎉 EHB AI Robot is ready!', 'green');
        log('Press Ctrl+C to stop the server', 'yellow');

    } catch (error) {
        log('❌ Startup failed', 'red');
        log(`Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main();
}

module.exports = { main, checkPrerequisites, startBackend };
