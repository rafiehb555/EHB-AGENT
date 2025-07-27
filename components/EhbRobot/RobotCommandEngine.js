// EHB Robot Command Engine - Central Processing Unit
class RobotCommandEngine {
    constructor() {
        this.actions = null;
        this.timeParser = null;
        this.chatHistory = [];
        this.maxHistoryLength = 10;
        this.isProcessing = false;
        this.init();
    }

    init() {
        // Initialize dependencies
        if (window.RobotActions) {
            this.actions = new window.RobotActions();
        }
        if (window.TimeParser) {
            this.timeParser = new window.TimeParser();
        }

        console.log('🤖 EHB Robot Command Engine initialized');
    }

    // Main command processing function
    async processCommand(input, context = {}) {
        if (this.isProcessing) {
            return {
                success: false,
                message: "I'm still processing your previous request. Please wait a moment."
            };
        }

        this.isProcessing = true;

        try {
            console.log('🔍 Processing command:', input);

            // Add to chat history
            this.addToHistory('user', input);

            // Show processing indicator
            this.showProcessingIndicator();

            // Process the command
            const result = await this.executeCommand(input, context);

            // Add bot response to history
            this.addToHistory('bot', result.message);

            // Hide processing indicator
            this.hideProcessingIndicator();

            // Handle special actions
            if (result.action) {
                await this.handleSpecialAction(result.action, result.data);
            }

            return result;

        } catch (error) {
            console.error('❌ Command processing error:', error);
            this.hideProcessingIndicator();

            const errorMessage = "Sorry, I encountered an error while processing your request.";
            this.addToHistory('bot', errorMessage);

            return {
                success: false,
                message: errorMessage
            };
        } finally {
            this.isProcessing = false;
        }
    }

    // Execute command with real backend integration
    async executeCommand(input, context) {
        if (!window.RobotCommands) {
            return {
                success: false,
                message: "Command system not available. Please refresh the page."
            };
        }

        // Initialize robot commands if not already done
        if (!this.robotCommands) {
            this.robotCommands = new window.RobotCommands();
        }

        return await this.robotCommands.processCommand(input, context);
    }

    // Handle special actions like navigation
    async handleSpecialAction(action, data) {
        switch (action) {
            case 'navigation':
                await this.handleNavigation(data);
                break;
            case 'order_placed':
                await this.handleOrderPlaced(data);
                break;
            case 'wallet_displayed':
                await this.handleWalletDisplayed(data);
                break;
            case 'search_completed':
                await this.handleSearchCompleted(data);
                break;
            default:
                console.log('No special action handler for:', action);
        }
    }

    // Handle navigation actions
    async handleNavigation(data) {
        if (data && data.page) {
            console.log('🧭 Navigating to:', data.page.path);

            // Show navigation confirmation
            this.showNavigationConfirmation(data.page.title);

            // Simulate navigation delay
            setTimeout(() => {
                if (window.location) {
                    window.location.href = data.page.path;
                }
            }, 2000);
        }
    }

    // Handle order placement
    async handleOrderPlaced(data) {
        if (data) {
            console.log('📦 Order placed:', data);

            // Show order confirmation
            this.showOrderConfirmation(data);

            // Update order history
            if (this.actions) {
                const history = this.actions.getHistory();
                console.log('📋 Updated order history:', history.orders);
            }
        }
    }

    // Handle wallet display
    async handleWalletDisplayed(data) {
        if (data) {
            console.log('💰 Wallet displayed:', data);

            // Could trigger wallet-related UI updates
            this.showWalletInfo(data);
        }
    }

    // Handle search completion
    async handleSearchCompleted(data) {
        if (data) {
            console.log('🔍 Search completed:', data);

            // Could trigger search results display
            this.showSearchResults(data);
        }
    }

    // Add message to chat history
    addToHistory(sender, message) {
        const historyEntry = {
            id: Date.now(),
            sender,
            message,
            timestamp: new Date().toISOString()
        };

        this.chatHistory.push(historyEntry);

        // Keep only last N messages
        if (this.chatHistory.length > this.maxHistoryLength) {
            this.chatHistory = this.chatHistory.slice(-this.maxHistoryLength);
        }

        // Store in localStorage for persistence
        this.saveHistoryToStorage();
    }

    // Get chat history
    getHistory() {
        return this.chatHistory;
    }

    // Clear chat history
    clearHistory() {
        this.chatHistory = [];
        this.saveHistoryToStorage();
    }

    // Save history to localStorage
    saveHistoryToStorage() {
        try {
            localStorage.setItem('ehb_robot_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.warn('Could not save chat history to localStorage:', error);
        }
    }

    // Load history from localStorage
    loadHistoryFromStorage() {
        try {
            const stored = localStorage.getItem('ehb_robot_chat_history');
            if (stored) {
                this.chatHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Could not load chat history from localStorage:', error);
        }
    }

    // Show processing indicator
    showProcessingIndicator() {
        const modal = document.getElementById('ehb-robot-modal');
        if (modal) {
            const indicator = document.createElement('div');
            indicator.id = 'processing-indicator';
            indicator.className = 'processing-indicator';
            indicator.innerHTML = `
                <div class="processing-spinner"></div>
                <div class="processing-text">Processing your request...</div>
            `;

            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(indicator);
            }
        }
    }

    // Hide processing indicator
    hideProcessingIndicator() {
        const indicator = document.getElementById('processing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Show navigation confirmation
    showNavigationConfirmation(pageTitle) {
        const modal = document.getElementById('ehb-robot-modal');
        if (modal) {
            const confirmation = document.createElement('div');
            confirmation.id = 'navigation-confirmation';
            confirmation.className = 'action-confirmation';
            confirmation.innerHTML = `
                <div class="confirmation-icon">🧭</div>
                <div class="confirmation-text">Navigating to ${pageTitle}...</div>
                <div class="confirmation-progress"></div>
            `;

            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(confirmation);

                // Remove after 2 seconds
                setTimeout(() => {
                    if (confirmation.parentNode) {
                        confirmation.remove();
                    }
                }, 2000);
            }
        }
    }

    // Show order confirmation
    showOrderConfirmation(orderData) {
        const modal = document.getElementById('ehb-robot-modal');
        if (modal) {
            const confirmation = document.createElement('div');
            confirmation.id = 'order-confirmation';
            confirmation.className = 'action-confirmation success';
            confirmation.innerHTML = `
                <div class="confirmation-icon">✅</div>
                <div class="confirmation-text">Order confirmed!</div>
                <div class="confirmation-details">
                    Order ID: ${orderData.orderId || 'N/A'}<br>
                    Status: ${orderData.status || 'Confirmed'}
                </div>
            `;

            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(confirmation);

                // Remove after 3 seconds
                setTimeout(() => {
                    if (confirmation.parentNode) {
                        confirmation.remove();
                    }
                }, 3000);
            }
        }
    }

    // Show wallet info
    showWalletInfo(walletData) {
        const modal = document.getElementById('ehb-robot-modal');
        if (modal) {
            const info = document.createElement('div');
            info.id = 'wallet-info';
            info.className = 'action-confirmation info';
            info.innerHTML = `
                <div class="confirmation-icon">💰</div>
                <div class="confirmation-text">Wallet Information</div>
                <div class="confirmation-details">
                    Balance: ${walletData.currency} ${walletData.balance.toFixed(2)}
                </div>
            `;

            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(info);

                // Remove after 3 seconds
                setTimeout(() => {
                    if (info.parentNode) {
                        info.remove();
                    }
                }, 3000);
            }
        }
    }

    // Show search results
    showSearchResults(searchData) {
        const modal = document.getElementById('ehb-robot-modal');
        if (modal) {
            const results = document.createElement('div');
            results.id = 'search-results';
            results.className = 'action-confirmation info';
            results.innerHTML = `
                <div class="confirmation-icon">🔍</div>
                <div class="confirmation-text">Search Results</div>
                <div class="confirmation-details">
                    Found ${searchData.results.length} product(s) for "${searchData.query}"
                </div>
            `;

            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(results);

                // Remove after 3 seconds
                setTimeout(() => {
                    if (results.parentNode) {
                        results.remove();
                    }
                }, 3000);
            }
        }
    }

    // Get command suggestions based on context
    getCommandSuggestions() {
        return [
            "Order 2 cold drinks at 6pm",
            "Open GoSellr",
            "Show my wallet",
            "Search for pizza",
            "Navigate to dashboard",
            "What can you do?"
        ];
    }

    // Validate command
    validateCommand(input) {
        if (!input || input.trim().length === 0) {
            return {
                valid: false,
                message: "Please provide a command."
            };
        }

        if (input.trim().length < 3) {
            return {
                valid: false,
                message: "Command too short. Please provide more details."
            };
        }

        return {
            valid: true,
            message: null
        };
    }

    // Get system status
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            historyLength: this.chatHistory.length,
            actionsAvailable: !!this.actions,
            timeParserAvailable: !!this.timeParser
        };
    }

    // Reset engine
    reset() {
        this.isProcessing = false;
        this.clearHistory();
        console.log('🤖 EHB Robot Command Engine reset');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotCommandEngine;
}

// Make globally available
window.RobotCommandEngine = RobotCommandEngine;
