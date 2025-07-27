#!/usr/bin/env node

const EHBDevAgent = require('./ehb-dev-agent/index.js');

console.log('🚀 Starting EHB Dev Agent...');
console.log('===============================================');

// Create and start the EHB Dev Agent
const devAgent = new EHBDevAgent();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down EHB Dev Agent...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down EHB Dev Agent...');
    process.exit(0);
});

// Start the agent
devAgent.start();

console.log('✅ EHB Dev Agent startup script ready!');
console.log('🎯 Run this script to start the Dev Agent: node start-ehb-dev-agent.js');
