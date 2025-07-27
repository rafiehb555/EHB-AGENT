const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'ehb-agent-secret-key-2024';

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        // Add user to request object
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            sqlLevel: user.sqlLevel,
            walletAddress: user.walletAddress
        };

        next();

    } catch (error) {
        console.error('Authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (user && user.isActive) {
            req.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                sqlLevel: user.sqlLevel,
                walletAddress: user.walletAddress
            };
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        req.user = null;
        next();
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// SQL Level authorization middleware
const requireSQLLevel = (minLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userLevel = req.user.sqlLevel || 'basic';
        const levels = ['basic', 'premium', 'vip', 'admin'];

        if (levels.indexOf(userLevel) < levels.indexOf(minLevel)) {
            return res.status(403).json({
                success: false,
                message: `Minimum SQL level required: ${minLevel}`
            });
        }

        next();
    };
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Verify token without database lookup (for performance)
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    auth,
    optionalAuth,
    authorize,
    requireSQLLevel,
    generateToken,
    verifyToken
};
