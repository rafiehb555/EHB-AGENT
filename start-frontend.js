#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting EHB AI Robot Frontend...\n');

// Check if frontend directory exists
const frontendPath = path.join(__dirname, 'frontend');
if (!fs.existsSync(frontendPath)) {
  console.error('❌ Frontend directory not found!');
  console.log('Please run this script from the project root directory.');
  process.exit(1);
}

// Check if package.json exists in frontend
const packageJsonPath = path.join(frontendPath, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Frontend package.json not found!');
  console.log('Please ensure the frontend is properly set up.');
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(frontendPath, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing frontend dependencies...');

  const install = spawn('npm', ['install'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true
  });

  install.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Frontend dependencies installed successfully!');
      startFrontend();
    } else {
      console.error('❌ Failed to install frontend dependencies');
      process.exit(1);
    }
  });
} else {
  startFrontend();
}

function startFrontend() {
  console.log('🎨 Starting React development server...');
  console.log('📱 Frontend will be available at: http://localhost:3000');
  console.log('🔗 Backend API: http://localhost:5000');
  console.log('\n💡 Make sure the backend is running with: npm run dev');
  console.log('🔄 Press Ctrl+C to stop the server\n');

  const frontend = spawn('npm', ['start'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true
  });

  frontend.on('close', (code) => {
    console.log(`\n🛑 Frontend server stopped with code ${code}`);
    process.exit(code);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping frontend server...');
    frontend.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping frontend server...');
    frontend.kill('SIGTERM');
  });
}
