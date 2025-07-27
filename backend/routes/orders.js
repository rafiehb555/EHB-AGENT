const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for orders
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many order requests, please try again later.'
});

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    products: [{
        name: String,
        quantity: Number,
        price: Number,
        productId: String
    }],
    deliveryTime: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        default: 'auto-detected'
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'wallet'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', orderSchema);

// Generate unique order ID
function generateOrderId() {
    return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// POST /api/orders - Create new order
router.post('/', auth, orderLimiter, async (req, res) => {
    try {
        const { products, deliveryTime, location, total, paymentMethod } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Products are required'
            });
        }

        if (!deliveryTime) {
            return res.status(400).json({
                success: false,
                message: 'Delivery time is required'
            });
        }

        if (!total || total <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid total amount is required'
            });
        }

        // Check wallet balance (mock for now)
        const walletBalance = 100; // This should come from wallet service
        if (walletBalance < total) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. You need ${total} EHBGC to place this order.`
            });
        }

        // Create order
        const order = new Order({
            userId,
            products,
            deliveryTime: new Date(deliveryTime),
            location: location || 'auto-detected',
            total,
            paymentMethod: paymentMethod || 'wallet',
            orderId: generateOrderId()
        });

        await order.save();

        // Log activity
        console.log(`Order created: ${order.orderId} by user ${userId}`);

        res.status(201).json({
            success: true,
            orderId: order.orderId,
            message: 'Order placed successfully',
            data: {
                orderId: order.orderId,
                status: order.status,
                total: order.total,
                deliveryTime: order.deliveryTime
            }
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});

// GET /api/orders/history - Get user's order history
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Order.countDocuments(query);

        res.json({
            success: true,
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalOrders: count
        });

    } catch (error) {
        console.error('Order history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order history'
        });
    }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.id,
            userId: req.user.id
        });

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
            message: 'Failed to fetch order'
        });
    }
});

// POST /api/orders/:id/cancel - Cancel order
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.id,
            userId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel delivered order'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled'
            });
        }

        order.status = 'cancelled';
        order.updatedAt = new Date();
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: {
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findOne({ orderId: req.params.id });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        order.updatedAt = new Date();
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
});

module.exports = router;
