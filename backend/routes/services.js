const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for service operations
const serviceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // limit each IP to 15 requests per windowMs
    message: 'Too many service requests, please try again later.'
});

// Service Provider Schema
const serviceProviderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        required: true,
        index: true
    },
    description: String,
    location: {
        type: String,
        required: true
    },
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
    isAvailable: {
        type: Boolean,
        default: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'EHBGC'
    },
    contactInfo: {
        phone: String,
        email: String
    },
    workingHours: {
        start: String,
        end: String
    },
    providerId: {
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

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);

// Service Booking Schema
const serviceBookingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    serviceId: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    bookingTime: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    notes: String,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    price: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'wallet'
    },
    bookingId: {
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

const ServiceBooking = mongoose.model('ServiceBooking', serviceBookingSchema);

// Generate unique IDs
function generateProviderId() {
    return `PROV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateBookingId() {
    return `BK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/services/search - Search service providers
router.get('/search', auth, serviceLimiter, async (req, res) => {
    try {
        const { type, time, location, minRating, maxPrice } = req.query;

        // Build search query
        const query = { isAvailable: true };

        if (type) {
            query.serviceType = { $regex: type, $options: 'i' };
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }

        if (maxPrice) {
            query.price = { $lte: parseFloat(maxPrice) };
        }

        const providers = await ServiceProvider.find(query)
            .sort({ rating: -1, reviewCount: -1 })
            .limit(20)
            .exec();

        res.json({
            success: true,
            services: providers,
            total: providers.length,
            query: type || 'all'
        });

    } catch (error) {
        console.error('Service search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search services'
        });
    }
});

// POST /api/services/book - Book a service
router.post('/book', auth, serviceLimiter, async (req, res) => {
    try {
        const { serviceId, bookingTime, location, notes } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!serviceId || !bookingTime || !location) {
            return res.status(400).json({
                success: false,
                message: 'Service ID, booking time, and location are required'
            });
        }

        // Find the service provider
        const provider = await ServiceProvider.findOne({ providerId: serviceId });
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Service provider not found'
            });
        }

        if (!provider.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Service provider is not available'
            });
        }

        // Check if booking time is in the future
        const bookingDate = new Date(bookingTime);
        if (bookingDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Booking time must be in the future'
            });
        }

        // Check for conflicting bookings (simplified)
        const conflictingBooking = await ServiceBooking.findOne({
            providerId: serviceId,
            bookingTime: {
                $gte: new Date(bookingDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
                $lte: new Date(bookingDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
            },
            status: { $in: ['pending', 'confirmed', 'in_progress'] }
        });

        if (conflictingBooking) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked'
            });
        }

        // Create booking
        const booking = new ServiceBooking({
            userId,
            serviceId,
            providerId: serviceId,
            bookingTime: bookingDate,
            location: location || provider.location,
            notes: notes || '',
            price: provider.price,
            paymentMethod: 'wallet',
            bookingId: generateBookingId()
        });

        await booking.save();

        // Log activity
        console.log(`Service booked: ${booking.bookingId} by user ${userId}`);

        res.status(201).json({
            success: true,
            bookingId: booking.bookingId,
            message: 'Service booked successfully',
            data: {
                bookingId: booking.bookingId,
                providerName: provider.name,
                serviceType: provider.serviceType,
                bookingTime: booking.bookingTime,
                price: booking.price,
                status: booking.status
            }
        });

    } catch (error) {
        console.error('Service booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to book service'
        });
    }
});

// GET /api/services/bookings - Get user's service bookings
router.get('/bookings', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const bookings = await ServiceBooking.find(query)
            .sort({ bookingTime: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await ServiceBooking.countDocuments(query);

        res.json({
            success: true,
            bookings,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalBookings: count
        });

    } catch (error) {
        console.error('Get service bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service bookings'
        });
    }
});

// POST /api/services/bookings/:id/cancel - Cancel service booking
router.post('/bookings/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await ServiceBooking.findOne({
            bookingId: req.params.id,
            userId: req.user.id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed booking'
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        booking.status = 'cancelled';
        booking.updatedAt = new Date();
        await booking.save();

        res.json({
            success: true,
            message: 'Service booking cancelled successfully',
            data: {
                bookingId: booking.bookingId,
                status: booking.status
            }
        });

    } catch (error) {
        console.error('Cancel service booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel service booking'
        });
    }
});

// POST /api/services/seed - Seed sample service providers (development only)
router.post('/seed', auth, async (req, res) => {
    try {
        const sampleProviders = [
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

        for (const providerData of sampleProviders) {
            const existingProvider = await ServiceProvider.findOne({
                name: providerData.name,
                serviceType: providerData.serviceType
            });

            if (!existingProvider) {
                const provider = new ServiceProvider({
                    ...providerData,
                    providerId: generateProviderId(),
                    currency: 'EHBGC'
                });
                await provider.save();
            }
        }

        res.json({
            success: true,
            message: 'Sample service providers seeded successfully'
        });

    } catch (error) {
        console.error('Seed service providers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed service providers'
        });
    }
});

module.exports = router;
