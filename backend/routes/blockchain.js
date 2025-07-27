const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const Wallet = require('../models/Wallet');

// Generate new wallet
router.post('/wallet/generate', async (req, res) => {
  try {
    const { userId, walletType = 'user' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await blockchainService.generateWallet(userId, walletType);

    if (result.success) {
      res.json({
        success: true,
        wallet: result.wallet,
        message: 'Wallet generated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Generate wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate wallet'
    });
  }
});

// Get wallet balance
router.get('/wallet/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const { currency = 'EHB' } = req.query;

    if (!blockchainService.validateAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const result = await blockchainService.getWalletBalance(address, currency);

    if (result.success) {
      res.json({
        success: true,
        balance: result.balance,
        currency: result.currency,
        address: result.address
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance'
    });
  }
});

// Transfer tokens
router.post('/wallet/transfer', async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, currency = 'EHB', description } = req.body;

    if (!fromAddress || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'From address, to address, and amount are required'
      });
    }

    if (!blockchainService.validateAddress(fromAddress) || !blockchainService.validateAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const result = await blockchainService.transferTokens(fromAddress, toAddress, amount, currency, {
      description
    });

    if (result.success) {
      res.json({
        success: true,
        transaction: result.transaction,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer tokens'
    });
  }
});

// Stake tokens
router.post('/wallet/stake', async (req, res) => {
  try {
    const { walletAddress, amount, currency = 'EHB', stakingPeriod = 30 } = req.body;

    if (!walletAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and amount are required'
      });
    }

    const result = await blockchainService.stakeTokens(walletAddress, amount, currency, stakingPeriod);

    if (result.success) {
      res.json({
        success: true,
        stakingRecord: result.stakingRecord,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Stake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stake tokens'
    });
  }
});

// Unstake tokens
router.post('/wallet/unstake', async (req, res) => {
  try {
    const { walletAddress, stakingId } = req.body;

    if (!walletAddress || !stakingId) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and staking ID are required'
      });
    }

    const result = await blockchainService.unstakeTokens(walletAddress, stakingId);

    if (result.success) {
      res.json({
        success: true,
        unstakingRecord: result.unstakingRecord,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Unstake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unstake tokens'
    });
  }
});

// Get transaction history
router.get('/wallet/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const { type, currency, status, page = 1, limit = 20 } = req.query;

    if (!blockchainService.validateAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const result = await blockchainService.getTransactionHistory(address, {
      type,
      currency,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (result.success) {
      res.json({
        success: true,
        transactions: result.transactions,
        pagination: result.pagination
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction history'
    });
  }
});

// Get wallet statistics
router.get('/wallet/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;

    if (!blockchainService.validateAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const result = await blockchainService.getWalletStats(address);

    if (result.success) {
      res.json({
        success: true,
        stats: result.stats
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet statistics'
    });
  }
});

// Get top wallets
router.get('/wallets/top', async (req, res) => {
  try {
    const { currency = 'EHB', limit = 10 } = req.query;

    const topWallets = await Wallet.getTopWallets(currency, parseInt(limit));

    res.json({
      success: true,
      wallets: topWallets,
      currency,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get top wallets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top wallets'
    });
  }
});

// Get transaction statistics
router.get('/transactions/stats', async (req, res) => {
  try {
    const stats = await Wallet.getTransactionStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction statistics'
    });
  }
});

// Validate wallet address
router.post('/wallet/validate', (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    const isValid = blockchainService.validateAddress(address);

    res.json({
      success: true,
      isValid,
      address
    });
  } catch (error) {
    console.error('Validate address error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate address'
    });
  }
});

// Get network information
router.get('/network/:network', (req, res) => {
  try {
    const { network } = req.params;

    const networkInfo = blockchainService.getNetworkInfo(network);

    res.json({
      success: true,
      network: networkInfo
    });
  } catch (error) {
    console.error('Get network info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get blockchain service status
router.get('/status', (req, res) => {
  try {
    const status = blockchainService.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain service status'
    });
  }
});

// Get wallet by user ID
router.get('/wallet/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await Wallet.findByUserId(userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      wallet: {
        address: wallet.walletAddress,
        type: wallet.walletType,
        balances: wallet.balances,
        kycStatus: wallet.kyc.status,
        security: wallet.security
      }
    });
  } catch (error) {
    console.error('Get wallet by user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet'
    });
  }
});

// Update wallet settings
router.put('/wallet/:address/settings', async (req, res) => {
  try {
    const { address } = req.params;
    const { settings } = req.body;

    const wallet = await Wallet.findByAddress(address);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Update settings
    if (settings.defaultCurrency) {
      wallet.settings.defaultCurrency = settings.defaultCurrency;
    }
    if (settings.language) {
      wallet.settings.language = settings.language;
    }
    if (settings.timezone) {
      wallet.settings.timezone = settings.timezone;
    }
    if (settings.notifications) {
      wallet.settings.notifications = { ...wallet.settings.notifications, ...settings.notifications };
    }

    await wallet.save();

    res.json({
      success: true,
      message: 'Wallet settings updated successfully',
      settings: wallet.settings
    });
  } catch (error) {
    console.error('Update wallet settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wallet settings'
    });
  }
});

// Lock/unlock wallet
router.post('/wallet/:address/lock', async (req, res) => {
  try {
    const { address } = req.params;
    const { lock, reason } = req.body;

    const wallet = await Wallet.findByAddress(address);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    wallet.security.isLocked = lock;
    if (lock && reason) {
      wallet.security.lockReason = reason;
    }

    await wallet.save();

    res.json({
      success: true,
      message: `Wallet ${lock ? 'locked' : 'unlocked'} successfully`,
      isLocked: wallet.security.isLocked
    });
  } catch (error) {
    console.error('Lock/unlock wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock/unlock wallet'
    });
  }
});

module.exports = router;
