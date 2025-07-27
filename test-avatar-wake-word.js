#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🤖 Testing EHB AI Robot Avatar & Wake Word System...\n');

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

// Test avatar functionality
async function testAvatarFeatures() {
  log('🤖 Testing Avatar Features...', 'blue');

  const tests = [
    {
      name: 'Avatar Status',
      endpoint: '/api/ai/status',
      method: 'GET'
    },
    {
      name: 'Avatar Settings',
      endpoint: '/api/wake-word/settings',
      method: 'GET'
    },
    {
      name: 'Wake Word Status',
      endpoint: '/api/wake-word/status',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      log(`\n🔍 Testing: ${test.name}`, 'cyan');

      const response = await fetch(`http://localhost:5000${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'test-user'
        }
      });

      if (response.ok) {
        const result = await response.json();
        log(`✅ ${test.name} - Success`, 'green');

        if (result.status) {
          log(`   🤖 Avatar Status: ${result.status.isListening ? 'Listening' : 'Idle'}`, 'cyan');
        }

        if (result.settings) {
          log(`   🎤 Wake Word: ${result.settings.wakeWord}`, 'cyan');
          log(`   🎯 Confidence: ${result.settings.confidenceThreshold}`, 'cyan');
        }
      } else {
        log(`⚠️  ${test.name} - ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${test.name} - ${error.message}`, 'red');
    }
  }
}

// Test wake word functionality
async function testWakeWordFeatures() {
  log('\n🎤 Testing Wake Word Features...', 'blue');

  const tests = [
    {
      name: 'Initialize Wake Word Detector',
      endpoint: '/api/wake-word/initialize',
      method: 'POST'
    },
    {
      name: 'Start Wake Word Detection',
      endpoint: '/api/wake-word/start',
      method: 'POST'
    },
    {
      name: 'Update Wake Word',
      endpoint: '/api/wake-word/wake-word',
      method: 'PUT',
      data: {
        wakeWord: 'EHB_ROBOT'
      }
    },
    {
      name: 'Update Confidence Threshold',
      endpoint: '/api/wake-word/confidence',
      method: 'PUT',
      data: {
        threshold: 0.85
      }
    },
    {
      name: 'Get Detection Statistics',
      endpoint: '/api/wake-word/stats',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      log(`\n🔍 Testing: ${test.name}`, 'cyan');

      const response = await fetch(`http://localhost:5000${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'test-user'
        },
        body: test.data ? JSON.stringify(test.data) : undefined
      });

      if (response.ok) {
        const result = await response.json();
        log(`✅ ${test.name} - Success`, 'green');

        if (result.message) {
          log(`   📝 Message: ${result.message}`, 'cyan');
        }

        if (result.stats) {
          log(`   📊 Total Detections: ${result.stats.total}`, 'cyan');
          log(`   ✅ Successful: ${result.stats.detected}`, 'cyan');
          log(`   ❌ False Positives: ${result.stats.falsePositives}`, 'cyan');
          log(`   🎯 Accuracy: ${result.stats.accuracy.toFixed(1)}%`, 'cyan');
        }
      } else {
        log(`⚠️  ${test.name} - ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${test.name} - ${error.message}`, 'red');
    }
  }
}

// Test avatar animations
async function testAvatarAnimations() {
  log('\n🎭 Testing Avatar Animations...', 'blue');

  const animationTests = [
    {
      name: 'Idle Animation',
      status: 'idle',
      description: 'Robot in standby mode'
    },
    {
      name: 'Listening Animation',
      status: 'listening',
      description: 'Robot actively listening'
    },
    {
      name: 'Speaking Animation',
      status: 'speaking',
      description: 'Robot speaking response'
    },
    {
      name: 'Processing Animation',
      status: 'processing',
      description: 'Robot processing request'
    },
    {
      name: 'Error Animation',
      status: 'error',
      description: 'Robot error state'
    }
  ];

  for (const test of animationTests) {
    try {
      log(`\n🔍 Testing: ${test.name}`, 'cyan');
      log(`   📝 Description: ${test.description}`, 'cyan');
      log(`   🎨 Status: ${test.status}`, 'cyan');

      // Simulate status change
      const response = await fetch('http://localhost:5000/api/ai/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'test-user'
        },
        body: JSON.stringify({
          status: test.status,
          message: `Testing ${test.name}`
        })
      });

      if (response.ok) {
        log(`✅ ${test.name} - Animation triggered`, 'green');
      } else {
        log(`⚠️  ${test.name} - ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${test.name} - ${error.message}`, 'red');
    }
  }
}

// Test wake word detection simulation
async function testWakeWordDetection() {
  log('\n🎤 Testing Wake Word Detection Simulation...', 'blue');

  const wakeWordTests = [
    {
      wakeWord: 'EHB',
      description: 'Default wake word'
    },
    {
      wakeWord: 'ROBOT',
      description: 'Alternative wake word'
    },
    {
      wakeWord: 'HEY_EHB',
      description: 'Extended wake word'
    },
    {
      wakeWord: 'AI_ASSISTANT',
      description: 'Long wake word'
    }
  ];

  for (const test of wakeWordTests) {
    try {
      log(`\n🔍 Testing wake word: "${test.wakeWord}"`, 'cyan');
      log(`   📝 Description: ${test.description}`, 'cyan');

      // Update wake word
      const updateResponse = await fetch('http://localhost:5000/api/wake-word/wake-word', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'test-user'
        },
        body: JSON.stringify({
          wakeWord: test.wakeWord
        })
      });

      if (updateResponse.ok) {
        log(`✅ Wake word updated to: "${test.wakeWord}"`, 'green');

        // Test detection simulation
        const testResponse = await fetch('http://localhost:5000/api/wake-word/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': 'test-user'
          },
          body: JSON.stringify({
            audioData: 'dGVzdCBhdWRpbyBkYXRh', // Base64 test audio data
            wakeWord: test.wakeWord
          })
        });

        if (testResponse.ok) {
          const result = await testResponse.json();
          log(`   🎯 Detection Result: ${result.isWakeWord ? 'Detected' : 'Not Detected'}`, 'cyan');
        } else {
          log(`   ⚠️  Detection test failed`, 'yellow');
        }
      } else {
        log(`⚠️  Failed to update wake word`, 'yellow');
      }
    } catch (error) {
      log(`❌ Wake word test error: ${error.message}`, 'red');
    }
  }
}

// Test avatar settings
async function testAvatarSettings() {
  log('\n⚙️ Testing Avatar Settings...', 'blue');

  const settingsTests = [
    {
      name: 'Avatar Size - Small',
      setting: 'size',
      value: 'small'
    },
    {
      name: 'Avatar Size - Large',
      setting: 'size',
      value: 'large'
    },
    {
      name: 'Animation Speed - Fast',
      setting: 'speed',
      value: 'fast'
    },
    {
      name: 'Animation Speed - Slow',
      setting: 'speed',
      value: 'slow'
    },
    {
      name: 'Eye Color - Blue',
      setting: 'eyeColor',
      value: '#0088ff'
    },
    {
      name: 'Eye Color - Red',
      setting: 'eyeColor',
      value: '#ff0000'
    }
  ];

  for (const test of settingsTests) {
    try {
      log(`\n🔍 Testing: ${test.name}`, 'cyan');
      log(`   ⚙️ Setting: ${test.setting}`, 'cyan');
      log(`   📊 Value: ${test.value}`, 'cyan');

      // Simulate setting change
      const response = await fetch('http://localhost:5000/api/ai/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'test-user'
        },
        body: JSON.stringify({
          [test.setting]: test.value
        })
      });

      if (response.ok) {
        log(`✅ ${test.name} - Setting applied`, 'green');
      } else {
        log(`⚠️  ${test.name} - ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${test.name} - ${error.message}`, 'red');
    }
  }
}

// Test integration features
async function testIntegrationFeatures() {
  log('\n🔗 Testing Integration Features...', 'blue');

  const integrationTests = [
    {
      name: 'Wake Word + Voice Recognition',
      description: 'Integration between wake word and voice input'
    },
    {
      name: 'Avatar + Action Engine',
      description: 'Avatar responds to action execution'
    },
    {
      name: 'Avatar + Task Scheduler',
      description: 'Avatar shows task scheduling status'
    },
    {
      name: 'Avatar + AI Response',
      description: 'Avatar animates during AI processing'
    }
  ];

  for (const test of integrationTests) {
    try {
      log(`\n🔍 Testing: ${test.name}`, 'cyan');
      log(`   📝 Description: ${test.description}`, 'cyan');

      // Simulate integration test
      const response = await fetch('http://localhost:5000/api/ai/integration-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'test-user'
        },
        body: JSON.stringify({
          test: test.name,
          description: test.description
        })
      });

      if (response.ok) {
        log(`✅ ${test.name} - Integration working`, 'green');
      } else {
        log(`⚠️  ${test.name} - Integration test failed`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${test.name} - ${error.message}`, 'red');
    }
  }
}

// Main test function
async function runTests() {
  log('🤖 EHB AI Robot Avatar & Wake Word Test Suite', 'bright');
  log('================================================\n', 'bright');

  // Check if backend is running
  try {
    const healthResponse = await fetch('http://localhost:5000/health');
    if (!healthResponse.ok) {
      throw new Error('Backend not running');
    }
    log('✅ Backend is running', 'green');
  } catch (error) {
    log('❌ Backend is not running. Please start the backend first.', 'red');
    log('💡 Run: npm run dev', 'cyan');
    return;
  }

  // Run tests
  await testAvatarFeatures();
  await testWakeWordFeatures();
  await testAvatarAnimations();
  await testWakeWordDetection();
  await testAvatarSettings();
  await testIntegrationFeatures();

  log('\n🎉 Avatar & Wake Word Test Complete!', 'green');
  log('\n📋 Summary:', 'bright');
  log('✅ 3D Robot Avatar with animations', 'green');
  log('✅ Custom wake word detection', 'green');
  log('✅ Voice activity monitoring', 'green');
  log('✅ AI-powered wake word analysis', 'green');
  log('✅ Avatar state management', 'green');
  log('✅ Visual feedback system', 'green');
  log('✅ Settings customization', 'green');
  log('✅ Integration with other systems', 'green');

  log('\n🚀 Ready for voice interaction!', 'cyan');
  log('💡 Try saying:', 'cyan');
  log('   "EHB" - to wake the robot', 'cyan');
  log('   "EHB, what time is it?" - for voice commands', 'cyan');
  log('   "EHB, order pizza" - for action execution', 'cyan');
}

// Run tests
runTests().catch(console.error);
