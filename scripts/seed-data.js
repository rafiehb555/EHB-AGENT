const mongoose = require('mongoose');
const config = require('../config/environment');
const User = require('../backend/models/User');
const { LoggingUtils } = require('../utils/logger');

// Sample data for seeding
const sampleUsers = [
    {
        email: 'admin@ehb.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        sqlLevel: 'admin',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        phone: '+1234567890',
        isEmailVerified: true,
        isActive: true
    },
    {
        email: 'user@ehb.com',
        password: 'user123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
        sqlLevel: 'basic',
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        phone: '+1234567891',
        isEmailVerified: true,
        isActive: true
    },
    {
        email: 'premium@ehb.com',
        password: 'premium123',
        firstName: 'Premium',
        lastName: 'User',
        role: 'user',
        sqlLevel: 'premium',
        walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
        phone: '+1234567892',
        isEmailVerified: true,
        isActive: true
    },
    {
        email: 'vip@ehb.com',
        password: 'vip123',
        firstName: 'VIP',
        lastName: 'User',
        role: 'user',
        sqlLevel: 'vip',
        walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
        phone: '+1234567893',
        isEmailVerified: true,
        isActive: true
    }
];

const sampleProducts = [
    {
        name: 'Coca-Cola 500ml',
        description: 'Refreshing carbonated soft drink',
        price: 2.50,
        category: 'Beverages',
        subcategory: 'Soft Drinks',
        brand: 'Coca-Cola',
        stock: 100,
        tags: ['beverage', 'soft drink', 'carbonated'],
        rating: 4.5,
        reviewCount: 25
    },
    {
        name: 'Pepsi 500ml',
        description: 'Popular carbonated soft drink',
        price: 2.25,
        category: 'Beverages',
        subcategory: 'Soft Drinks',
        brand: 'Pepsi',
        stock: 80,
        tags: ['beverage', 'soft drink', 'carbonated'],
        rating: 4.3,
        reviewCount: 20
    },
    {
        name: 'Lays Classic Chips',
        description: 'Crispy potato chips',
        price: 3.00,
        category: 'Snacks',
        subcategory: 'Chips',
        brand: 'Lays',
        stock: 50,
        tags: ['snack', 'chips', 'potato'],
        rating: 4.7,
        reviewCount: 30
    },
    {
        name: 'Doritos Nacho Cheese',
        description: 'Cheese flavored tortilla chips',
        price: 3.50,
        category: 'Snacks',
        subcategory: 'Chips',
        brand: 'Doritos',
        stock: 40,
        tags: ['snack', 'chips', 'cheese'],
        rating: 4.6,
        reviewCount: 18
    },
    {
        name: 'Pizza Margherita',
        description: 'Classic Italian pizza with tomato and mozzarella',
        price: 12.00,
        category: 'Food',
        subcategory: 'Pizza',
        brand: 'Local Kitchen',
        stock: 20,
        tags: ['food', 'pizza', 'Italian'],
        rating: 4.8,
        reviewCount: 45
    },
    {
        name: 'Chicken Burger',
        description: 'Grilled chicken burger with fresh vegetables',
        price: 8.50,
        category: 'Food',
        subcategory: 'Burgers',
        brand: 'Local Kitchen',
        stock: 15,
        tags: ['food', 'burger', 'chicken'],
        rating: 4.4,
        reviewCount: 22
    },
    {
        name: 'French Fries',
        description: 'Crispy golden french fries',
        price: 4.00,
        category: 'Food',
        subcategory: 'Sides',
        brand: 'Local Kitchen',
        stock: 30,
        tags: ['food', 'fries', 'sides'],
        rating: 4.2,
        reviewCount: 15
    },
    {
        name: 'Chocolate Ice Cream',
        description: 'Rich chocolate ice cream',
        price: 5.00,
        category: 'Desserts',
        subcategory: 'Ice Cream',
        brand: 'Local Kitchen',
        stock: 25,
        tags: ['dessert', 'ice cream', 'chocolate'],
        rating: 4.6,
        reviewCount: 28
    }
];

const sampleServiceProviders = [
    {
        name: 'AC Repair Pro',
        serviceType: 'AC Repair',
        description: 'Professional AC repair and maintenance services',
        location: 'Downtown Area',
        rating: 4.8,
        reviewCount: 45,
        price: 50.00,
        contactInfo: {
            phone: '+1234567890',
            email: 'acrepair@example.com'
        },
        workingHours: {
            start: '08:00',
            end: '18:00'
        }
    },
    {
        name: 'Elite Hair Salon',
        serviceType: 'Hair Styling',
        description: 'Premium hair styling and beauty services',
        location: 'Mall District',
        rating: 4.9,
        reviewCount: 120,
        price: 35.00,
        contactInfo: {
            phone: '+1234567891',
            email: 'elitehair@example.com'
        },
        workingHours: {
            start: '09:00',
            end: '20:00'
        }
    },
    {
        name: 'VIP Cleaning Services',
        serviceType: 'House Cleaning',
        description: 'Professional house cleaning and maintenance',
        location: 'Residential Area',
        rating: 4.7,
        reviewCount: 89,
        price: 40.00,
        contactInfo: {
            phone: '+1234567892',
            email: 'vipcleaning@example.com'
        },
        workingHours: {
            start: '07:00',
            end: '17:00'
        }
    },
    {
        name: 'Tech Support Plus',
        serviceType: 'Computer Repair',
        description: 'Computer and laptop repair services',
        location: 'Tech District',
        rating: 4.6,
        reviewCount: 67,
        price: 45.00,
        contactInfo: {
            phone: '+1234567893',
            email: 'techsupport@example.com'
        },
        workingHours: {
            start: '10:00',
            end: '19:00'
        }
    },
    {
        name: 'Plumbing Experts',
        serviceType: 'Plumbing',
        description: 'Emergency plumbing and repair services',
        location: 'City Center',
        rating: 4.5,
        reviewCount: 34,
        price: 60.00,
        contactInfo: {
            phone: '+1234567894',
            email: 'plumbing@example.com'
        },
        workingHours: {
            start: '08:00',
            end: '20:00'
        }
    }
];

// Seeding functions
async function seedUsers() {
    try {
        console.log('👥 Seeding users...');

        for (const userData of sampleUsers) {
            const existingUser = await User.findByEmail(userData.email);

            if (!existingUser) {
                await User.createUser(userData);
                console.log(`✅ Created user: ${userData.email}`);
            } else {
                console.log(`⏭️ User already exists: ${userData.email}`);
            }
        }

        console.log('✅ Users seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        throw error;
    }
}

async function seedProducts() {
    try {
        console.log('📦 Seeding products...');

        const Product = require('../backend/routes/products').Product;

        for (const productData of sampleProducts) {
            const existingProduct = await Product.findOne({
                name: productData.name,
                category: productData.category
            });

            if (!existingProduct) {
                const product = new Product({
                    ...productData,
                    productId: `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    currency: 'EHBGC'
                });
                await product.save();
                console.log(`✅ Created product: ${productData.name}`);
            } else {
                console.log(`⏭️ Product already exists: ${productData.name}`);
            }
        }

        console.log('✅ Products seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        throw error;
    }
}

async function seedServiceProviders() {
    try {
        console.log('🔧 Seeding service providers...');

        const ServiceProvider = require('../backend/routes/services').ServiceProvider;

        for (const providerData of sampleServiceProviders) {
            const existingProvider = await ServiceProvider.findOne({
                name: providerData.name,
                serviceType: providerData.serviceType
            });

            if (!existingProvider) {
                const provider = new ServiceProvider({
                    ...providerData,
                    providerId: `PROV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    currency: 'EHBGC'
                });
                await provider.save();
                console.log(`✅ Created service provider: ${providerData.name}`);
            } else {
                console.log(`⏭️ Service provider already exists: ${providerData.name}`);
            }
        }

        console.log('✅ Service providers seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding service providers:', error);
        throw error;
    }
}

async function seedWallets() {
    try {
        console.log('💰 Seeding wallets...');

        const Wallet = require('../backend/routes/wallet').Wallet;
        const users = await User.find();

        for (const user of users) {
            const existingWallet = await Wallet.findOne({ userId: user._id.toString() });

            if (!existingWallet) {
                const wallet = new Wallet({
                    userId: user._id.toString(),
                    balance: config.wallet.defaultBalance,
                    currency: 'EHBGC'
                });
                await wallet.save();
                console.log(`✅ Created wallet for user: ${user.email}`);
            } else {
                console.log(`⏭️ Wallet already exists for user: ${user.email}`);
            }
        }

        console.log('✅ Wallets seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding wallets:', error);
        throw error;
    }
}

async function seedAll() {
    try {
        console.log('🌱 Starting data seeding...');

        // Connect to database
        await mongoose.connect(config.database.uri, config.database.options);
        console.log('✅ Connected to database');

        // Seed all data
        await seedUsers();
        await seedProducts();
        await seedServiceProviders();
        await seedWallets();

        console.log('🎉 All data seeded successfully!');

        // Log the seeding activity
        LoggingUtils.logSystemEvent('data_seeding_completed', {
            usersCreated: sampleUsers.length,
            productsCreated: sampleProducts.length,
            serviceProvidersCreated: sampleServiceProviders.length
        });

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        LoggingUtils.logError(error, { context: 'data_seeding' });
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

// Run seeding if this script is executed directly
if (require.main === module) {
    seedAll()
        .then(() => {
            console.log('✅ Seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = {
    seedUsers,
    seedProducts,
    seedServiceProviders,
    seedWallets,
    seedAll
};
