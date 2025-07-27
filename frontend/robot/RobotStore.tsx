import React, { useState, useEffect } from 'react';

interface RobotPlugin {
    id: string;
    name: string;
    description: string;
    category: 'productivity' | 'health' | 'education' | 'entertainment' | 'business' | 'lifestyle';
    price: number;
    currency: 'EHBGC';
    subscription: 'monthly' | 'yearly' | 'one-time';
    rating: number;
    reviews: number;
    downloads: number;
    features: string[];
    compatibility: string[];
    author: string;
    version: string;
    lastUpdated: string;
    image: string;
    status: 'available' | 'installed' | 'pending';
}

interface RobotStoreProps {
    userId?: string;
    walletAddress?: string;
    onInstallPlugin: (plugin: RobotPlugin) => void;
    onUninstallPlugin: (pluginId: string) => void;
}

const RobotStore: React.FC<RobotStoreProps> = ({
    userId,
    walletAddress,
    onInstallPlugin,
    onUninstallPlugin
}) => {
    const [plugins, setPlugins] = useState<RobotPlugin[]>([]);
    const [filteredPlugins, setFilteredPlugins] = useState<RobotPlugin[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price' | 'newest'>('popular');
    const [loading, setLoading] = useState(false);
    const [userBalance, setUserBalance] = useState(0);

    // Sample robot plugins
    const samplePlugins: RobotPlugin[] = [
        {
            id: 'education-assistant',
            name: 'Education Assistant Bot',
            description: 'AI-powered study companion that helps with homework, exam preparation, and learning new subjects.',
            category: 'education',
            price: 50,
            currency: 'EHBGC',
            subscription: 'monthly',
            rating: 4.8,
            reviews: 127,
            downloads: 1543,
            features: ['Homework help', 'Exam preparation', 'Study scheduling', 'Progress tracking'],
            compatibility: ['All devices', 'Voice enabled'],
            author: 'EHB Education Team',
            version: '2.1.0',
            lastUpdated: '2024-01-15',
            image: '/images/education-bot.png',
            status: 'available'
        },
        {
            id: 'medical-reminder',
            name: 'Medical Reminder Bot',
            description: 'Healthcare assistant that reminds you to take medications, schedule appointments, and track health metrics.',
            category: 'health',
            price: 75,
            currency: 'EHBGC',
            subscription: 'monthly',
            rating: 4.9,
            reviews: 89,
            downloads: 892,
            features: ['Medication reminders', 'Appointment scheduling', 'Health tracking', 'Emergency alerts'],
            compatibility: ['Mobile optimized', 'Voice enabled'],
            author: 'EHB Health Team',
            version: '1.8.2',
            lastUpdated: '2024-01-10',
            image: '/images/medical-bot.png',
            status: 'available'
        },
        {
            id: 'delivery-robot',
            name: 'Delivery Robot',
            description: 'Smart delivery management that tracks packages, schedules deliveries, and provides real-time updates.',
            category: 'business',
            price: 100,
            currency: 'EHBGC',
            subscription: 'monthly',
            rating: 4.6,
            reviews: 203,
            downloads: 2341,
            features: ['Package tracking', 'Delivery scheduling', 'Route optimization', 'Real-time updates'],
            compatibility: ['All devices', 'GPS enabled'],
            author: 'EHB Logistics Team',
            version: '3.2.1',
            lastUpdated: '2024-01-20',
            image: '/images/delivery-bot.png',
            status: 'available'
        },
        {
            id: 'fitness-coach',
            name: 'Fitness Coach Bot',
            description: 'Personal fitness trainer that creates workout plans, tracks progress, and provides motivation.',
            category: 'lifestyle',
            price: 60,
            currency: 'EHBGC',
            subscription: 'monthly',
            rating: 4.7,
            reviews: 156,
            downloads: 1123,
            features: ['Workout planning', 'Progress tracking', 'Nutrition advice', 'Motivation system'],
            compatibility: ['Mobile optimized', 'Wearable integration'],
            author: 'EHB Fitness Team',
            version: '2.0.5',
            lastUpdated: '2024-01-12',
            image: '/images/fitness-bot.png',
            status: 'available'
        },
        {
            id: 'language-tutor',
            name: 'Language Tutor Bot',
            description: 'AI language learning assistant that helps you learn new languages through conversation and exercises.',
            category: 'education',
            price: 80,
            currency: 'EHBGC',
            subscription: 'monthly',
            rating: 4.5,
            reviews: 94,
            downloads: 756,
            features: ['Conversation practice', 'Grammar exercises', 'Vocabulary building', 'Pronunciation help'],
            compatibility: ['Voice enabled', 'Multi-language'],
            author: 'EHB Language Team',
            version: '1.9.3',
            lastUpdated: '2024-01-08',
            image: '/images/language-bot.png',
            status: 'available'
        },
        {
            id: 'finance-advisor',
            name: 'Finance Advisor Bot',
            description: 'Personal finance assistant that helps with budgeting, investment advice, and financial planning.',
            category: 'business',
            price: 120,
            currency: 'EHBGC',
            subscription: 'monthly',
            rating: 4.4,
            reviews: 67,
            downloads: 445,
            features: ['Budget tracking', 'Investment advice', 'Expense analysis', 'Financial planning'],
            compatibility: ['All devices', 'Secure'],
            author: 'EHB Finance Team',
            version: '1.7.1',
            lastUpdated: '2024-01-18',
            image: '/images/finance-bot.png',
            status: 'available'
        }
    ];

    useEffect(() => {
        loadPlugins();
        loadUserBalance();
    }, []);

    useEffect(() => {
        filterAndSortPlugins();
    }, [plugins, selectedCategory, searchQuery, sortBy]);

    const loadPlugins = async () => {
        setLoading(true);
        try {
            // In real implementation, this would fetch from API
            setPlugins(samplePlugins);
        } catch (error) {
            console.error('Failed to load plugins:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserBalance = async () => {
        try {
            // In real implementation, this would fetch from blockchain
            setUserBalance(500); // Mock balance
        } catch (error) {
            console.error('Failed to load user balance:', error);
        }
    };

    const filterAndSortPlugins = () => {
        let filtered = plugins;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(plugin => plugin.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(plugin =>
                plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort plugins
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'popular':
                    return b.downloads - a.downloads;
                case 'rating':
                    return b.rating - a.rating;
                case 'price':
                    return a.price - b.price;
                case 'newest':
                    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
                default:
                    return 0;
            }
        });

        setFilteredPlugins(filtered);
    };

    const handleInstallPlugin = async (plugin: RobotPlugin) => {
        try {
            if (userBalance < plugin.price) {
                alert('Insufficient balance. Please add more EHBGC tokens.');
                return;
            }

            // Update plugin status
            const updatedPlugins = plugins.map(p =>
                p.id === plugin.id ? { ...p, status: 'installed' } : p
            );
            setPlugins(updatedPlugins);

            // Call parent handler
            onInstallPlugin(plugin);

            // Update user balance
            setUserBalance(prev => prev - plugin.price);

        } catch (error) {
            console.error('Failed to install plugin:', error);
            alert('Failed to install plugin. Please try again.');
        }
    };

    const handleUninstallPlugin = async (pluginId: string) => {
        try {
            // Update plugin status
            const updatedPlugins = plugins.map(p =>
                p.id === pluginId ? { ...p, status: 'available' } : p
            );
            setPlugins(updatedPlugins);

            // Call parent handler
            onUninstallPlugin(pluginId);

        } catch (error) {
            console.error('Failed to uninstall plugin:', error);
            alert('Failed to uninstall plugin. Please try again.');
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            productivity: '⚡',
            health: '🏥',
            education: '📚',
            entertainment: '🎮',
            business: '💼',
            lifestyle: '🌟'
        };
        return icons[category] || '🤖';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'installed':
                return 'text-green-400';
            case 'pending':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
    };

    const categories = [
        { id: 'all', name: 'All Categories', icon: '🏪' },
        { id: 'productivity', name: 'Productivity', icon: '⚡' },
        { id: 'health', name: 'Health', icon: '🏥' },
        { id: 'education', name: 'Education', icon: '📚' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎮' },
        { id: 'business', name: 'Business', icon: '💼' },
        { id: 'lifestyle', name: 'Lifestyle', icon: '🌟' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">🤖 Robot Store</h1>
                    <p className="text-gray-300">Browse and install AI robot plugins</p>

                    {/* User Balance */}
                    <div className="mt-4 inline-block bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2">
                        <span className="text-sm text-gray-300">Balance: </span>
                        <span className="text-lg font-bold text-yellow-400">{userBalance} EHBGC</span>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="mb-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search robots..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-3 top-3 text-gray-400">🔍</span>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    selectedCategory === category.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                            >
                                <span className="mr-2">{category.icon}</span>
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="popular">Most Popular</option>
                            <option value="rating">Highest Rated</option>
                            <option value="price">Lowest Price</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-300 mt-4">Loading robots...</p>
                    </div>
                )}

                {/* Plugins Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlugins.map(plugin => (
                            <div key={plugin.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/20 transition-colors">
                                {/* Plugin Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-3xl">{getCategoryIcon(plugin.category)}</div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{plugin.name}</h3>
                                            <p className="text-sm text-gray-400">{plugin.author}</p>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded ${getStatusColor(plugin.status)}`}>
                                        {plugin.status}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-gray-300 text-sm mb-4">{plugin.description}</p>

                                {/* Features */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {plugin.features.slice(0, 3).map((feature, index) => (
                                            <span key={index} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                                                {feature}
                                            </span>
                                        ))}
                                        {plugin.features.length > 3 && (
                                            <span className="text-xs text-gray-400">+{plugin.features.length - 3} more</span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                                    <div className="flex items-center space-x-4">
                                        <span>⭐ {plugin.rating}</span>
                                        <span>📥 {plugin.downloads}</span>
                                        <span>💬 {plugin.reviews}</span>
                                    </div>
                                    <span className="text-xs">v{plugin.version}</span>
                                </div>

                                {/* Price and Action */}
                                <div className="flex items-center justify-between">
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-yellow-400">
                                            {plugin.price} {plugin.currency}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {plugin.subscription}
                                        </div>
                                    </div>

                                    {plugin.status === 'installed' ? (
                                        <button
                                            onClick={() => handleUninstallPlugin(plugin.id)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
                                        >
                                            Uninstall
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleInstallPlugin(plugin)}
                                            disabled={userBalance < plugin.price}
                                            className={`px-4 py-2 rounded-lg text-white text-sm transition-colors ${
                                                userBalance >= plugin.price
                                                    ? 'bg-blue-600 hover:bg-blue-700'
                                                    : 'bg-gray-600 cursor-not-allowed'
                                            }`}
                                        >
                                            {userBalance >= plugin.price ? 'Install' : 'Insufficient Balance'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Results */}
                {!loading && filteredPlugins.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🤖</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No robots found</h3>
                        <p className="text-gray-300">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RobotStore;
