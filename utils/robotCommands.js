// EHB Robot Commands - Real Backend Integration
class RobotCommands {
    constructor() {
        this.api = null;
        this.timeParser = null;
        this.userProfile = null;
        this.confirmationQueue = [];
        this.init();
    }

    init() {
        // Initialize API and time parser
        if (window.RobotOrdersAPI) {
            this.api = new window.RobotOrdersAPI();
        }
        if (window.TimeParser) {
            this.timeParser = new window.TimeParser();
        }

        console.log('🤖 Robot Commands initialized');
    }

    // Main command processor
    async processCommand(input, context = {}) {
        try {
            console.log('🔍 Processing command:', input);

            // Check authentication first
            if (!this.api || !this.api.isAuthenticated()) {
                return {
                    success: false,
                    message: "⚠️ Please log in to use this feature.",
                    requiresAuth: true
                };
            }

            // Parse command type
            const commandType = this.parseCommandType(input);

            switch (commandType.type) {
                case 'order':
                    return await this.handleOrderCommand(commandType.data, context);

                case 'service':
                    return await this.handleServiceCommand(commandType.data, context);

                case 'wallet':
                    return await this.handleWalletCommand(commandType.data, context);

                case 'search':
                    return await this.handleSearchCommand(commandType.data, context);

                case 'navigation':
                    return await this.handleNavigationCommand(commandType.data, context);

                case 'help':
                    return await this.handleHelpCommand(commandType.data, context);

                default:
                    return {
                        success: false,
                        message: "I didn't understand that command. Try saying something like 'order a cold drink' or 'book AC repair'."
                    };
            }

        } catch (error) {
            console.error('❌ Command processing error:', error);
            return {
                success: false,
                message: error.message || "Sorry, I encountered an error while processing your request."
            };
        }
    }

    // Parse command type
    parseCommandType(input) {
        const command = input.toLowerCase().trim();

        // Order commands
        if (this.isOrderCommand(command)) {
            return {
                type: 'order',
                data: this.parseOrderCommand(command)
            };
        }

        // Service commands
        if (this.isServiceCommand(command)) {
            return {
                type: 'service',
                data: this.parseServiceCommand(command)
            };
        }

        // Wallet commands
        if (this.isWalletCommand(command)) {
            return {
                type: 'wallet',
                data: this.parseWalletCommand(command)
            };
        }

        // Search commands
        if (this.isSearchCommand(command)) {
            return {
                type: 'search',
                data: this.parseSearchCommand(command)
            };
        }

        // Navigation commands
        if (this.isNavigationCommand(command)) {
            return {
                type: 'navigation',
                data: this.parseNavigationCommand(command)
            };
        }

        // Help commands
        if (this.isHelpCommand(command)) {
            return {
                type: 'help',
                data: this.parseHelpCommand(command)
            };
        }

        return { type: 'unknown', data: null };
    }

    // Order command detection and parsing
    isOrderCommand(command) {
        const orderKeywords = ['order', 'buy', 'purchase', 'get', 'want', 'need'];
        return orderKeywords.some(keyword => command.includes(keyword));
    }

    parseOrderCommand(command) {
        const orderPattern = /(?:order|buy|purchase|get|want|need)\s+(?:a\s+)?(\d+)?\s*([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+for\s+([^,\s]+(?:\s+[^,\s]+)*))?(?:\s+at\s+([^,\s]+(?:\s+[^,\s]+)*))?/i;
        const match = command.match(orderPattern);

        if (!match) return null;

        const quantity = match[1] ? parseInt(match[1]) : 1;
        const item = match[2].trim();
        const deliveryDate = match[3] ? match[3].trim() : null;
        const deliveryTime = match[4] ? match[4].trim() : null;

        return {
            items: [{ name: item, quantity }],
            deliveryDate,
            deliveryTime,
            rawCommand: command
        };
    }

    // Service command detection and parsing
    isServiceCommand(command) {
        const serviceKeywords = ['book', 'schedule', 'appointment', 'repair', 'service'];
        return serviceKeywords.some(keyword => command.includes(keyword));
    }

    parseServiceCommand(command) {
        const servicePattern = /(?:book|schedule|appointment)\s+(?:a\s+)?([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+(?:for|at)\s+([^,\s]+(?:\s+[^,\s]+)*))?(?:\s+at\s+([^,\s]+(?:\s+[^,\s]+)*))?/i;
        const match = command.match(servicePattern);

        if (!match) return null;

        const serviceType = match[1].trim();
        const date = match[2] ? match[2].trim() : null;
        const time = match[3] ? match[3].trim() : null;

        return {
            serviceType,
            date,
            time,
            rawCommand: command
        };
    }

    // Wallet command detection and parsing
    isWalletCommand(command) {
        const walletKeywords = ['wallet', 'balance', 'money', 'account', 'check'];
        return walletKeywords.some(keyword => command.includes(keyword));
    }

    parseWalletCommand(command) {
        return {
            action: 'check_balance',
            rawCommand: command
        };
    }

    // Search command detection and parsing
    isSearchCommand(command) {
        const searchKeywords = ['search', 'find', 'look for', 'show me'];
        return searchKeywords.some(keyword => command.includes(keyword));
    }

    parseSearchCommand(command) {
        const searchPattern = /(?:search|find|look for|show me)\s+(?:for\s+)?([^,\s]+(?:\s+[^,\s]+)*)/i;
        const match = command.match(searchPattern);

        if (!match) return null;

        const query = match[1].trim();

        return {
            query,
            rawCommand: command
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
            page,
            rawCommand: command
        };
    }

    // Help command detection and parsing
    isHelpCommand(command) {
        const helpKeywords = ['help', 'what can you do', 'commands', 'options'];
        return helpKeywords.some(keyword => command.includes(keyword));
    }

    parseHelpCommand(command) {
        return {
            action: 'show_help',
            rawCommand: command
        };
    }

    // Handle order commands
    async handleOrderCommand(orderData, context) {
        try {
            // Search for products first
            const searchResults = await this.api.searchProducts(orderData.items[0].name);

            if (!searchResults.success || searchResults.products.length === 0) {
                return {
                    success: false,
                    message: `❌ No products found for "${orderData.items[0].name}". Try searching for a different item.`
                };
            }

            // Parse delivery time
            let deliveryTime = null;
            if (orderData.deliveryTime || orderData.deliveryDate) {
                const timeExpression = orderData.deliveryTime || orderData.deliveryDate;
                if (this.timeParser) {
                    const parsedTime = this.timeParser.parseTimeExpression(timeExpression);
                    deliveryTime = parsedTime ? parsedTime.isoString : null;
                }
            }

            // Calculate total (simplified)
            const total = searchResults.products[0].price * orderData.items[0].quantity;

            // Check if user wants to confirm
            if (context.requireConfirmation !== false) {
                const confirmationMessage = `Do you want to order: ${orderData.items[0].quantity}x ${searchResults.products[0].name} for ${total} EHBGC${deliveryTime ? ` (delivery: ${this.formatTime(deliveryTime)})` : ''}?`;

                return {
                    success: true,
                    message: confirmationMessage,
                    requiresConfirmation: true,
                    confirmationData: {
                        type: 'order',
                        products: searchResults.products,
                        orderData: {
                            ...orderData,
                            deliveryTime,
                            total
                        }
                    }
                };
            }

            // Place order directly
            const orderResult = await this.api.placeOrder({
                items: orderData.items,
                deliveryTime,
                total
            });

            return orderResult;

        } catch (error) {
            console.error('Order command error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Handle service commands
    async handleServiceCommand(serviceData, context) {
        try {
            // Search for services
            const searchResults = await this.api.searchServices(serviceData.serviceType, serviceData.time);

            if (!searchResults.success || searchResults.services.length === 0) {
                return {
                    success: false,
                    message: `❌ No service providers found for "${serviceData.serviceType}". Try a different service type.`
                };
            }

            // Parse booking time
            let bookingTime = null;
            if (serviceData.time || serviceData.date) {
                const timeExpression = serviceData.time || serviceData.date;
                if (this.timeParser) {
                    const parsedTime = this.timeParser.parseTimeExpression(timeExpression);
                    bookingTime = parsedTime ? parsedTime.isoString : null;
                }
            }

            // Check if user wants to confirm
            if (context.requireConfirmation !== false) {
                const service = searchResults.services[0];
                const confirmationMessage = `Do you want to book: ${service.name} for ${serviceData.serviceType}${bookingTime ? ` at ${this.formatTime(bookingTime)}` : ''}?`;

                return {
                    success: true,
                    message: confirmationMessage,
                    requiresConfirmation: true,
                    confirmationData: {
                        type: 'service',
                        services: searchResults.services,
                        serviceData: {
                            ...serviceData,
                            bookingTime
                        }
                    }
                };
            }

            // Book service directly
            const bookingResult = await this.api.bookService(searchResults.services[0].id, {
                bookingTime,
                location: 'auto-detected'
            });

            return bookingResult;

        } catch (error) {
            console.error('Service command error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Handle wallet commands
    async handleWalletCommand(walletData, context) {
        try {
            const balanceResult = await this.api.checkWalletBalance();

            return {
                success: true,
                message: `💰 Your wallet balance: ${balanceResult.currency} ${balanceResult.balance.toFixed(2)}`,
                data: balanceResult
            };

        } catch (error) {
            console.error('Wallet command error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Handle search commands
    async handleSearchCommand(searchData, context) {
        try {
            const searchResults = await this.api.searchProducts(searchData.query);

            if (!searchResults.success || searchResults.products.length === 0) {
                return {
                    success: false,
                    message: `❌ No products found for "${searchData.query}". Try searching for something else.`
                };
            }

            const productList = searchResults.products.slice(0, 3).map(p =>
                `${p.name} (${p.currency || 'EHBGC'} ${p.price})`
            ).join(', ');

            return {
                success: true,
                message: `🔍 Found ${searchResults.products.length} product(s) for "${searchData.query}": ${productList}`,
                data: searchResults
            };

        } catch (error) {
            console.error('Search command error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Handle navigation commands
    async handleNavigationCommand(navData, context) {
        try {
            // Map page names to routes
            const pageRoutes = {
                'gosellr': '/gosellr',
                'wallet': '/wallet',
                'dashboard': '/',
                'orders': '/orders',
                'profile': '/profile',
                'settings': '/settings',
                'franchise': '/franchise'
            };

            const targetPage = pageRoutes[navData.page.toLowerCase()];

            if (!targetPage) {
                return {
                    success: false,
                    message: `❌ Page "${navData.page}" not found. Available pages: ${Object.keys(pageRoutes).join(', ')}`
                };
            }

            // Simulate navigation
            setTimeout(() => {
                if (window.location) {
                    window.location.href = targetPage;
                }
            }, 1000);

            return {
                success: true,
                message: `✅ Navigating to ${navData.page}...`,
                action: 'navigation',
                data: { page: navData.page, route: targetPage }
            };

        } catch (error) {
            console.error('Navigation command error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Handle help commands
    async handleHelpCommand(helpData, context) {
        const helpMessage = `🤖 Here's what I can help you with:

📦 **Ordering**: "Order 2 cold drinks at 6pm", "Buy chips tomorrow morning"
🔧 **Services**: "Book AC repair tomorrow at 3pm", "Schedule hairdresser"
💰 **Wallet**: "Show my balance", "Check wallet"
🔍 **Search**: "Search for pizza", "Find beverages"
🌐 **Navigation**: "Open GoSellr", "Go to wallet"
❓ **Help**: "What can you do?", "Show commands"

Try saying any of these commands!`;

        return {
            success: true,
            message: helpMessage,
            data: { helpTopics: ['ordering', 'services', 'wallet', 'search', 'navigation'] }
        };
    }

    // Confirm action
    async confirmAction(confirmationData) {
        try {
            switch (confirmationData.type) {
                case 'order':
                    return await this.api.placeOrder(confirmationData.orderData);

                case 'service':
                    return await this.api.bookService(confirmationData.services[0].id, {
                        bookingTime: confirmationData.serviceData.bookingTime,
                        location: 'auto-detected'
                    });

                default:
                    throw new Error('Unknown confirmation type');
            }
        } catch (error) {
            console.error('Confirmation error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Format time for display
    formatTime(isoString) {
        if (!isoString) return 'as soon as possible';

        const date = new Date(isoString);
        return date.toLocaleString();
    }

    // Get user profile
    async getUserProfile() {
        if (!this.userProfile) {
            try {
                this.userProfile = await this.api.getUserProfile();
            } catch (error) {
                console.error('Failed to get user profile:', error);
            }
        }
        return this.userProfile;
    }

    // Check if user has required permissions
    async checkPermissions(requiredLevel = 'basic') {
        const profile = await this.getUserProfile();
        if (!profile) return false;

        const userLevel = profile.sqlLevel || 'basic';
        const levels = ['basic', 'premium', 'vip', 'admin'];

        return levels.indexOf(userLevel) >= levels.indexOf(requiredLevel);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotCommands;
}

// Make globally available
window.RobotCommands = RobotCommands;
