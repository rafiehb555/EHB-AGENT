const { ethers } = require('ethers');
const crypto = require('crypto');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
require('dotenv').config();

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contracts = {};
    this.networks = {
      ethereum: {
        name: 'Ethereum Mainnet',
        rpc: process.env.ETHEREUM_RPC || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        chainId: 1,
        currency: 'ETH'
      },
      polygon: {
        name: 'Polygon Mainnet',
        rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
        chainId: 137,
        currency: 'MATIC'
      },
      bsc: {
        name: 'Binance Smart Chain',
        rpc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
        chainId: 56,
        currency: 'BNB'
      }
    };

    this.initializeProvider();
  }

  // Initialize blockchain provider
  initializeProvider() {
    try {
      // Initialize providers for different networks
      Object.keys(this.networks).forEach(network => {
        const networkConfig = this.networks[network];
        this.provider = new ethers.providers.JsonRpcProvider(networkConfig.rpc);
        console.log(`✅ ${networkConfig.name} provider initialized`);
      });
    } catch (error) {
      console.error('❌ Error initializing blockchain provider:', error);
    }
  }

  // Generate new wallet
  async generateWallet(userId, walletType = 'user') {
    try {
      console.log(`🔐 Generating wallet for user: ${userId}`);

      // Generate Ethereum wallet
      const wallet = ethers.Wallet.createRandom();

      // Create wallet record in database
      const walletData = {
        userId,
        walletAddress: wallet.address,
        walletType,
        balances: {
          EHB: 0,
          USDT: 0,
          BTC: 0,
          ETH: 0
        },
        security: {
          isLocked: false,
          twoFactorEnabled: false,
          lastLogin: new Date()
        },
        permissions: {
          canSend: true,
          canReceive: true,
          canTrade: true,
          canStake: false,
          maxDailyTransfer: 10000
        }
      };

      const newWallet = new Wallet(walletData);
      await newWallet.save();

      console.log(`✅ Wallet generated: ${wallet.address}`);

      return {
        success: true,
        wallet: {
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic: wallet.mnemonic.phrase
        },
        walletData
      };
    } catch (error) {
      console.error('❌ Error generating wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get wallet balance
  async getWalletBalance(address, currency = 'ETH') {
    try {
      console.log(`💰 Getting balance for ${address} (${currency})`);

      const wallet = await Wallet.findByAddress(address);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get on-chain balance for supported currencies
      if (currency === 'ETH') {
        const balance = await this.provider.getBalance(address);
        return {
          success: true,
          balance: ethers.utils.formatEther(balance),
          currency,
          address
        };
      }

      // Return database balance for other currencies
      return {
        success: true,
        balance: wallet.getBalance(currency),
        currency,
        address
      };
    } catch (error) {
      console.error('❌ Error getting wallet balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Transfer tokens
  async transferTokens(fromAddress, toAddress, amount, currency = 'EHB', options = {}) {
    try {
      console.log(`🔄 Transferring ${amount} ${currency} from ${fromAddress} to ${toAddress}`);

      const fromWallet = await Wallet.findByAddress(fromAddress);
      const toWallet = await Wallet.findByAddress(toAddress);

      if (!fromWallet || !toWallet) {
        throw new Error('Wallet not found');
      }

      // Check if transfer is allowed
      const canTransfer = fromWallet.canTransfer(amount, currency);
      if (!canTransfer.canTransfer) {
        throw new Error(canTransfer.reason);
      }

      // Create transaction record
      const transaction = {
        txHash: this.generateTransactionHash(),
        type: 'transfer',
        amount: parseFloat(amount),
        currency,
        fromAddress,
        toAddress,
        description: options.description || `Transfer of ${amount} ${currency}`,
        status: 'pending',
        timestamp: new Date(),
        metadata: options.metadata || {}
      };

      // Update balances
      await fromWallet.updateBalance(currency, amount, 'subtract');
      await toWallet.updateBalance(currency, amount, 'add');

      // Add transaction to both wallets
      await fromWallet.addTransaction(transaction);
      await toWallet.addTransaction({
        ...transaction,
        type: 'transfer',
        fromAddress: toAddress,
        toAddress: fromAddress
      });

      // Add notifications
      await fromWallet.addNotification({
        type: 'transaction',
        title: 'Transfer Sent',
        message: `Successfully transferred ${amount} ${currency} to ${toAddress}`,
        metadata: { transactionId: transaction.txHash }
      });

      await toWallet.addNotification({
        type: 'transaction',
        title: 'Transfer Received',
        message: `Received ${amount} ${currency} from ${fromAddress}`,
        metadata: { transactionId: transaction.txHash }
      });

      console.log(`✅ Transfer completed: ${transaction.txHash}`);

      return {
        success: true,
        transaction: transaction,
        message: `Successfully transferred ${amount} ${currency}`
      };
    } catch (error) {
      console.error('❌ Error transferring tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Stake tokens
  async stakeTokens(walletAddress, amount, currency = 'EHB', stakingPeriod = 30) {
    try {
      console.log(`🔒 Staking ${amount} ${currency} for ${stakingPeriod} days`);

      const wallet = await Wallet.findByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if staking is enabled
      if (!wallet.permissions.canStake) {
        throw new Error('Staking is not enabled for this wallet');
      }

      // Check balance
      const balance = wallet.getBalance(currency);
      if (balance < amount) {
        throw new Error('Insufficient balance for staking');
      }

      // Calculate rewards
      const rewardRate = 0.05; // 5% annual return
      const dailyReward = (amount * rewardRate) / 365;
      const totalReward = dailyReward * stakingPeriod;

      // Create staking record
      const stakingRecord = {
        amount: parseFloat(amount),
        currency,
        startDate: new Date(),
        endDate: new Date(Date.now() + stakingPeriod * 24 * 60 * 60 * 1000),
        rewardRate,
        totalReward,
        status: 'active'
      };

      // Update wallet
      wallet.staking.totalStaked += parseFloat(amount);
      wallet.staking.stakingHistory.push(stakingRecord);
      await wallet.updateBalance(currency, amount, 'subtract');

      // Add transaction
      await wallet.addTransaction({
        txHash: this.generateTransactionHash(),
        type: 'staking',
        amount: parseFloat(amount),
        currency,
        fromAddress: walletAddress,
        toAddress: 'staking_pool',
        description: `Staked ${amount} ${currency} for ${stakingPeriod} days`,
        status: 'confirmed',
        timestamp: new Date(),
        metadata: { stakingPeriod, rewardRate, totalReward }
      });

      console.log(`✅ Staking completed: ${amount} ${currency} staked`);

      return {
        success: true,
        stakingRecord,
        message: `Successfully staked ${amount} ${currency}`
      };
    } catch (error) {
      console.error('❌ Error staking tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Unstake tokens
  async unstakeTokens(walletAddress, stakingId) {
    try {
      console.log(`🔓 Unstaking tokens from wallet: ${walletAddress}`);

      const wallet = await Wallet.findByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const stakingRecord = wallet.staking.stakingHistory.id(stakingId);
      if (!stakingRecord || stakingRecord.status !== 'active') {
        throw new Error('Invalid staking record');
      }

      // Calculate rewards
      const now = new Date();
      const daysStaked = Math.floor((now - stakingRecord.startDate) / (1000 * 60 * 60 * 24));
      const earnedReward = (stakingRecord.amount * stakingRecord.rewardRate * daysStaked) / 365;

      // Update staking record
      stakingRecord.status = 'completed';
      stakingRecord.endDate = now;
      stakingRecord.totalReward = earnedReward;

      // Update wallet
      wallet.staking.totalStaked -= stakingRecord.amount;
      wallet.staking.stakingRewards += earnedReward;
      await wallet.updateBalance(stakingRecord.currency, stakingRecord.amount + earnedReward, 'add');

      // Add transaction
      await wallet.addTransaction({
        txHash: this.generateTransactionHash(),
        type: 'unstaking',
        amount: stakingRecord.amount + earnedReward,
        currency: stakingRecord.currency,
        fromAddress: 'staking_pool',
        toAddress: walletAddress,
        description: `Unstaked ${stakingRecord.amount} ${stakingRecord.currency} + ${earnedReward} rewards`,
        status: 'confirmed',
        timestamp: new Date(),
        metadata: { stakingId, daysStaked, earnedReward }
      });

      await wallet.save();

      console.log(`✅ Unstaking completed: ${stakingRecord.amount + earnedReward} ${stakingRecord.currency}`);

      return {
        success: true,
        unstakingRecord: {
          originalAmount: stakingRecord.amount,
          earnedReward,
          totalReturned: stakingRecord.amount + earnedReward,
          daysStaked
        },
        message: `Successfully unstaked ${stakingRecord.amount + earnedReward} ${stakingRecord.currency}`
      };
    } catch (error) {
      console.error('❌ Error unstaking tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transaction history
  async getTransactionHistory(walletAddress, options = {}) {
    try {
      console.log(`📜 Getting transaction history for: ${walletAddress}`);

      const wallet = await Wallet.findByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      let transactions = wallet.transactions;

      // Apply filters
      if (options.type) {
        transactions = transactions.filter(tx => tx.type === options.type);
      }

      if (options.currency) {
        transactions = transactions.filter(tx => tx.currency === options.currency);
      }

      if (options.status) {
        transactions = transactions.filter(tx => tx.status === options.status);
      }

      // Sort by timestamp
      transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = transactions.slice(startIndex, endIndex);

      return {
        success: true,
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total: transactions.length,
          totalPages: Math.ceil(transactions.length / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error getting transaction history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get wallet statistics
  async getWalletStats(walletAddress) {
    try {
      console.log(`📊 Getting wallet statistics for: ${walletAddress}`);

      const wallet = await Wallet.findByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transactions = wallet.transactions;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        totalBalance: Object.values(wallet.balances).reduce((sum, balance) => sum + balance, 0),
        totalTransactions: transactions.length,
        monthlyTransactions: transactions.filter(tx => tx.timestamp >= thirtyDaysAgo).length,
        totalStaked: wallet.staking.totalStaked,
        totalRewards: wallet.staking.stakingRewards,
        activeStaking: wallet.staking.stakingHistory.filter(s => s.status === 'active').length,
        kycStatus: wallet.kyc.status,
        securityStatus: {
          isLocked: wallet.security.isLocked,
          twoFactorEnabled: wallet.security.twoFactorEnabled
        }
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('❌ Error getting wallet statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate transaction hash
  generateTransactionHash() {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  // Validate wallet address
  validateAddress(address) {
    try {
      return ethers.utils.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  // Get network information
  getNetworkInfo(network = 'ethereum') {
    const networkConfig = this.networks[network];
    if (!networkConfig) {
      throw new Error(`Network ${network} not supported`);
    }

    return {
      name: networkConfig.name,
      chainId: networkConfig.chainId,
      currency: networkConfig.currency,
      rpc: networkConfig.rpc
    };
  }

  // Get service status
  getStatus() {
    return {
      provider: this.provider ? 'connected' : 'disconnected',
      networks: Object.keys(this.networks),
      contracts: Object.keys(this.contracts),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
