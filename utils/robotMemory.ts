interface UserPreferences {
    userId: string;
    preferences: {
        topProducts: string[];
        topServices: string[];
        usualTimes: string[];
        preferredCategories: string[];
        deliveryAddresses: string[];
        paymentMethods: string[];
        communicationPreferences: 'voice' | 'text' | 'both';
        language: 'english' | 'urdu' | 'auto';
    };
    behavior: {
        orderFrequency: 'low' | 'medium' | 'high';
        averageOrderValue: number;
        preferredDeliveryTime: string;
        commonComplaints: string[];
        satisfactionScore: number;
    };
    history: {
        lastOrderDate: string;
        totalOrders: number;
        favoriteVendors: string[];
        avoidedProducts: string[];
        seasonalPreferences: Record<string, string[]>;
    };
}

interface InteractionLog {
    userId: string;
    input: string;
    actionTaken: string;
    timestamp: string;
    context: any;
    feedback?: 'positive' | 'negative' | 'neutral';
    language: string;
    emotion?: 'happy' | 'sad' | 'angry' | 'neutral';
}

interface SmartSuggestion {
    type: 'product' | 'service' | 'reminder' | 'action';
    title: string;
    description: string;
    confidence: number;
    basedOn: string;
    action?: string;
}

class RobotMemory {
    private userPreferences: Map<string, UserPreferences> = new Map();
    private interactionLogs: Map<string, InteractionLog[]> = new Map();
    private suggestions: Map<string, SmartSuggestion[]> = new Map();

    constructor() {
        console.log('🧠 Robot Memory initialized');
    }

    // Load user preferences
    async loadUserPreferences(userId: string): Promise<UserPreferences | null> {
        try {
            // In real implementation, this would load from database
            const stored = this.userPreferences.get(userId);
            if (stored) {
                return stored;
            }

            // Initialize default preferences
            const defaultPreferences: UserPreferences = {
                userId,
                preferences: {
                    topProducts: [],
                    topServices: [],
                    usualTimes: [],
                    preferredCategories: [],
                    deliveryAddresses: [],
                    paymentMethods: [],
                    communicationPreferences: 'both',
                    language: 'auto'
                },
                behavior: {
                    orderFrequency: 'low',
                    averageOrderValue: 0,
                    preferredDeliveryTime: 'morning',
                    commonComplaints: [],
                    satisfactionScore: 5.0
                },
                history: {
                    lastOrderDate: '',
                    totalOrders: 0,
                    favoriteVendors: [],
                    avoidedProducts: [],
                    seasonalPreferences: {}
                }
            };

            this.userPreferences.set(userId, defaultPreferences);
            return defaultPreferences;
        } catch (error) {
            console.error('Load user preferences error:', error);
            return null;
        }
    }

    // Save user preferences
    async saveUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
        try {
            const existing = await this.loadUserPreferences(userId);
            if (existing) {
                const updated = { ...existing, ...preferences };
                this.userPreferences.set(userId, updated);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Save user preferences error:', error);
            return false;
        }
    }

    // Log user interaction
    async logInteraction(userId: string, input: string, actionTaken: string, context?: any): Promise<void> {
        try {
            const log: InteractionLog = {
                userId,
                input,
                actionTaken,
                timestamp: new Date().toISOString(),
                context: context || {},
                language: this.detectLanguage(input),
                emotion: this.detectEmotion(input)
            };

            if (!this.interactionLogs.has(userId)) {
                this.interactionLogs.set(userId, []);
            }

            this.interactionLogs.get(userId)!.push(log);

            // Update user preferences based on interaction
            await this.updatePreferencesFromInteraction(userId, log);
        } catch (error) {
            console.error('Log interaction error:', error);
        }
    }

    // Get smart suggestions for user
    async getSmartSuggestions(userId: string, context?: string): Promise<SmartSuggestion[]> {
        try {
            const preferences = await this.loadUserPreferences(userId);
            if (!preferences) return [];

            const suggestions: SmartSuggestion[] = [];

            // Product suggestions based on history
            if (preferences.preferences.topProducts.length > 0) {
                suggestions.push({
                    type: 'product',
                    title: `Order ${preferences.preferences.topProducts[0]}`,
                    description: `Based on your frequent orders`,
                    confidence: 0.9,
                    basedOn: 'frequent_orders',
                    action: `order_${preferences.preferences.topProducts[0].toLowerCase()}`
                });
            }

            // Service suggestions
            if (preferences.preferences.topServices.length > 0) {
                suggestions.push({
                    type: 'service',
                    title: `Book ${preferences.preferences.topServices[0]}`,
                    description: `Your preferred service provider`,
                    confidence: 0.8,
                    basedOn: 'frequent_services',
                    action: `book_${preferences.preferences.topServices[0].toLowerCase()}`
                });
            }

            // Time-based suggestions
            const currentTime = new Date().getHours();
            if (currentTime >= 6 && currentTime <= 10) {
                suggestions.push({
                    type: 'reminder',
                    title: 'Morning routine',
                    description: 'Time for your usual morning order?',
                    confidence: 0.7,
                    basedOn: 'time_pattern'
                });
            }

            // Context-based suggestions
            if (context) {
                if (context.includes('order') || context.includes('buy')) {
                    suggestions.push({
                        type: 'action',
                        title: 'Repeat last order',
                        description: 'Quick reorder of your previous items',
                        confidence: 0.6,
                        basedOn: 'context_order',
                        action: 'repeat_last_order'
                    });
                }

                if (context.includes('service') || context.includes('book')) {
                    suggestions.push({
                        type: 'action',
                        title: 'Book last used service',
                        description: 'Reconnect with your previous service provider',
                        confidence: 0.7,
                        basedOn: 'context_service',
                        action: 'book_last_service'
                    });
                }
            }

            return suggestions.sort((a, b) => b.confidence - a.confidence);
        } catch (error) {
            console.error('Get smart suggestions error:', error);
            return [];
        }
    }

    // Get typing suggestions
    async getTypingSuggestions(userId: string, partialInput: string): Promise<string[]> {
        try {
            const preferences = await this.loadUserPreferences(userId);
            if (!preferences) return [];

            const suggestions: string[] = [];
            const inputLower = partialInput.toLowerCase();

            // Product suggestions
            if (inputLower.includes('order')) {
                preferences.preferences.topProducts.forEach(product => {
                    suggestions.push(`Order ${product}`);
                });
            }

            // Service suggestions
            if (inputLower.includes('book') || inputLower.includes('service')) {
                preferences.preferences.topServices.forEach(service => {
                    suggestions.push(`Book ${service} service`);
                });
            }

            // Time suggestions
            if (inputLower.includes('time') || inputLower.includes('when')) {
                suggestions.push('Schedule for tomorrow morning');
                suggestions.push('Book for this weekend');
                suggestions.push('Order for evening delivery');
            }

            // Address suggestions
            if (inputLower.includes('deliver') || inputLower.includes('address')) {
                preferences.preferences.deliveryAddresses.forEach(address => {
                    suggestions.push(`Deliver to ${address}`);
                });
            }

            return suggestions.slice(0, 3); // Return top 3 suggestions
        } catch (error) {
            console.error('Get typing suggestions error:', error);
            return [];
        }
    }

    // Update preferences from interaction
    private async updatePreferencesFromInteraction(userId: string, log: InteractionLog): Promise<void> {
        try {
            const preferences = await this.loadUserPreferences(userId);
            if (!preferences) return;

            // Extract products from order actions
            if (log.actionTaken.includes('order_')) {
                const product = log.actionTaken.replace('order_', '');
                if (!preferences.preferences.topProducts.includes(product)) {
                    preferences.preferences.topProducts.unshift(product);
                    preferences.preferences.topProducts = preferences.preferences.topProducts.slice(0, 5); // Keep top 5
                }
            }

            // Extract services from booking actions
            if (log.actionTaken.includes('book_')) {
                const service = log.actionTaken.replace('book_', '');
                if (!preferences.preferences.topServices.includes(service)) {
                    preferences.preferences.topServices.unshift(service);
                    preferences.preferences.topServices = preferences.preferences.topServices.slice(0, 3); // Keep top 3
                }
            }

            // Update order frequency
            preferences.behavior.totalOrders++;
            if (preferences.behavior.totalOrders > 10) {
                preferences.behavior.orderFrequency = 'high';
            } else if (preferences.behavior.totalOrders > 5) {
                preferences.behavior.orderFrequency = 'medium';
            }

            // Update last order date
            if (log.actionTaken.includes('order')) {
                preferences.history.lastOrderDate = log.timestamp;
            }

            // Save updated preferences
            await this.saveUserPreferences(userId, preferences);
        } catch (error) {
            console.error('Update preferences from interaction error:', error);
        }
    }

    // Detect language from input
    private detectLanguage(input: string): string {
        // Simple language detection
        const urduPattern = /[\u0600-\u06FF]/;
        if (urduPattern.test(input)) {
            return 'urdu';
        }
        return 'english';
    }

    // Detect emotion from input
    private detectEmotion(input: string): 'happy' | 'sad' | 'angry' | 'neutral' {
        const inputLower = input.toLowerCase();

        const happyWords = ['thanks', 'thank you', 'great', 'good', 'awesome', 'perfect', 'love', 'amazing'];
        const sadWords = ['sorry', 'sad', 'disappointed', 'unhappy', 'bad', 'terrible'];
        const angryWords = ['angry', 'mad', 'furious', 'hate', 'terrible', 'awful', 'horrible'];

        if (happyWords.some(word => inputLower.includes(word))) {
            return 'happy';
        } else if (sadWords.some(word => inputLower.includes(word))) {
            return 'sad';
        } else if (angryWords.some(word => inputLower.includes(word))) {
            return 'angry';
        }

        return 'neutral';
    }

    // Get user behavior insights
    async getUserInsights(userId: string): Promise<{
        orderPattern: string;
        favoriteTime: string;
        topCategories: string[];
        satisfactionTrend: string;
        suggestions: string[];
    }> {
        try {
            const preferences = await this.loadUserPreferences(userId);
            if (!preferences) {
                return {
                    orderPattern: 'No data available',
                    favoriteTime: 'Not determined',
                    topCategories: [],
                    satisfactionTrend: 'Neutral',
                    suggestions: []
                };
            }

            const insights = {
                orderPattern: preferences.behavior.orderFrequency,
                favoriteTime: preferences.behavior.preferredDeliveryTime,
                topCategories: preferences.preferences.preferredCategories,
                satisfactionTrend: preferences.behavior.satisfactionScore > 4 ? 'Positive' : 'Needs improvement',
                suggestions: []
            };

            // Generate personalized suggestions
            if (preferences.behavior.orderFrequency === 'low') {
                insights.suggestions.push('Try our weekly subscription for regular items');
            }

            if (preferences.behavior.satisfactionScore < 4) {
                insights.suggestions.push('We\'d love to hear how we can improve your experience');
            }

            if (preferences.preferences.topProducts.length === 0) {
                insights.suggestions.push('Start by ordering your favorite items');
            }

            return insights;
        } catch (error) {
            console.error('Get user insights error:', error);
            return {
                orderPattern: 'Error loading data',
                favoriteTime: 'Unknown',
                topCategories: [],
                satisfactionTrend: 'Unknown',
                suggestions: []
            };
        }
    }

    // Add feedback to interaction
    async addFeedback(userId: string, interactionId: string, feedback: 'positive' | 'negative' | 'neutral'): Promise<boolean> {
        try {
            const userLogs = this.interactionLogs.get(userId);
            if (userLogs) {
                const interaction = userLogs.find(log => log.timestamp === interactionId);
                if (interaction) {
                    interaction.feedback = feedback;
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Add feedback error:', error);
            return false;
        }
    }

    // Get interaction history
    async getInteractionHistory(userId: string, limit: number = 10): Promise<InteractionLog[]> {
        try {
            const userLogs = this.interactionLogs.get(userId) || [];
            return userLogs.slice(-limit).reverse();
        } catch (error) {
            console.error('Get interaction history error:', error);
            return [];
        }
    }

    // Clear user data (for privacy)
    async clearUserData(userId: string): Promise<boolean> {
        try {
            this.userPreferences.delete(userId);
            this.interactionLogs.delete(userId);
            this.suggestions.delete(userId);
            return true;
        } catch (error) {
            console.error('Clear user data error:', error);
            return false;
        }
    }

    // Export user data (for GDPR compliance)
    async exportUserData(userId: string): Promise<any> {
        try {
            const preferences = await this.loadUserPreferences(userId);
            const history = await this.getInteractionHistory(userId, 1000);

            return {
                userId,
                preferences,
                interactionHistory: history,
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Export user data error:', error);
            return null;
        }
    }
}

export default RobotMemory;
