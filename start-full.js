#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting EHB AI Robot (SIVOS™ PRO MAX) - Full Stack\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  log('❌ package.json not found!', 'red');
  log('Please run this script from the project root directory.', 'yellow');
  process.exit(1);
}

// Check backend directory
const backendPath = path.join(__dirname, 'backend');
if (!fs.existsSync(backendPath)) {
  log('❌ Backend directory not found!', 'red');
  log('Please ensure the backend is properly set up.', 'yellow');
  process.exit(1);
}

// Check frontend directory
const frontendPath = path.join(__dirname, 'frontend');
if (!fs.existsSync(frontendPath)) {
  log('❌ Frontend directory not found!', 'red');
  log('Please ensure the frontend is properly set up.', 'yellow');
  process.exit(1);
}

// Check environment file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  log('⚠️  .env file not found!', 'yellow');
  log('Please create a .env file with your OpenAI API key.', 'cyan');
  log('Example:', 'cyan');
  log('OPENAI_API_KEY=your_openai_api_key_here', 'cyan');
  log('PORT=5000', 'cyan');
  log('MONGODB_URI=your_mongodb_uri_here', 'cyan');
}

async function installDependencies() {
  return new Promise((resolve, reject) => {
    log('📦 Installing backend dependencies...', 'blue');

    const backendInstall = spawn('npm', ['install'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    backendInstall.on('close', (code) => {
      if (code === 0) {
        log('✅ Backend dependencies installed!', 'green');

        log('📦 Installing frontend dependencies...', 'blue');
        const frontendInstall = spawn('npm', ['install'], {
          cwd: frontendPath,
          stdio: 'inherit',
          shell: true
        });

        frontendInstall.on('close', (frontendCode) => {
          if (frontendCode === 0) {
            log('✅ Frontend dependencies installed!', 'green');
            resolve();
          } else {
            log('❌ Failed to install frontend dependencies', 'red');
            reject(new Error('Frontend install failed'));
          }
        });
      } else {
        log('❌ Failed to install backend dependencies', 'red');
        reject(new Error('Backend install failed'));
      }
    });
  });
}

function startBackend() {
  log('🔧 Starting backend server...', 'blue');
  log('🌐 Backend will be available at: http://localhost:5000', 'cyan');

  const backend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true
  });

  backend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('🚀 AI Robot Backend running')) {
      log('✅ Backend server started successfully!', 'green');
    }
    process.stdout.write(`${colors.blue}[BACKEND]${colors.reset} ${output}`);
  });

  backend.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[BACKEND ERROR]${colors.reset} ${data}`);
  });

  return backend;
}

function startFrontend() {
  log('🎨 Starting frontend development server...', 'blue');
  log('📱 Frontend will be available at: http://localhost:3000', 'cyan');

  const frontend = spawn('npm', ['start'], {
    cwd: frontendPath,
    stdio: 'pipe',
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:')) {
      log('✅ Frontend server started successfully!', 'green');
    }
    process.stdout.write(`${colors.magenta}[FRONTEND]${colors.reset} ${output}`);
  });

  frontend.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[FRONTEND ERROR]${colors.reset} ${data}`);
  });

  return frontend;
}

async function main() {
  try {
    // Check if node_modules exist
    const backendNodeModules = path.join(__dirname, 'node_modules');
    const frontendNodeModules = path.join(frontendPath, 'node_modules');

    if (!fs.existsSync(backendNodeModules) || !fs.existsSync(frontendNodeModules)) {
      log('📦 Installing dependencies...', 'yellow');
      await installDependencies();
    }

    log('🚀 Starting EHB AI Robot (SIVOS™ PRO MAX)...', 'green');
    log('', 'reset');
    log('🎯 Features:', 'bright');
    log('   🧠 Telepathy Mode - Understand unspoken intent', 'cyan');
    log('   🔗 Cross-Service Commands - Multi-platform actions', 'cyan');
    log('   🔒 Voice Vault - Secure voice-locked storage', 'cyan');
    log('   🧬 Personality Builder - Customize robot behavior', 'cyan');
    log('   💻 Developer Mode - Voice commands for coding', 'cyan');
    log('   🤝 Collaboration - Work with other users', 'cyan');
    log('   ⚖️  Legal Assistant - AI document generation', 'cyan');
    log('   🏛️  Franchise Court - AI-governed system', 'cyan');
    log('', 'reset');

    // Start backend first
    const backend = startBackend();

    // Wait a bit for backend to start
    setTimeout(() => {
      const frontend = startFrontend();

      // Handle graceful shutdown
      const shutdown = (signal) => {
        log(`\n🛑 Received ${signal}, shutting down gracefully...`, 'yellow');
        backend.kill('SIGINT');
        frontend.kill('SIGINT');

        setTimeout(() => {
          log('✅ EHB AI Robot stopped successfully!', 'green');
          process.exit(0);
        }, 2000);
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));

      // Handle process errors
      backend.on('error', (error) => {
        log(`❌ Backend error: ${error.message}`, 'red');
      });

      frontend.on('error', (error) => {
        log(`❌ Frontend error: ${error.message}`, 'red');
      });

      backend.on('close', (code) => {
        log(`🛑 Backend stopped with code ${code}`, 'yellow');
      });

      frontend.on('close', (code) => {
        log(`🛑 Frontend stopped with code ${code}`, 'yellow');
      });

    }, 3000);

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the main function
main();
