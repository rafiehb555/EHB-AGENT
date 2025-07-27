// EHB Robot Orders API - Real Backend Integration
class RobotOrdersAPI {
    constructor() {
        this.baseURL = '/api';
        this.authToken = null;
        this.userId = null;
        this.init();
    }

    init() {
        // Get auth token from localStorage or session
        this.authToken = localStorage.getItem('ehb_auth_token') || sessionStorage.getItem('ehb_auth_token');
        this.userId = localStorage.getItem('ehb_user_id') || sessionStorage.getItem('ehb_user_id');

        console.log('🤖 Robot Orders API initialized');
    }

    // Set authentication
    setAuth(token, userId) {
        this.authToken = token;
        this.userId = userId;

        // Store in localStorage
        localStorage.setItem('ehb_auth_token', token);
        localStorage.setItem('ehb_user_id', userId);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!(this.authToken && this.userId);
    }

    // Get auth headers
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
            'X-User-ID': this.userId
        };
    }

    // Place real order
    async placeOrder(orderData) {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to place orders');
        }

        try {
            console.log('📦 Placing real order:', orderData);

            // First check wallet balance
            const walletCheck = await this.checkWalletBalance(orderData.total || 0);
            if (!walletCheck.sufficient) {
                throw new Error(`❌ Insufficient balance. You need ${walletCheck.required} EHBGC to place this order.`);
            }

            // Check wallet lock status for VIP users
            const lockCheck = await this.checkWalletLock();
            if (!lockCheck.locked && orderData.requiresLock) {
                throw new Error('⚠️ Please lock required EHBGC to proceed with this order.');
            }

            // Prepare order payload
            const orderPayload = {
                userId: this.userId,
                products: orderData.items,
                deliveryTime: orderData.deliveryTime,
                location: orderData.location || 'auto-detected',
                total: orderData.total,
                paymentMethod: 'wallet',
                status: 'pending'
            };

            // Make API call
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to place order');
            }

            const result = await response.json();

            // Log activity
            await this.logActivity('order_placed', {
                orderId: result.orderId,
                items: orderData.items,
                total: orderData.total
            });

            return {
                success: true,
                orderId: result.orderId,
                message: `✅ Order placed successfully! Order ID: ${result.orderId}`,
                data: result
            };

        } catch (error) {
            console.error('❌ Order placement error:', error);

            // Log failed activity
            await this.logActivity('order_failed', {
                error: error.message,
                orderData: orderData
            });

            throw error;
        }
    }

    // Search products
    async searchProducts(query) {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to search products');
        }

        try {
            console.log('🔍 Searching products:', query);

            const response = await fetch(`${this.baseURL}/products/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to search products');
            }

            const products = await response.json();

            // Log activity
            await this.logActivity('product_search', {
                query: query,
                resultsCount: products.length
            });

            return {
                success: true,
                products: products,
                message: `Found ${products.length} product(s) for "${query}"`
            };

        } catch (error) {
            console.error('❌ Product search error:', error);
            throw error;
        }
    }

    // Check wallet balance
    async checkWalletBalance(requiredAmount = 0) {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to check wallet');
        }

        try {
            const response = await fetch(`${this.baseURL}/wallet/balance?userId=${this.userId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to check wallet balance');
            }

            const walletData = await response.json();
            const balance = walletData.balance || 0;
            const sufficient = balance >= requiredAmount;

            return {
                balance: balance,
                required: requiredAmount,
                sufficient: sufficient,
                currency: walletData.currency || 'EHBGC'
            };

        } catch (error) {
            console.error('❌ Wallet balance check error:', error);
            throw error;
        }
    }

    // Check wallet lock status
    async checkWalletLock() {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to check wallet lock');
        }

        try {
            const response = await fetch(`${this.baseURL}/wallet/locked?userId=${this.userId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to check wallet lock status');
            }

            const lockData = await response.json();

            return {
                locked: lockData.locked || false,
                lockedAmount: lockData.lockedAmount || 0,
                requiredAmount: lockData.requiredAmount || 0
            };

        } catch (error) {
            console.error('❌ Wallet lock check error:', error);
            throw error;
        }
    }

    // Search services
    async searchServices(serviceType, time = null, location = null) {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to search services');
        }

        try {
            console.log('🔧 Searching services:', serviceType);

            const params = new URLSearchParams({
                type: serviceType
            });

            if (time) params.append('time', time);
            if (location) params.append('location', location);

            const response = await fetch(`${this.baseURL}/services/search?${params}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to search services');
            }

            const services = await response.json();

            // Log activity
            await this.logActivity('service_search', {
                serviceType: serviceType,
                time: time,
                resultsCount: services.length
            });

            return {
                success: true,
                services: services,
                message: `Found ${services.length} service provider(s) for ${serviceType}`
            };

        } catch (error) {
            console.error('❌ Service search error:', error);
            throw error;
        }
    }

    // Book service
    async bookService(serviceId, bookingData) {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to book services');
        }

        try {
            console.log('📅 Booking service:', serviceId);

            const bookingPayload = {
                userId: this.userId,
                serviceId: serviceId,
                bookingTime: bookingData.bookingTime,
                location: bookingData.location,
                notes: bookingData.notes
            };

            const response = await fetch(`${this.baseURL}/services/book`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(bookingPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to book service');
            }

            const result = await response.json();

            // Log activity
            await this.logActivity('service_booked', {
                serviceId: serviceId,
                bookingTime: bookingData.bookingTime
            });

            return {
                success: true,
                bookingId: result.bookingId,
                message: `✅ Service booked successfully! Booking ID: ${result.bookingId}`,
                data: result
            };

        } catch (error) {
            console.error('❌ Service booking error:', error);

            // Log failed activity
            await this.logActivity('service_booking_failed', {
                error: error.message,
                serviceId: serviceId
            });

            throw error;
        }
    }

    // Log robot activity
    async logActivity(action, data = {}) {
        try {
            const logPayload = {
                userId: this.userId,
                action: action,
                data: data,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };

            await fetch(`${this.baseURL}/robot-logs`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(logPayload)
            });

        } catch (error) {
            console.warn('Could not log robot activity:', error);
        }
    }

    // Get user profile
    async getUserProfile() {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to access profile');
        }

        try {
            const response = await fetch(`${this.baseURL}/user/profile`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get user profile');
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Get profile error:', error);
            throw error;
        }
    }

    // Get order history
    async getOrderHistory() {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to view order history');
        }

        try {
            const response = await fetch(`${this.baseURL}/orders/history?userId=${this.userId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get order history');
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Get order history error:', error);
            throw error;
        }
    }

    // Cancel order
    async cancelOrder(orderId) {
        if (!this.isAuthenticated()) {
            throw new Error('⚠️ Please log in to cancel orders');
        }

        try {
            const response = await fetch(`${this.baseURL}/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to cancel order');
            }

            const result = await response.json();

            // Log activity
            await this.logActivity('order_cancelled', {
                orderId: orderId
            });

            return {
                success: true,
                message: `✅ Order cancelled successfully`,
                data: result
            };

        } catch (error) {
            console.error('❌ Cancel order error:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotOrdersAPI;
}

// Make globally available
window.RobotOrdersAPI = RobotOrdersAPI;
