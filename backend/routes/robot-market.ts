import express from 'express';

interface RobotPlugin {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    subscription: string;
    rating: number;
    reviews: number;
    downloads: number;
    features: string[];
    compatibility: string[];
    author: string;
    version: string;
    lastUpdated: string;
    image: string;
    status: string;
}

interface UserPlugin {
    userId: string;
    pluginId: string;
    installedAt: string;
    status: 'active' | 'inactive' | 'expired';
    settings: any;
}

const router = express.Router();

// In-memory storage for plugins and user installations
const plugins: Map<string, RobotPlugin> = new Map();
const userPlugins: Map<string, UserPlugin[]> = new Map();

// Initialize sample plugins
const initializePlugins = () => {
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
        }
    ];

    samplePlugins.forEach(plugin => {
        plugins.set(plugin.id, plugin);
    });
};

// Initialize plugins on startup
initializePlugins();

// Get all available plugins
router.get('/plugins', async (req, res) => {
    try {
        const { category, search, sortBy = 'popular' } = req.query;

        let filteredPlugins = Array.from(plugins.values());

        // Filter by category
        if (category && category !== 'all') {
            filteredPlugins = filteredPlugins.filter(plugin => plugin.category === category);
        }

        // Filter by search query
        if (search) {
            const searchLower = search.toString().toLowerCase();
            filteredPlugins = filteredPlugins.filter(plugin =>
                plugin.name.toLowerCase().includes(searchLower) ||
                plugin.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort plugins
        filteredPlugins.sort((a, b) => {
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

        res.json({
            success: true,
            data: {
                plugins: filteredPlugins,
                total: filteredPlugins.length
            }
        });
    } catch (error) {
        console.error('Get plugins error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get plugin by ID
router.get('/plugins/:pluginId', async (req, res) => {
    try {
        const { pluginId } = req.params;
        const plugin = plugins.get(pluginId);

        if (!plugin) {
            return res.status(404).json({
                success: false,
                message: 'Plugin not found'
            });
        }

        res.json({
            success: true,
            data: plugin
        });
    } catch (error) {
        console.error('Get plugin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Install plugin for user
router.post('/install/:pluginId', async (req, res) => {
    try {
        const { pluginId } = req.params;
        const { userId, walletAddress } = req.body;

        if (!userId || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, walletAddress'
            });
        }

        const plugin = plugins.get(pluginId);
        if (!plugin) {
            return res.status(404).json({
                success: false,
                message: 'Plugin not found'
            });
        }

        // Check if user already has this plugin installed
        const userPluginList = userPlugins.get(userId) || [];
        const existingInstallation = userPluginList.find(up => up.pluginId === pluginId);

        if (existingInstallation) {
            return res.status(400).json({
                success: false,
                message: 'Plugin already installed'
            });
        }

        // Create user plugin installation
        const userPlugin: UserPlugin = {
            userId,
            pluginId,
            installedAt: new Date().toISOString(),
            status: 'active',
            settings: {}
        };

        userPluginList.push(userPlugin);
        userPlugins.set(userId, userPluginList);

        // Update plugin download count
        plugin.downloads += 1;

        res.json({
            success: true,
            message: 'Plugin installed successfully',
            data: {
                pluginId,
                installedAt: userPlugin.installedAt,
                status: userPlugin.status
            }
        });
    } catch (error) {
        console.error('Install plugin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Uninstall plugin for user
router.delete('/uninstall/:pluginId', async (req, res) => {
    try {
        const { pluginId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: userId'
            });
        }

        const userPluginList = userPlugins.get(userId) || [];
        const installationIndex = userPluginList.findIndex(up => up.pluginId === pluginId);

        if (installationIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Plugin not installed'
            });
        }

        // Remove installation
        userPluginList.splice(installationIndex, 1);
        userPlugins.set(userId, userPluginList);

        res.json({
            success: true,
            message: 'Plugin uninstalled successfully'
        });
    } catch (error) {
        console.error('Uninstall plugin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user's installed plugins
router.get('/user/:userId/plugins', async (req, res) => {
    try {
        const { userId } = req.params;
        const userPluginList = userPlugins.get(userId) || [];

        // Get full plugin details for installed plugins
        const installedPlugins = userPluginList.map(userPlugin => {
            const plugin = plugins.get(userPlugin.pluginId);
            return {
                ...userPlugin,
                plugin: plugin
            };
        }).filter(item => item.plugin); // Filter out plugins that no longer exist

        res.json({
            success: true,
            data: {
                installedPlugins,
                total: installedPlugins.length
            }
        });
    } catch (error) {
        console.error('Get user plugins error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update plugin settings
router.put('/user/:userId/plugins/:pluginId/settings', async (req, res) => {
    try {
        const { userId, pluginId } = req.params;
        const { settings } = req.body;

        const userPluginList = userPlugins.get(userId) || [];
        const userPlugin = userPluginList.find(up => up.pluginId === pluginId);

        if (!userPlugin) {
            return res.status(404).json({
                success: false,
                message: 'Plugin not installed'
            });
        }

        // Update settings
        userPlugin.settings = { ...userPlugin.settings, ...settings };

        res.json({
            success: true,
            message: 'Plugin settings updated successfully',
            data: userPlugin.settings
        });
    } catch (error) {
        console.error('Update plugin settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get plugin categories
router.get('/categories', async (req, res) => {
    try {
        const categories = [
            { id: 'all', name: 'All Categories', icon: '🏪', count: plugins.size },
            { id: 'productivity', name: 'Productivity', icon: '⚡', count: 0 },
            { id: 'health', name: 'Health', icon: '🏥', count: 0 },
            { id: 'education', name: 'Education', icon: '📚', count: 0 },
            { id: 'entertainment', name: 'Entertainment', icon: '🎮', count: 0 },
            { id: 'business', name: 'Business', icon: '💼', count: 0 },
            { id: 'lifestyle', name: 'Lifestyle', icon: '🌟', count: 0 }
        ];

        // Calculate counts
        Array.from(plugins.values()).forEach(plugin => {
            const category = categories.find(c => c.id === plugin.category);
            if (category) {
                category.count++;
            }
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get marketplace statistics
router.get('/statistics', async (req, res) => {
    try {
        const allPlugins = Array.from(plugins.values());

        const stats = {
            totalPlugins: allPlugins.length,
            totalDownloads: allPlugins.reduce((sum, plugin) => sum + plugin.downloads, 0),
            averageRating: allPlugins.reduce((sum, plugin) => sum + plugin.rating, 0) / allPlugins.length,
            totalReviews: allPlugins.reduce((sum, plugin) => sum + plugin.reviews, 0),
            categories: allPlugins.reduce((acc, plugin) => {
                acc[plugin.category] = (acc[plugin.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
