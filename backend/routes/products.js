const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for product operations
const productLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 requests per windowMs
    message: 'Too many product requests, please try again later.'
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    description: String,
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'EHBGC'
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    subcategory: String,
    brand: String,
    images: [String],
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    tags: [String],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    productId: {
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

const Product = mongoose.model('Product', productSchema);

// Generate unique product ID
function generateProductId() {
    return `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/products/search - Search products
router.get('/search', auth, productLimiter, async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice, sortBy = 'name', sortOrder = 'asc' } = req.query;

        // Build search query
        const query = { isAvailable: true };

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const products = await Product.find(query)
            .sort(sort)
            .limit(50)
            .exec();

        res.json({
            success: true,
            products: products,
            total: products.length,
            query: q || 'all'
        });

    } catch (error) {
        console.error('Product search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search products'
        });
    }
});

// GET /api/products/categories - Get all categories
router.get('/categories', auth, async (req, res) => {
    try {
        const categories = await Product.distinct('category');

        res.json({
            success: true,
            categories: categories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

// GET /api/products/:id - Get specific product
router.get('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOne({
            productId: req.params.id,
            isAvailable: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product: product
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
});

// POST /api/products - Create new product (admin only)
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, price, category, subcategory, brand, images, stock, tags } = req.body;

        // Validate required fields
        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and category are required'
            });
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ name: name, category: category });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product already exists'
            });
        }

        const product = new Product({
            name,
            description,
            price: parseFloat(price),
            category,
            subcategory,
            brand,
            images: images || [],
            stock: stock || 0,
            tags: tags || [],
            productId: generateProductId()
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: product
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, price, category, subcategory, brand, images, stock, tags, isAvailable } = req.body;

        const product = await Product.findOne({ productId: req.params.id });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update fields
        if (name) product.name = name;
        if (description !== undefined) product.description = description;
        if (price) product.price = parseFloat(price);
        if (category) product.category = category;
        if (subcategory !== undefined) product.subcategory = subcategory;
        if (brand !== undefined) product.brand = brand;
        if (images) product.images = images;
        if (stock !== undefined) product.stock = stock;
        if (tags) product.tags = tags;
        if (isAvailable !== undefined) product.isAvailable = isAvailable;

        product.updatedAt = new Date();
        await product.save();

        res.json({
            success: true,
            message: 'Product updated successfully',
            product: product
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await Product.deleteOne({ productId: req.params.id });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
});

// GET /api/products/featured - Get featured products
router.get('/featured', auth, async (req, res) => {
    try {
        const featuredProducts = await Product.find({
            isAvailable: true,
            rating: { $gte: 4.0 }
        })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(10)
        .exec();

        res.json({
            success: true,
            products: featuredProducts
        });

    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured products'
        });
    }
});

// POST /api/products/seed - Seed sample products (development only)
router.post('/seed', auth, async (req, res) => {
    try {
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

        for (const productData of sampleProducts) {
            const existingProduct = await Product.findOne({
                name: productData.name,
                category: productData.category
            });

            if (!existingProduct) {
                const product = new Product({
                    ...productData,
                    productId: generateProductId(),
                    currency: 'EHBGC'
                });
                await product.save();
            }
        }

        res.json({
            success: true,
            message: 'Sample products seeded successfully'
        });

    } catch (error) {
        console.error('Seed products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed products'
        });
    }
});

module.exports = router;
