// EHB Robot Blockchain Integration Service
// Phase 5: Blockchain Integration & Deep Learning

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class BlockchainIntegrationService {
  constructor() {
    this.validatorNodes = new Map();
    this.blockchainData = new Map();
    this.learningProofs = new Map();
    this.validatorSync = new Map();
    this.blockchainPath = path.join(__dirname, '../data/blockchain');
    this.init();
  }

  async init() {
    try {
      await this.ensureBlockchainDirectory();
      await this.loadBlockchainData();
      await this.initializeValidatorNodes();
      console.log('🔗 Blockchain Integration Service initialized');
    } catch (error) {
      console.error('Failed to initialize Blockchain Integration Service:', error);
    }
  }

  async ensureBlockchainDirectory() {
    try {
      await fs.mkdir(this.blockchainPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create blockchain directory:', error);
    }
  }

  async loadBlockchainData() {
    try {
      // Load blockchain data
      const blockchainPath = path.join(this.blockchainPath, 'blockchain-data.json');
      const blockchainData = await fs.readFile(blockchainPath, 'utf8').catch(() => '{}');
      const data = JSON.parse(blockchainData);
      this.blockchainData = new Map(Object.entries(data));

      // Load learning proofs
      const proofsPath = path.join(this.blockchainPath, 'learning-proofs.json');
      const proofsData = await fs.readFile(proofsPath, 'utf8').catch(() => '{}');
      const proofs = JSON.parse(proofsData);
      this.learningProofs = new Map(Object.entries(proofs));

      // Load validator sync data
      const syncPath = path.join(this.blockchainPath, 'validator-sync.json');
      const syncData = await fs.readFile(syncPath, 'utf8').catch(() => '{}');
      const sync = JSON.parse(syncData);
      this.validatorSync = new Map(Object.entries(sync));

      console.log(`🔗 Loaded ${this.blockchainData.size} blockchain records, ${this.learningProofs.size} proofs, ${this.validatorSync.size} validator syncs`);
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
    }
  }

  async saveBlockchainData() {
    try {
      // Save blockchain data
      const blockchainPath = path.join(this.blockchainPath, 'blockchain-data.json');
      const data = Object.fromEntries(this.blockchainData);
      await fs.writeFile(blockchainPath, JSON.stringify(data, null, 2));

      // Save learning proofs
      const proofsPath = path.join(this.blockchainPath, 'learning-proofs.json');
      const proofs = Object.fromEntries(this.learningProofs);
      await fs.writeFile(proofsPath, JSON.stringify(proofs, null, 2));

      // Save validator sync data
      const syncPath = path.join(this.blockchainPath, 'validator-sync.json');
      const sync = Object.fromEntries(this.validatorSync);
      await fs.writeFile(syncPath, JSON.stringify(sync, null, 2));

      console.log('💾 Blockchain data saved successfully');
    } catch (error) {
      console.error('Failed to save blockchain data:', error);
    }
  }

  // Initialize validator nodes
  async initializeValidatorNodes() {
    const mockValidators = [
      {
        id: 'validator-001',
        address: '0x1234567890abcdef',
        status: 'active',
        stake: 1000,
        lastSync: new Date().toISOString(),
        learningData: []
      },
      {
        id: 'validator-002',
        address: '0xabcdef1234567890',
        status: 'active',
        stake: 1500,
        lastSync: new Date().toISOString(),
        learningData: []
      },
      {
        id: 'validator-003',
        address: '0x7890abcdef123456',
        status: 'active',
        stake: 2000,
        lastSync: new Date().toISOString(),
        learningData: []
      }
    ];

    mockValidators.forEach(validator => {
      this.validatorNodes.set(validator.id, validator);
    });

    console.log(`🔗 Initialized ${mockValidators.length} validator nodes`);
  }

  // Generate blockchain hash for learning data
  generateLearningHash(userId, command, result, timestamp) {
    const data = `${userId}-${command}-${JSON.stringify(result)}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Create action proof for robot actions
  async createActionProof(userId, action, params, result) {
    const proof = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      params,
      result,
      timestamp: new Date().toISOString(),
      hash: this.generateLearningHash(userId, action, result, new Date().toISOString()),
      validatorId: this.getRandomValidatorId(),
      status: 'pending'
    };

    this.learningProofs.set(proof.id, proof);
    await this.saveBlockchainData();

    console.log(`🔗 Created action proof: ${proof.id}`);
    return proof;
  }

  // Sync learning data with validators
  async syncWithValidators(learningData) {
    const syncPromises = Array.from(this.validatorNodes.values()).map(async (validator) => {
      try {
        // Simulate validator sync
        const syncResult = await this.syncToValidator(validator, learningData);

        // Update validator sync status
        validator.lastSync = new Date().toISOString();
        validator.learningData.push({
          timestamp: new Date().toISOString(),
          dataHash: this.generateLearningHash('sync', JSON.stringify(learningData), '', new Date().toISOString()),
          status: 'synced'
        });

        return {
          validatorId: validator.id,
          status: 'success',
          dataHash: syncResult.dataHash
        };
      } catch (error) {
        console.error(`Failed to sync with validator ${validator.id}:`, error);
        return {
          validatorId: validator.id,
          status: 'failed',
          error: error.message
        };
      }
    });

    const results = await Promise.all(syncPromises);
    console.log(`🔗 Synced with ${results.filter(r => r.status === 'success').length}/${results.length} validators`);

    return results;
  }

  // Sync data to specific validator
  async syncToValidator(validator, learningData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const dataHash = this.generateLearningHash('validator-sync', JSON.stringify(learningData), validator.id, new Date().toISOString());

    return {
      validatorId: validator.id,
      dataHash,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  }

  // Get random validator ID for proof assignment
  getRandomValidatorId() {
    const validators = Array.from(this.validatorNodes.keys());
    return validators[Math.floor(Math.random() * validators.length)];
  }

  // Store learning data on blockchain
  async storeLearningData(userId, learningData) {
    const blockchainRecord = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      learningData,
      timestamp: new Date().toISOString(),
      hash: this.generateLearningHash(userId, JSON.stringify(learningData), '', new Date().toISOString()),
      validatorProofs: [],
      status: 'pending'
    };

    // Create validator proofs
    const validatorProofs = await this.createValidatorProofs(blockchainRecord);
    blockchainRecord.validatorProofs = validatorProofs;
    blockchainRecord.status = 'confirmed';

    this.blockchainData.set(blockchainRecord.id, blockchainRecord);
    await this.saveBlockchainData();

    console.log(`🔗 Stored learning data on blockchain: ${blockchainRecord.id}`);
    return blockchainRecord;
  }

  // Create validator proofs for blockchain record
  async createValidatorProofs(blockchainRecord) {
    const proofs = [];

    for (const validator of this.validatorNodes.values()) {
      const proof = {
        validatorId: validator.id,
        validatorAddress: validator.address,
        proofHash: this.generateLearningHash(validator.id, blockchainRecord.hash, '', new Date().toISOString()),
        timestamp: new Date().toISOString(),
        stake: validator.stake
      };
      proofs.push(proof);
    }

    return proofs;
  }

  // Get blockchain analytics
  async getBlockchainAnalytics() {
    const totalRecords = this.blockchainData.size;
    const totalProofs = this.learningProofs.size;
    const activeValidators = Array.from(this.validatorNodes.values()).filter(v => v.status === 'active').length;

    const recentActivity = Array.from(this.blockchainData.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const validatorStats = Array.from(this.validatorNodes.values()).map(validator => ({
      id: validator.id,
      address: validator.address,
      stake: validator.stake,
      status: validator.status,
      lastSync: validator.lastSync,
      learningDataCount: validator.learningData.length
    }));

    return {
      totalRecords,
      totalProofs,
      activeValidators,
      recentActivity,
      validatorStats,
      blockchainSize: this.blockchainData.size + this.learningProofs.size + this.validatorSync.size
    };
  }

  // Get validator information
  async getValidatorInfo(validatorId) {
    const validator = this.validatorNodes.get(validatorId);
    if (!validator) {
      throw new Error(`Validator ${validatorId} not found`);
    }

    const validatorProofs = Array.from(this.learningProofs.values())
      .filter(proof => proof.validatorId === validatorId);

    return {
      ...validator,
      totalProofs: validatorProofs.length,
      recentProofs: validatorProofs.slice(-5)
    };
  }

  // Get all validators
  async getAllValidators() {
    return Array.from(this.validatorNodes.values());
  }

  // Verify blockchain record
  async verifyBlockchainRecord(recordId) {
    const record = this.blockchainData.get(recordId);
    if (!record) {
      throw new Error(`Record ${recordId} not found`);
    }

    // Verify hash
    const expectedHash = this.generateLearningHash(record.userId, JSON.stringify(record.learningData), '', record.timestamp);
    const hashValid = record.hash === expectedHash;

    // Verify validator proofs
    const validatorProofsValid = record.validatorProofs.every(proof => {
      const expectedProofHash = this.generateLearningHash(proof.validatorId, record.hash, '', proof.timestamp);
      return proof.proofHash === expectedProofHash;
    });

    return {
      recordId,
      hashValid,
      validatorProofsValid,
      overallValid: hashValid && validatorProofsValid,
      timestamp: new Date().toISOString()
    };
  }

  // Get learning proofs for user
  async getUserLearningProofs(userId) {
    const userProofs = Array.from(this.learningProofs.values())
      .filter(proof => proof.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return userProofs;
  }

  // Get blockchain record by ID
  async getBlockchainRecord(recordId) {
    return this.blockchainData.get(recordId);
  }

  // Get recent blockchain activity
  async getRecentActivity(limit = 20) {
    const allRecords = Array.from(this.blockchainData.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return allRecords.map(record => ({
      id: record.id,
      userId: record.userId,
      timestamp: record.timestamp,
      status: record.status,
      validatorCount: record.validatorProofs.length
    }));
  }

  // Simulate blockchain transaction
  async simulateTransaction(userId, action, params) {
    const transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      params,
      timestamp: new Date().toISOString(),
      hash: this.generateLearningHash(userId, action, JSON.stringify(params), new Date().toISOString()),
      status: 'pending'
    };

    // Simulate blockchain confirmation
    setTimeout(() => {
      transaction.status = 'confirmed';
      transaction.confirmationTime = new Date().toISOString();
      console.log(`🔗 Transaction confirmed: ${transaction.id}`);
    }, 2000);

    return transaction;
  }

  // Get blockchain health status
  async getBlockchainHealth() {
    const activeValidators = Array.from(this.validatorNodes.values()).filter(v => v.status === 'active').length;
    const totalValidators = this.validatorNodes.size;
    const recentRecords = Array.from(this.blockchainData.values())
      .filter(record => new Date(record.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

    return {
      status: 'healthy',
      activeValidators,
      totalValidators,
      validatorHealth: (activeValidators / totalValidators) * 100,
      recentActivity: recentRecords,
      lastSync: new Date().toISOString()
    };
  }
}

module.exports = new BlockchainIntegrationService();
