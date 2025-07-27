// Test script for Personal AI Brain System
const mongoose = require('mongoose');
const PersonalBrain = require('./backend/models/PersonalBrain');
const brainTrainer = require('./backend/ai-core/brainTrainer');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ehb-robot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testBrainSystem() {
  try {
    console.log('🧠 Testing Personal AI Brain System...');

    const testUserId = 'test-user-123';

    // Test 1: Create new brain
    console.log('\n1. Creating new brain...');
    const initialInteraction = {
      intent: 'shopping',
      command: 'order cold drink',
      success: true,
      response: 'I\'ll order a cold drink for you',
      timestamp: new Date(),
      responseTime: 1200,
      walletAddress: '0x1234567890abcdef'
    };

    const brain = await brainTrainer.learnFromInteraction(testUserId, initialInteraction);
    console.log('✅ Brain created:', brain._id);
    console.log('📊 Training data points:', brain.trainingDataPoints);

    // Test 2: Learn from more interactions
    console.log('\n2. Learning from more interactions...');
    const interactions = [
      {
        intent: 'booking',
        command: 'book electrician',
        success: true,
        response: 'I\'ll book an electrician for you',
        timestamp: new Date(),
        responseTime: 800
      },
      {
        intent: 'reminder',
        command: 'remind me to take medicine',
        success: true,
        response: 'I\'ll set a reminder for your medicine',
        timestamp: new Date(),
        responseTime: 1500
      },
      {
        intent: 'finance',
        command: 'check wallet balance',
        success: true,
        response: 'Your wallet balance is 500 EHBGC',
        timestamp: new Date(),
        responseTime: 600
      }
    ];

    for (const interaction of interactions) {
      await brainTrainer.learnFromInteraction(testUserId, interaction);
    }

    // Test 3: Generate personalized response
    console.log('\n3. Testing personalized response...');
    const personalizedResponse = await brainTrainer.generatePersonalizedResponse(
      testUserId,
      'order pizza for dinner',
      { responseTime: 1000 }
    );
    console.log('🤖 Personalized response:', personalizedResponse);

    // Test 4: Get brain statistics
    console.log('\n4. Getting brain statistics...');
    const updatedBrain = await PersonalBrain.getBrainByUser(testUserId);
    console.log('📊 Brain age:', updatedBrain.brainAge, 'days');
    console.log('📊 Training progress:', updatedBrain.trainingProgress.toFixed(1) + '%');
    console.log('📊 Total interactions:', updatedBrain.interactionStats.totalInteractions);
    console.log('📊 Success rate:', (updatedBrain.interactionStats.successfulInteractions / updatedBrain.interactionStats.totalInteractions * 100).toFixed(1) + '%');

    // Test 5: Export brain
    console.log('\n5. Testing brain export...');
    const brainData = await brainTrainer.exportBrain(testUserId);
    console.log('📦 Brain exported successfully');
    console.log('📦 Export size:', JSON.stringify(brainData).length, 'bytes');
    console.log('📦 Brain version:', brainData.brainVersion);

    // Test 6: Update preferences
    console.log('\n6. Testing preference updates...');
    await updatedBrain.updateInteractionStats(true, 1000);
    console.log('✅ Interaction stats updated');

    // Test 7: Test brain training
    console.log('\n7. Testing brain training...');
    await brainTrainer.triggerTraining(updatedBrain);
    console.log('✅ Brain training completed');

    console.log('\n🎉 All brain system tests completed successfully!');

  } catch (error) {
    console.error('❌ Brain system test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testBrainSystem();
