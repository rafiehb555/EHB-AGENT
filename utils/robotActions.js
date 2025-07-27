// EHB Robot Actions Dispatcher
class RobotActions {
    constructor() {
        this.currentUser = this.getMockUser();
        this.orderHistory = [];
        this.navigationHistory = [];
        this.init();
    }

    init() {
        // Initialize with mock data
        this.mockProducts = [
            { id: 1, name: 'Cold Drink', price: 2.50, category: 'beverages' },
            { id: 2, name: 'Hot Coffee', price: 3.00, category: 'beverages' },
            { id: 3, name: 'Chips', price: 1.50, category: 'snacks' },
            { id: 4, name: 'Sandwich', price: 5.00, category: 'food' },
            { id: 5, name: 'Pizza', price: 8.00, category: 'food' }
        ];

        this.mockPages = [
            { name: 'dashboard', path: '/', title: 'Dashboard' },
            { name: 'gosellr', path: '/gosellr', title: 'GoSellr' },
            { name: 'wallet', path: '/wallet', title: 'Wallet' },
            { name: 'franchise', path: '/franchise', title: 'Franchise' },
            { name: 'orders', path: '/orders', title: 'Orders' },
            { name: 'profile', path: '/profile', title: 'Profile' },
            { name: 'settings', path: '/settings', title: 'Settings' }
        ];
    }

    getMockUser() {
        return {
            id: 'user_123',
            name: 'Test User',
            email: 'user@ehb.com',
            wallet: {
                balance: 50.00,
                currency: 'USD'
            }
        };
    }

    // Main action dispatcher
    async executeCommand(command, context = {}) {
        try {
            console.log('🤖 Processing command:', command);

            const action = this.parseCommand(command);

            if (!action) {
                return {
                    success: false,
                    message: "I didn't understand that command. Try saying something like 'order a cold drink' or 'open GoSellr'."
                };
            }

            const result = await this.performAction(action, context);
            return result;

        } catch (error) {
            console.error('❌ Command execution error:', error);
            return {
                success: false,
                message: "Sorry, I encountered an error while processing your request."
            };
        }
    }

    // Command parsing logic
    parseCommand(input) {
        const command = input.toLowerCase().trim();

        // Order commands
        if (this.isOrderCommand(command)) {
            return this.parseOrderCommand(command);
        }

        // Navigation commands
        if (this.isNavigationCommand(command)) {
            return this.parseNavigationCommand(command);
        }

        // Wallet commands
        if (this.isWalletCommand(command)) {
            return this.parseWalletCommand(command);
        }

        // Search commands
        if (this.isSearchCommand(command)) {
            return this.parseSearchCommand(command);
        }

        // Help commands
        if (this.isHelpCommand(command)) {
            return this.parseHelpCommand(command);
        }

        return null;
    }

    // Order command detection and parsing
    isOrderCommand(command) {
        const orderKeywords = ['order', 'buy', 'purchase', 'get', 'want', 'need'];
        return orderKeywords.some(keyword => command.includes(keyword));
    }

    parseOrderCommand(command) {
        const orderPattern = /(?:order|buy|purchase|get|want|need)\s+(?:a\s+)?(\d+)?\s*([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+at\s+([^,\s]+(?:\s+[^,\s]+)*))?/i;
        const match = command.match(orderPattern);

        if (!match) return null;

        const quantity = match[1] ? parseInt(match[1]) : 1;
        const item = match[2].trim();
        const time = match[3] ? match[3].trim() : null;

        return {
            type: 'order',
            action: 'placeOrder',
            data: {
                items: [{ name: item, quantity }],
                deliveryTime: time,
                rawCommand: command
            }
        };
    }

    // Navigation command detection and parsing
    isNavigationCommand(command) {
        const navKeywords = ['open', 'go to', 'navigate to', 'show', 'visit', 'take me to'];
        return navKeywords.some(keyword => command.includes(keyword));
    }

    parseNavigationCommand(command) {
        const navPattern = /(?:open|go to|navigate to|show|visit|take me to)\s+([^,\s]+(?:\s+[^,\s]+)*)/i;
        const match = command.match(navPattern);

        if (!match) return null;

        const page = match[1].trim();

        return {
            type: 'navigation',
            action: 'navigateTo',
            data: {
                page: page,
                rawCommand: command
            }
        };
    }

    // Wallet command detection and parsing
    isWalletCommand(command) {
        const walletKeywords = ['wallet', 'balance', 'money', 'account'];
        return walletKeywords.some(keyword => command.includes(keyword));
    }

    parseWalletCommand(command) {
        return {
            type: 'wallet',
            action: 'showWallet',
            data: {
                rawCommand: command
            }
        };
    }

    // Search command detection and parsing
    isSearchCommand(command) {
        const searchKeywords = ['search', 'find', 'look for'];
        return searchKeywords.some(keyword => command.includes(keyword));
    }

    parseSearchCommand(command) {
        const searchPattern = /(?:search|find|look for)\s+(?:for\s+)?([^,\s]+(?:\s+[^,\s]+)*)/i;
        const match = command.match(searchPattern);

        if (!match) return null;

        const query = match[1].trim();

        return {
            type: 'search',
            action: 'searchProducts',
            data: {
                query: query,
                rawCommand: command
            }
        };
    }

    // Help command detection and parsing
    isHelpCommand(command) {
        const helpKeywords = ['help', 'what can you do', 'commands', 'options'];
        return helpKeywords.some(keyword => command.includes(keyword));
    }

    parseHelpCommand(command) {
        return {
            type: 'help',
            action: 'showHelp',
            data: {
                rawCommand: command
            }
        };
    }

    // Action performer
    async performAction(action, context) {
        switch (action.action) {
            case 'placeOrder':
                return await this.placeOrder(action.data);

            case 'navigateTo':
                return await this.navigateTo(action.data);

            case 'showWallet':
                return await this.showWallet(action.data);

            case 'searchProducts':
                return await this.searchProducts(action.data);

            case 'showHelp':
                return await this.showHelp(action.data);

            default:
                return {
                    success: false,
                    message: "Unknown action type."
                };
        }
    }

    // Order placement
    async placeOrder(orderData) {
        try {
            const { items, deliveryTime, rawCommand } = orderData;

            // Parse delivery time
            const parsedTime = deliveryTime ? this.parseTime(deliveryTime) : null;

            // Create order payload
            const orderPayload = {
                userId: this.currentUser.id,
                items: items,
                deliveryTime: parsedTime,
                status: 'pending',
                total: this.calculateOrderTotal(items),
                createdAt: new Date().toISOString()
            };

            // Simulate API call
            const response = await this.mockOrderAPI(orderPayload);

            // Add to history
            this.orderHistory.push(orderPayload);

            return {
                success: true,
                message: `✅ Order placed successfully! ${items.map(item => `${item.quantity}x ${item.name}`).join(', ')}${parsedTime ? ` for ${this.formatTime(parsedTime)}` : ''}`,
                data: response,
                action: 'order_placed'
            };

        } catch (error) {
            console.error('Order placement error:', error);
            return {
                success: false,
                message: "Sorry, I couldn't place your order. Please try again."
            };
        }
    }

    // Navigation
    async navigateTo(navData) {
        try {
            const { page, rawCommand } = navData;

            // Find matching page
            const targetPage = this.mockPages.find(p =>
                p.name.toLowerCase().includes(page.toLowerCase()) ||
                p.title.toLowerCase().includes(page.toLowerCase())
            );

            if (!targetPage) {
                return {
                    success: false,
                    message: `I couldn't find a page called "${page}". Available pages: ${this.mockPages.map(p => p.title).join(', ')}`
                };
            }

            // Add to navigation history
            this.navigationHistory.push({
                page: targetPage.name,
                timestamp: new Date().toISOString()
            });

            // Simulate navigation
            setTimeout(() => {
                if (window.location) {
                    window.location.href = targetPage.path;
                }
            }, 1000);

            return {
                success: true,
                message: `✅ Navigating to ${targetPage.title}...`,
                data: { page: targetPage },
                action: 'navigation'
            };

        } catch (error) {
            console.error('Navigation error:', error);
            return {
                success: false,
                message: "Sorry, I couldn't navigate to that page."
            };
        }
    }

    // Wallet display
    async showWallet(walletData) {
        try {
            const balance = this.currentUser.wallet.balance;
            const currency = this.currentUser.wallet.currency;

            return {
                success: true,
                message: `💰 Your wallet balance: ${currency} ${balance.toFixed(2)}`,
                data: { balance, currency },
                action: 'wallet_displayed'
            };

        } catch (error) {
            console.error('Wallet display error:', error);
            return {
                success: false,
                message: "Sorry, I couldn't access your wallet information."
            };
        }
    }

    // Product search
    async searchProducts(searchData) {
        try {
            const { query, rawCommand } = searchData;

            // Simulate product search
            const results = this.mockProducts.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.category.toLowerCase().includes(query.toLowerCase())
            );

            if (results.length === 0) {
                return {
                    success: true,
                    message: `🔍 No products found for "${query}". Try searching for: beverages, snacks, food`,
                    data: { query, results: [] },
                    action: 'search_completed'
                };
            }

            const productList = results.map(p => `${p.name} (${p.currency || 'USD'} ${p.price})`).join(', ');

            return {
                success: true,
                message: `🔍 Found ${results.length} product(s) for "${query}": ${productList}`,
                data: { query, results },
                action: 'search_completed'
            };

        } catch (error) {
            console.error('Search error:', error);
            return {
                success: false,
                message: "Sorry, I couldn't search for products right now."
            };
        }
    }

    // Help display
    async showHelp(helpData) {
        const helpMessage = `🤖 Here's what I can help you with:

📦 **Ordering**: "Order 2 cold drinks", "Buy chips at 6pm"
🌐 **Navigation**: "Open GoSellr", "Go to wallet", "Show dashboard"
💰 **Wallet**: "Show my balance", "Check wallet"
🔍 **Search**: "Search for pizza", "Find beverages"
❓ **Help**: "What can you do?", "Show commands"

Try saying any of these commands!`;

        return {
            success: true,
            message: helpMessage,
            data: { helpTopics: ['ordering', 'navigation', 'wallet', 'search'] },
            action: 'help_displayed'
        };
    }

    // Time parsing utility
    parseTime(timeString) {
        if (!timeString) return null;

        const now = new Date();
        const time = timeString.toLowerCase();

        // Handle "tomorrow"
        if (time.includes('tomorrow')) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Extract time from "tomorrow 6pm"
            const timeMatch = time.match(/(\d+)(am|pm)/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const period = timeMatch[2].toLowerCase();

                if (period === 'pm' && hour !== 12) hour += 12;
                if (period === 'am' && hour === 12) hour = 0;

                tomorrow.setHours(hour, 0, 0, 0);
                return tomorrow.toISOString();
            }

            return tomorrow.toISOString();
        }

        // Handle "in X hours"
        const hoursMatch = time.match(/in\s+(\d+)\s+hours?/i);
        if (hoursMatch) {
            const hours = parseInt(hoursMatch[1]);
            const future = new Date(now);
            future.setHours(future.getHours() + hours);
            return future.toISOString();
        }

        // Handle specific times like "6pm"
        const timeMatch = time.match(/(\d+)(am|pm)/i);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const period = timeMatch[2].toLowerCase();

            if (period === 'pm' && hour !== 12) hour += 12;
            if (period === 'am' && hour === 12) hour = 0;

            const targetTime = new Date(now);
            targetTime.setHours(hour, 0, 0, 0);

            // If time has passed today, schedule for tomorrow
            if (targetTime <= now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            return targetTime.toISOString();
        }

        return null;
    }

    // Format time for display
    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString();
    }

    // Calculate order total
    calculateOrderTotal(items) {
        return items.reduce((total, item) => {
            const product = this.mockProducts.find(p =>
                p.name.toLowerCase().includes(item.name.toLowerCase())
            );
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    // Mock API call
    async mockOrderAPI(orderPayload) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            orderId: `ORD_${Date.now()}`,
            status: 'confirmed',
            ...orderPayload
        };
    }

    // Get command history
    getHistory() {
        return {
            orders: this.orderHistory,
            navigation: this.navigationHistory
        };
    }

    // Clear history
    clearHistory() {
        this.orderHistory = [];
        this.navigationHistory = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotActions;
}

// Make globally available
window.RobotActions = RobotActions;
