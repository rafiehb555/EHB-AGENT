const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

class WalletProcessor {
  constructor() {
    this.isProcessing = false;
    this.pendingTransactions = [];
  }

  // Process wallet-based payment
  async processWalletPayment(orderData) {
    try {
      console.log('💳 Processing wallet payment for order:', orderData.orderId);

      // Step 1: Validate order data
      const validation = await this.validateOrder(orderData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 2: Check buyer wallet balance
      const balanceCheck = await this.checkWalletBalance(orderData.buyer.walletAddress, orderData.totalPrice);
      if (!balanceCheck.sufficient) {
        throw new Error('Insufficient wallet balance');
      }

      // Step 3: Create blockchain transaction
      const transaction = await this.createBlockchainTransaction(orderData);
      if (!transaction.success) {
        throw new Error('Blockchain transaction failed');
      }

      // Step 4: Update order with payment info
      const order = await Order.findOne({ orderId: orderData.orderId });
      await order.processPayment({
        method: 'wallet',
        transactionHash: transaction.hash,
        walletTransaction: {
          from: orderData.buyer.walletAddress,
          to: orderData.seller.walletAddress,
          amount: orderData.totalPrice,
          gasUsed: transaction.gasUsed,
          blockNumber: transaction.blockNumber
        }
      });

      // Step 5: Calculate and distribute commission
      await this.distributeCommission(order);

      // Step 6: Update product inventory
      await this.updateInventory(orderData.product.id, orderData.quantity);

      console.log('✅ Wallet payment processed successfully');
      return {
        success: true,
        transactionHash: transaction.hash,
        orderId: orderData.orderId
      };

    } catch (error) {
      console.error('❌ Wallet payment processing error:', error);
      throw error;
    }
  }

  // Validate order data
  async validateOrder(orderData) {
    try {
      // Check if product exists and is in stock
      const product = await Product.findById(orderData.product.id);
      if (!product) {
        return { valid: false, error: 'Product not found' };
      }

      if (!product.inStock) {
        return { valid: false, error: 'Product out of stock' };
      }

      if (product.stock < orderData.quantity) {
        return { valid: false, error: 'Insufficient stock' };
      }

      // Check if seller exists and is verified
      const seller = await Seller.findById(orderData.seller.userId);
      if (!seller) {
        return { valid: false, error: 'Seller not found' };
      }

      // Validate price
      if (orderData.totalPrice !== product.price * orderData.quantity) {
        return { valid: false, error: 'Price mismatch' };
      }

      return { valid: true };

    } catch (error) {
      console.error('Order validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  // Check wallet balance (simulated)
  async checkWalletBalance(walletAddress, amount) {
    try {
      // In production, this would query the blockchain
      const balance = await this.getWalletBalance(walletAddress);
      return {
        sufficient: balance >= amount,
        balance: balance,
        required: amount
      };
    } catch (error) {
      console.error('Balance check error:', error);
      return { sufficient: false, balance: 0, required: amount };
    }
  }

  // Get wallet balance (simulated)
  async getWalletBalance(walletAddress) {
    // In production, this would query the blockchain
    // For now, return a simulated balance
    return Math.random() * 1000000 + 10000; // Random balance between 10k and 1M
  }

  // Create blockchain transaction (simulated)
  async createBlockchainTransaction(orderData) {
    try {
      // Simulate blockchain transaction
      const transactionHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
      const gasUsed = Math.floor(Math.random() * 100000) + 50000;
      const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        hash: transactionHash,
        gasUsed: gasUsed,
        blockNumber: blockNumber
      };

    } catch (error) {
      console.error('Blockchain transaction error:', error);
      return { success: false, error: error.message };
    }
  }

  // Distribute commission
  async distributeCommission(order) {
    try {
      console.log('💰 Distributing commission for order:', order.orderId);

      // Calculate commission breakdown
      const commission = order.calculateCommission();

      // Create commission distribution transaction
      const distributionResult = await order.distributeCommission();

      // Update seller's earnings
      await this.updateSellerEarnings(order.seller.userId, commission.sellerAmount);

      // Update platform revenue
      await this.updatePlatformRevenue(commission.platformFee);

      // Update franchise earnings
      await this.updateFranchiseEarnings(commission.franchiseCommission);

      console.log('✅ Commission distributed successfully');
      return distributionResult;

    } catch (error) {
      console.error('Commission distribution error:', error);
      throw error;
    }
  }

  // Update seller earnings
  async updateSellerEarnings(sellerId, amount) {
    try {
      const seller = await Seller.findById(sellerId);
      if (seller) {
        seller.totalEarnings = (seller.totalEarnings || 0) + amount;
        seller.totalOrders = (seller.totalOrders || 0) + 1;
        await seller.save();
      }
    } catch (error) {
      console.error('Update seller earnings error:', error);
    }
  }

  // Update platform revenue
  async updatePlatformRevenue(amount) {
    try {
      // In production, this would update platform statistics
      console.log(`📊 Platform revenue updated: +${amount} PKR`);
    } catch (error) {
      console.error('Update platform revenue error:', error);
    }
  }

  // Update franchise earnings
  async updateFranchiseEarnings(amount) {
    try {
      // In production, this would update franchise statistics
      console.log(`🏢 Franchise earnings updated: +${amount} PKR`);
    } catch (error) {
      console.error('Update franchise earnings error:', error);
    }
  }

  // Update product inventory
  async updateInventory(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      if (product) {
        product.stock = Math.max(0, product.stock - quantity);
        product.inStock = product.stock > 0;
        await product.save();
      }
    } catch (error) {
      console.error('Update inventory error:', error);
    }
  }

  // Process refund
  async processRefund(orderId, reason) {
    try {
      console.log('🔄 Processing refund for order:', orderId);

      const order = await Order.findOne({ orderId });
      if (!order) {
        throw new Error('Order not found');
      }

      // Create refund transaction
      const refundTransaction = await this.createRefundTransaction(order);
      if (!refundTransaction.success) {
        throw new Error('Refund transaction failed');
      }

      // Update order status
      await order.updateStatus('refunded', `Refund processed: ${reason}`, 'system');

      // Update payment status
      order.payment.status = 'refunded';
      order.payment.refundedAt = new Date();
      await order.save();

      // Restore inventory
      await this.restoreInventory(order.product.id, order.quantity);

      console.log('✅ Refund processed successfully');
      return {
        success: true,
        refundHash: refundTransaction.hash,
        orderId: orderId
      };

    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }

  // Create refund transaction (simulated)
  async createRefundTransaction(order) {
    try {
      const refundHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;

      // Simulate refund delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        hash: refundHash
      };

    } catch (error) {
      console.error('Refund transaction error:', error);
      return { success: false, error: error.message };
    }
  }

  // Restore inventory
  async restoreInventory(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      if (product) {
        product.stock += quantity;
        product.inStock = product.stock > 0;
        await product.save();
      }
    } catch (error) {
      console.error('Restore inventory error:', error);
    }
  }

  // Get payment statistics
  async getPaymentStats(period = 'month') {
    try {
      const dateFilter = {};
      const now = new Date();

      if (period === 'week') {
        dateFilter.$gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        dateFilter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'year') {
        dateFilter.$gte = new Date(now.getFullYear(), 0, 1);
      }

      const stats = await Order.aggregate([
        {
          $match: {
            'payment.status': 'completed',
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            totalCommission: { $sum: '$commission.sellerAmount' },
            totalPlatformFee: { $sum: '$commission.platformFee' },
            totalFranchiseCommission: { $sum: '$commission.franchiseCommission' }
          }
        }
      ]);

      return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalPlatformFee: 0,
        totalFranchiseCommission: 0
      };

    } catch (error) {
      console.error('Get payment stats error:', error);
      return null;
    }
  }

  // Process batch payments
  async processBatchPayments(orders) {
    try {
      console.log(`💳 Processing batch payments for ${orders.length} orders`);

      const results = [];
      for (const order of orders) {
        try {
          const result = await this.processWalletPayment(order);
          results.push({ orderId: order.orderId, success: true, result });
        } catch (error) {
          results.push({ orderId: order.orderId, success: false, error: error.message });
        }
      }

      console.log(`✅ Batch processing completed: ${results.filter(r => r.success).length}/${orders.length} successful`);
      return results;

    } catch (error) {
      console.error('Batch payment processing error:', error);
      throw error;
    }
  }
}

module.exports = new WalletProcessor();
