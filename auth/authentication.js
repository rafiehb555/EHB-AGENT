const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const winston = require('winston');

class AuthenticationManager {
    constructor() {
        this.secretKey = process.env.JWT_SECRET || 'ehb-agent-secret-key-2025';
        this.tokenExpiry = process.env.JWT_EXPIRY || '24h';
        this.users = new Map();
        this.setupLogging();
        this.initializeDefaultUsers();
    }

    setupLogging() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/authentication.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    initializeDefaultUsers() {
        // Default admin user
        this.createUser({
            username: 'admin',
            email: 'admin@ehb-agent.com',
            password: 'admin123',
            role: 'admin',
            permissions: ['read', 'write', 'delete', 'admin']
        });

        // Default developer user
        this.createUser({
            username: 'developer',
            email: 'developer@ehb-agent.com',
            password: 'dev123',
            role: 'developer',
            permissions: ['read', 'write']
        });

        // Default viewer user
        this.createUser({
            username: 'viewer',
            email: 'viewer@ehb-agent.com',
            password: 'view123',
            role: 'viewer',
            permissions: ['read']
        });
    }

    async createUser(userData) {
        try {
            const { username, email, password, role, permissions } = userData;

            // Check if user already exists
            if (this.users.has(username)) {
                throw new Error('User already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user object
            const user = {
                username,
                email,
                password: hashedPassword,
                role,
                permissions,
                createdAt: new Date(),
                lastLogin: null,
                isActive: true
            };

            this.users.set(username, user);
            this.logger.info(`✅ User created: ${username} (${role})`);

            return { success: true, username, role };
        } catch (error) {
            this.logger.error('❌ User creation failed:', error);
            throw error;
        }
    }

    async authenticateUser(username, password) {
        try {
            const user = this.users.get(username);

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isActive) {
                throw new Error('User account is disabled');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                throw new Error('Invalid password');
            }

            // Update last login
            user.lastLogin = new Date();
            this.users.set(username, user);

            // Generate JWT token
            const token = this.generateToken(user);

            this.logger.info(`✅ User authenticated: ${username}`);

            return {
                success: true,
                token,
                user: {
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions
                }
            };
        } catch (error) {
            this.logger.error(`❌ Authentication failed for ${username}:`, error);
            throw error;
        }
    }

    generateToken(user) {
        const payload = {
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            iat: Date.now()
        };

        return jwt.sign(payload, this.secretKey, { expiresIn: this.tokenExpiry });
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return { valid: true, user: decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    hasPermission(user, permission) {
        if (!user || !user.permissions) {
            return false;
        }
        return user.permissions.includes(permission) || user.permissions.includes('admin');
    }

    requireAuth(permission = null) {
        return (req, res, next) => {
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');

                if (!token) {
                    return res.status(401).json({ error: 'No token provided' });
                }

                const { valid, user, error } = this.verifyToken(token);

                if (!valid) {
                    return res.status(401).json({ error: 'Invalid token' });
                }

                // Check if user still exists and is active
                const currentUser = this.users.get(user.username);
                if (!currentUser || !currentUser.isActive) {
                    return res.status(401).json({ error: 'User account not found or disabled' });
                }

                req.user = user;

                // Check permission if required
                if (permission && !this.hasPermission(user, permission)) {
                    return res.status(403).json({ error: 'Insufficient permissions' });
                }

                next();
            } catch (error) {
                this.logger.error('❌ Authentication middleware error:', error);
                res.status(500).json({ error: 'Authentication error' });
            }
        };
    }

    async changePassword(username, oldPassword, newPassword) {
        try {
            const user = this.users.get(username);

            if (!user) {
                throw new Error('User not found');
            }

            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

            if (!isOldPasswordValid) {
                throw new Error('Invalid old password');
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
            user.updatedAt = new Date();

            this.users.set(username, user);
            this.logger.info(`✅ Password changed for user: ${username}`);

            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Password change failed for ${username}:`, error);
            throw error;
        }
    }

    async updateUser(username, updates) {
        try {
            const user = this.users.get(username);

            if (!user) {
                throw new Error('User not found');
            }

            // Update allowed fields
            if (updates.email) user.email = updates.email;
            if (updates.role) user.role = updates.role;
            if (updates.permissions) user.permissions = updates.permissions;
            if (updates.isActive !== undefined) user.isActive = updates.isActive;

            user.updatedAt = new Date();
            this.users.set(username, user);

            this.logger.info(`✅ User updated: ${username}`);

            return { success: true, user: { username, email: user.email, role: user.role } };
        } catch (error) {
            this.logger.error(`❌ User update failed for ${username}:`, error);
            throw error;
        }
    }

    async deleteUser(username) {
        try {
            const user = this.users.get(username);

            if (!user) {
                throw new Error('User not found');
            }

            this.users.delete(username);
            this.logger.info(`✅ User deleted: ${username}`);

            return { success: true };
        } catch (error) {
            this.logger.error(`❌ User deletion failed for ${username}:`, error);
            throw error;
        }
    }

    getAllUsers() {
        const users = [];
        for (const [username, user] of this.users) {
            users.push({
                username,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                isActive: user.isActive,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            });
        }
        return users;
    }

    getUserStats() {
        const stats = {
            totalUsers: this.users.size,
            activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
            roles: {},
            recentLogins: []
        };

        // Count users by role
        for (const user of this.users.values()) {
            stats.roles[user.role] = (stats.roles[user.role] || 0) + 1;

            if (user.lastLogin) {
                stats.recentLogins.push({
                    username: user.username,
                    lastLogin: user.lastLogin
                });
            }
        }

        // Sort recent logins by date
        stats.recentLogins.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));

        return stats;
    }

    async healthCheck() {
        const health = {
            authentication: 'AuthenticationManager',
            status: 'healthy',
            totalUsers: this.users.size,
            activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
            tokenExpiry: this.tokenExpiry,
            timestamp: new Date().toISOString()
        };

        this.logger.info('🏥 Authentication system health check:', health);
        return health;
    }
}

module.exports = AuthenticationManager;
