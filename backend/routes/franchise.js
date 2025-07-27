const express = require('express');
const router = express.Router();
const Franchise = require('../models/Franchise');
const Wallet = require('../models/Wallet');
const blockchainService = require('../services/blockchainService');

// Get all franchises
router.get('/', async (req, res) => {
  try {
    const { status, type, ownerId, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (ownerId) query['owner.userId'] = ownerId;

    const franchises = await Franchise.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Franchise.countDocuments(query);

    res.json({
      success: true,
      franchises,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get franchises error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get franchises'
    });
  }
});

// Get franchise by ID
router.get('/:franchiseId', async (req, res) => {
  try {
    const { franchiseId } = req.params;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    res.json({
      success: true,
      franchise
    });
  } catch (error) {
    console.error('Get franchise error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get franchise'
    });
  }
});

// Create new franchise application
router.post('/apply', async (req, res) => {
  try {
    const {
      name,
      type,
      category,
      description,
      owner,
      location,
      financial
    } = req.body;

    // Generate unique franchise ID
    const franchiseId = `FR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create franchise record
    const franchise = new Franchise({
      franchiseId,
      name,
      type,
      category,
      description,
      owner,
      location,
      financial,
      status: 'pending',
      approvalInfo: {
        submittedAt: new Date()
      }
    });

    await franchise.save();

    // Create wallet for franchise owner if doesn't exist
    let wallet = await Wallet.findByUserId(owner.userId);
    if (!wallet) {
      const walletResult = await blockchainService.generateWallet(owner.userId, 'franchise');
      if (walletResult.success) {
        wallet = await Wallet.findByUserId(owner.userId);
      }
    }

    res.json({
      success: true,
      franchise,
      message: 'Franchise application submitted successfully'
    });
  } catch (error) {
    console.error('Create franchise error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create franchise application'
    });
  }
});

// Approve franchise
router.post('/:franchiseId/approve', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { approvedBy, comments } = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    franchise.status = 'approved';
    franchise.approvalInfo.approvedAt = new Date();
    franchise.approvalInfo.approvedBy = approvedBy;

    await franchise.save();

    // Add announcement
    await franchise.addAnnouncement({
      title: 'Franchise Approved',
      message: `Congratulations! Your franchise application for ${franchise.name} has been approved.`,
      priority: 'high',
      createdAt: new Date()
    });

    res.json({
      success: true,
      franchise,
      message: 'Franchise approved successfully'
    });
  } catch (error) {
    console.error('Approve franchise error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve franchise'
    });
  }
});

// Reject franchise
router.post('/:franchiseId/reject', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { rejectedBy, reason } = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    franchise.status = 'rejected';
    franchise.approvalInfo.rejectionReason = reason;

    await franchise.save();

    // Add announcement
    await franchise.addAnnouncement({
      title: 'Franchise Application Update',
      message: `Your franchise application for ${franchise.name} has been reviewed. Please contact support for more information.`,
      priority: 'medium',
      createdAt: new Date()
    });

    res.json({
      success: true,
      franchise,
      message: 'Franchise rejected'
    });
  } catch (error) {
    console.error('Reject franchise error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject franchise'
    });
  }
});

// Update franchise performance
router.put('/:franchiseId/performance', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const performanceData = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    // Update performance metrics
    Object.assign(franchise.performance, performanceData);

    // Calculate profit margin
    await franchise.calculateProfitMargin();

    await franchise.save();

    res.json({
      success: true,
      franchise,
      message: 'Performance updated successfully'
    });
  } catch (error) {
    console.error('Update performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update performance'
    });
  }
});

// Add employee to franchise
router.post('/:franchiseId/employees', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const employee = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    await franchise.addEmployee(employee);

    res.json({
      success: true,
      franchise,
      message: 'Employee added successfully'
    });
  } catch (error) {
    console.error('Add employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add employee'
    });
  }
});

// Add service to franchise
router.post('/:franchiseId/services', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const service = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    await franchise.addService(service);

    res.json({
      success: true,
      franchise,
      message: 'Service added successfully'
    });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add service'
    });
  }
});

// Process franchise payment
router.post('/:franchiseId/payment', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { amount, type, currency = 'EHB' } = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    // Get franchise owner wallet
    const wallet = await Wallet.findByUserId(franchise.owner.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Franchise owner wallet not found'
      });
    }

    // Check if payment can be made
    const canTransfer = wallet.canTransfer(amount, currency);
    if (!canTransfer.canTransfer) {
      return res.status(400).json({
        success: false,
        error: canTransfer.reason
      });
    }

    // Process payment
    const payment = {
      type,
      amount: parseFloat(amount),
      dueDate: new Date(),
      status: 'paid',
      paidDate: new Date()
    };

    await franchise.addPayment(payment);

    // Transfer tokens from franchise wallet to company wallet
    const companyWallet = await Wallet.findOne({ walletType: 'company' });
    if (companyWallet) {
      await blockchainService.transferTokens(
        wallet.walletAddress,
        companyWallet.walletAddress,
        amount,
        currency,
        { description: `Franchise ${type} payment for ${franchise.name}` }
      );
    }

    res.json({
      success: true,
      payment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment'
    });
  }
});

// Get franchise statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Franchise.getFranchiseStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get franchise stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get franchise statistics'
    });
  }
});

// Get top performing franchises
router.get('/top-performers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topFranchises = await Franchise.getTopPerformers(parseInt(limit));

    res.json({
      success: true,
      franchises: topFranchises
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top performers'
    });
  }
});

// Get franchises by type
router.get('/types/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const franchises = await Franchise.findByType(type);

    res.json({
      success: true,
      franchises
    });
  } catch (error) {
    console.error('Get franchises by type error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get franchises by type'
    });
  }
});

// Get franchises by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;

    const franchises = await Franchise.findByStatus(status);

    res.json({
      success: true,
      franchises
    });
  } catch (error) {
    console.error('Get franchises by status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get franchises by status'
    });
  }
});

// Get franchises by owner
router.get('/owner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const franchises = await Franchise.findByOwner(userId);

    res.json({
      success: true,
      franchises
    });
  } catch (error) {
    console.error('Get franchises by owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get franchises by owner'
    });
  }
});

// Get nearby franchises
router.post('/nearby', async (req, res) => {
  try {
    const { coordinates, maxDistance = 10000 } = req.body;

    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates are required'
      });
    }

    const nearbyFranchises = await Franchise.findNearby(coordinates, maxDistance);

    res.json({
      success: true,
      franchises: nearbyFranchises,
      coordinates,
      maxDistance
    });
  } catch (error) {
    console.error('Get nearby franchises error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby franchises'
    });
  }
});

// Update franchise settings
router.put('/:franchiseId/settings', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { settings } = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    // Update settings
    Object.assign(franchise.settings, settings);

    await franchise.save();

    res.json({
      success: true,
      franchise,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update franchise settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update franchise settings'
    });
  }
});

// Add support ticket
router.post('/:franchiseId/support', async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { subject, description, priority = 'medium' } = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    const ticket = {
      ticketId: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subject,
      description,
      priority,
      status: 'open',
      createdAt: new Date()
    };

    await franchise.addSupportTicket(ticket);

    res.json({
      success: true,
      ticket,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
});

// Get franchise announcements
router.get('/:franchiseId/announcements', async (req, res) => {
  try {
    const { franchiseId } = req.params;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    res.json({
      success: true,
      announcements: franchise.communication.announcements
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get announcements'
    });
  }
});

// Mark announcement as read
router.post('/:franchiseId/announcements/:announcementId/read', async (req, res) => {
  try {
    const { franchiseId, announcementId } = req.params;
    const { userId } = req.body;

    const franchise = await Franchise.findOne({ franchiseId });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }

    const announcement = franchise.communication.announcements.id(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    if (!announcement.readBy.includes(userId)) {
      announcement.readBy.push(userId);
      await franchise.save();
    }

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Mark announcement as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark announcement as read'
    });
  }
});

module.exports = router;
