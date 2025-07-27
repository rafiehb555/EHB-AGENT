const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const walletProcessor = require('../payment/walletProcessor');

// POST: Place a new order
router.post('/place', async (req, res) => {
  try {
    const {
      buyer,
      productId,
      quantity = 1,
      deliveryAddress,
      deliveryMethod = 'standard',
      paymentMethod = 'wallet'
    } = req.body;

    if (!buyer || !productId || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: buyer, productId, deliveryAddress'
      });
    }

    // Get product details
    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (!product.inStock || product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product out of stock or insufficient quantity'
      });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Calculate total price
    const unitPrice = product.price;
    const totalPrice = unitPrice * quantity;

    // Create order
    const order = new Order({
      orderId,
      buyer: {
        userId: buyer.userId,
        walletAddress: buyer.walletAddress,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        location: buyer.location
      },
      seller: {
        userId: product.seller._id,
        walletAddress: product.seller.walletAddress,
        name: product.seller.name,
        location: product.seller.location,
        sqlLevel: product.seller.sqlLevel
      },
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        sqlLevel: product.sqlLevel,
        category: product.category,
        images: product.images
      },
      quantity,
      unitPrice,
      totalPrice,
      currency: product.currency,
      delivery: {
        address: deliveryAddress,
        method: deliveryMethod
      },
      payment: {
        method: paymentMethod
      }
    });

    // Calculate commission
    order.calculateCommission();

    // Add initial timeline entry
    order.timeline.push({
      status: 'order_placed',
      description: 'Order placed successfully',
      updatedBy: buyer.userId
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order.orderId,
        totalPrice: order.totalPrice,
        commission: order.commission,
        estimatedDelivery: order.delivery.estimatedDelivery
      }
    });

  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Process payment for order
router.post('/:orderId/pay', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { walletAddress, paymentMethod = 'wallet' } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Process wallet payment
    const paymentResult = await walletProcessor.processWalletPayment({
      orderId: order.orderId,
      buyer: {
        walletAddress: walletAddress || order.buyer.walletAddress
      },
      seller: {
        walletAddress: order.seller.walletAddress
      },
      product: {
        id: order.product.id
      },
      quantity: order.quantity,
      totalPrice: order.totalPrice
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        orderId: order.orderId,
        transactionHash: paymentResult.transactionHash,
        commission: order.commission
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment processing failed'
    });
  }
});

// GET: Get order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get user orders
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = 'buyer', status, page = 1, limit = 10 } = req.query;

    const query = { [`${role}.userId`]: userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: page * 1,
          limit: limit * 1,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT: Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description, updatedBy } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, description, updatedBy);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        timeline: order.timeline
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Process refund
router.post('/:orderId/refund', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const refundResult = await walletProcessor.processRefund(orderId, reason);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: refundResult
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Refund processing failed'
    });
  }
});

// GET: Get commission statistics
router.get('/commission/stats/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { period = 'month' } = req.query;

    const stats = await Order.getCommissionStats(sellerId, period);

    res.json({
      success: true,
      data: {
        sellerId,
        period,
        stats: stats[0] || {
          totalOrders: 0,
          totalCommission: 0,
          totalPlatformFee: 0,
          totalFranchiseCommission: 0
        }
      }
    });

  } catch (error) {
    console.error('Get commission stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get payment statistics
router.get('/payment/stats', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const stats = await walletProcessor.getPaymentStats(period);

    res.json({
      success: true,
      data: {
        period,
        stats
      }
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Add order review
router.post('/:orderId/review', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order must be delivered before review'
      });
    }

    order.review = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await order.save();

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        orderId: order.orderId,
        review: order.review
      }
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get order timeline
router.get('/:orderId/timeline', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        timeline: order.timeline
      }
    });

  } catch (error) {
    console.error('Get order timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Process batch payments
router.post('/batch/pay', async (req, res) => {
  try {
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Orders array is required'
      });
    }

    const results = await walletProcessor.processBatchPayments(orders);

    res.json({
      success: true,
      message: 'Batch payment processing completed',
      data: {
        total: orders.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });

  } catch (error) {
    console.error('Batch payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch payment processing failed'
    });
  }
});

module.exports = router;
