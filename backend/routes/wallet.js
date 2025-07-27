const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for wallet operations
const walletLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: 'Too many wallet requests, please try again later.'
});

// Wallet Schema
const walletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'EHBGC'
    },
    lockedAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockExpiry: {
        type: Date
    },
    transactions: [{
        type: {
            type: String,
            enum: ['deposit', 'withdrawal', 'lock', 'unlock', 'order_payment', 'refund'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: String,
        orderId: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Wallet = mongoose.model('Wallet', walletSchema);

// GET /api/wallet/balance - Get wallet balance
router.get('/balance', auth, walletLimiter, async (req, res) => {
    try {
        const userId = req.user.id;

        let wallet = await Wallet.findOne({ userId });

        // Create wallet if it doesn't exist
        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: 100, // Default balance for new users
                currency: 'EHBGC'
            });
            await wallet.save();
        }

        res.json({
            success: true,
            balance: wallet.balance,
            currency: wallet.currency,
            lockedAmount: wallet.lockedAmount,
            isLocked: wallet.isLocked,
            availableBalance: wallet.balance - wallet.lockedAmount
        });

    } catch (error) {
        console.error('Get wallet balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet balance'
        });
    }
});

// GET /api/wallet/locked - Get wallet lock status
router.get('/locked', auth, walletLimiter, async (req, res) => {
    try {
        const userId = req.user.id;

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: 100,
                currency: 'EHBGC'
            });
            await wallet.save();
        }

        // Check if lock has expired
        if (wallet.isLocked && wallet.lockExpiry && new Date() > wallet.lockExpiry) {
            wallet.isLocked = false;
            wallet.lockedAmount = 0;
            wallet.lockExpiry = null;
            await wallet.save();
        }

        res.json({
            success: true,
            locked: wallet.isLocked,
            lockedAmount: wallet.lockedAmount,
            requiredAmount: 10, // Minimum required for VIP services
            lockExpiry: wallet.lockExpiry
        });

    } catch (error) {
        console.error('Get wallet lock status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet lock status'
        });
    }
});

// POST /api/wallet/lock - Lock wallet amount
router.post('/lock', auth, walletLimiter, async (req, res) => {
    try {
        const { amount, duration } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance to lock'
            });
        }

        // Calculate lock expiry (default 24 hours)
        const lockDuration = duration || 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const lockExpiry = new Date(Date.now() + lockDuration);

        wallet.lockedAmount = amount;
        wallet.isLocked = true;
        wallet.lockExpiry = lockExpiry;
        wallet.updatedAt = new Date();

        // Add transaction record
        wallet.transactions.push({
            type: 'lock',
            amount: amount,
            description: `Locked ${amount} EHBGC for VIP services`,
            timestamp: new Date()
        });

        await wallet.save();

        res.json({
            success: true,
            message: `Successfully locked ${amount} EHBGC`,
            data: {
                lockedAmount: wallet.lockedAmount,
                lockExpiry: wallet.lockExpiry,
                availableBalance: wallet.balance - wallet.lockedAmount
            }
        });

    } catch (error) {
        console.error('Lock wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to lock wallet amount'
        });
    }
});

// POST /api/wallet/unlock - Unlock wallet amount
router.post('/unlock', auth, walletLimiter, async (req, res) => {
    try {
        const userId = req.user.id;

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        if (!wallet.isLocked) {
            return res.status(400).json({
                success: false,
                message: 'No locked amount to unlock'
            });
        }

        const unlockedAmount = wallet.lockedAmount;

        wallet.lockedAmount = 0;
        wallet.isLocked = false;
        wallet.lockExpiry = null;
        wallet.updatedAt = new Date();

        // Add transaction record
        wallet.transactions.push({
            type: 'unlock',
            amount: unlockedAmount,
            description: `Unlocked ${unlockedAmount} EHBGC`,
            timestamp: new Date()
        });

        await wallet.save();

        res.json({
            success: true,
            message: `Successfully unlocked ${unlockedAmount} EHBGC`,
            data: {
                unlockedAmount: unlockedAmount,
                availableBalance: wallet.balance
            }
        });

    } catch (error) {
        console.error('Unlock wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlock wallet amount'
        });
    }
});

// POST /api/wallet/deposit - Deposit funds
router.post('/deposit', auth, walletLimiter, async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: 0,
                currency: 'EHBGC'
            });
        }

        // Simulate payment processing
        // In real implementation, this would integrate with payment gateway
        const paymentSuccess = true; // Mock payment success

        if (!paymentSuccess) {
            return res.status(400).json({
                success: false,
                message: 'Payment failed'
            });
        }

        wallet.balance += amount;
        wallet.updatedAt = new Date();

        // Add transaction record
        wallet.transactions.push({
            type: 'deposit',
            amount: amount,
            description: `Deposited ${amount} EHBGC via ${paymentMethod || 'wallet'}`,
            timestamp: new Date()
        });

        await wallet.save();

        res.json({
            success: true,
            message: `Successfully deposited ${amount} EHBGC`,
            data: {
                newBalance: wallet.balance,
                depositedAmount: amount
            }
        });

    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process deposit'
        });
    }
});

// POST /api/wallet/withdraw - Withdraw funds
router.post('/withdraw', auth, walletLimiter, async (req, res) => {
    try {
        const { amount, withdrawalMethod } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const availableBalance = wallet.balance - wallet.lockedAmount;

        if (availableBalance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient available balance'
            });
        }

        wallet.balance -= amount;
        wallet.updatedAt = new Date();

        // Add transaction record
        wallet.transactions.push({
            type: 'withdrawal',
            amount: amount,
            description: `Withdrew ${amount} EHBGC via ${withdrawalMethod || 'wallet'}`,
            timestamp: new Date()
        });

        await wallet.save();

        res.json({
            success: true,
            message: `Successfully withdrew ${amount} EHBGC`,
            data: {
                newBalance: wallet.balance,
                withdrawnAmount: amount
            }
        });

    } catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process withdrawal'
        });
    }
});

// GET /api/wallet/transactions - Get transaction history
router.get('/transactions', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type } = req.query;

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.json({
                success: true,
                transactions: [],
                totalPages: 0,
                currentPage: page,
                totalTransactions: 0
            });
        }

        let transactions = wallet.transactions;

        // Filter by type if specified
        if (type) {
            transactions = transactions.filter(t => t.type === type);
        }

        // Sort by timestamp (newest first)
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = transactions.slice(startIndex, endIndex);

        res.json({
            success: true,
            transactions: paginatedTransactions,
            totalPages: Math.ceil(transactions.length / limit),
            currentPage: page,
            totalTransactions: transactions.length
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction history'
        });
    }
});

module.exports = router;
