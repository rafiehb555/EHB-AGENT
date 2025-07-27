// Test script for DAO Voting System
const mongoose = require('mongoose');
const DaoGovernance = require('./backend/models/DaoGovernance');
const VotingPreferences = require('./backend/models/VotingPreferences');
const votingEngine = require('./backend/dao/votingEngine');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ehb-robot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testDaoSystem() {
  try {
    console.log('🗳️ Testing DAO Voting System...');

    const testUserId = 'test-user-123';
    const testWalletAddress = '0x1234567890abcdef';

    // Test 1: Create voting preferences
    console.log('\n1. Creating voting preferences...');
    const votingPrefs = new VotingPreferences({
      userId: testUserId,
      walletAddress: testWalletAddress,
      autoVote: {
        enabled: true,
        mode: 'custom_rules',
        defaultChoice: 'yes'
      },
      customRules: [
        {
          name: 'Auto-approve upgrades',
          category: 'upgrade',
          condition: 'always',
          action: 'yes',
          isActive: true
        }
      ],
      categoryPreferences: [
        {
          category: 'governance',
          defaultChoice: 'yes',
          autoVote: true,
          reasoning: 'Support governance improvements'
        }
      ]
    });

    await votingPrefs.save();
    console.log('✅ Voting preferences created');

    // Test 2: Create a test proposal
    console.log('\n2. Creating test proposal...');
    const testProposal = new DaoGovernance({
      proposalId: 'PROP-TEST-001',
      title: 'Test Proposal: Upgrade Validator Reward Rate',
      description: 'This proposal aims to increase validator rewards by 10% to incentivize more participation in the network.',
      category: 'upgrade',
      status: 'voting',
      proposer: {
        walletAddress: '0xabcdef1234567890',
        userId: 'proposer-123',
        tokenBalance: 5000
      },
      votingPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        duration: 7
      },
      impact: {
        cost: 0,
        risk: 'medium',
        affectedUsers: 1000,
        implementationTime: 30
      },
      quorum: 1000,
      threshold: 51
    });

    await testProposal.save();
    console.log('✅ Test proposal created:', testProposal.proposalId);

    // Test 3: Analyze proposal with AI
    console.log('\n3. Analyzing proposal with AI...');
    const analysis = await votingEngine.analyzeProposal(testProposal);
    console.log('🤖 AI Analysis:', analysis);

    // Test 4: Check auto-voting
    console.log('\n4. Testing auto-voting...');
    const shouldAutoVote = await votingEngine.shouldAutoVote(votingPrefs, testProposal);
    console.log('Auto-vote decision:', shouldAutoVote);

    // Test 5: Execute auto-vote
    if (shouldAutoVote.should) {
      console.log('\n5. Executing auto-vote...');
      await votingEngine.executeAutoVote(votingPrefs, testProposal, shouldAutoVote.choice);
      console.log('✅ Auto-vote executed');
    }

    // Test 6: Add manual vote
    console.log('\n6. Adding manual vote...');
    await testProposal.addVote({
      voter: {
        walletAddress: testWalletAddress,
        userId: testUserId
      },
      choice: 'yes',
      power: 500,
      robotVote: false,
      reasoning: 'Supporting this upgrade proposal'
    });

    console.log('✅ Manual vote added');

    // Test 7: Check proposal status
    console.log('\n7. Checking proposal status...');
    console.log('📊 Total votes:', testProposal.voteStats.totalVotes);
    console.log('📊 Yes votes:', testProposal.voteStats.yesVotes);
    console.log('📊 No votes:', testProposal.voteStats.noVotes);
    console.log('📊 Yes percentage:', testProposal.yesPercentage + '%');
    console.log('📊 Quorum met:', testProposal.quorumMet);
    console.log('📊 Proposal passed:', testProposal.checkPassed());

    // Test 8: Get voting history
    console.log('\n8. Getting voting history...');
    const votingHistory = await votingEngine.getUserVotingHistory(testWalletAddress);
    console.log('📜 Voting history:', votingHistory.length, 'votes');

    // Test 9: Get proposal statistics
    console.log('\n9. Getting proposal statistics...');
    const stats = await votingEngine.getProposalStats();
    console.log('📈 Proposal stats:', stats);

    // Test 10: Create proposal with AI assistance
    console.log('\n10. Creating proposal with AI assistance...');
    const newProposal = await votingEngine.createProposal(testUserId, {
      title: 'AI-Generated Proposal: Reduce SQL Verification Wait Time',
      description: 'This proposal aims to reduce the SQL verification wait time from 24 hours to 12 hours to improve user experience.',
      category: 'governance',
      impact: {
        cost: 0,
        risk: 'low',
        affectedUsers: 500,
        implementationTime: 7
      },
      walletAddress: testWalletAddress
    });

    console.log('✅ AI-assisted proposal created:', newProposal.proposalId);

    console.log('\n🎉 All DAO system tests completed successfully!');

  } catch (error) {
    console.error('❌ DAO system test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testDaoSystem();
