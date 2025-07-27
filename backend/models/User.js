const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    sqlLevel: {
        type: String,
        enum: ['basic', 'premium', 'vip', 'admin'],
        default: 'basic'
    },
    walletAddress: {
        type: String,
        unique: true,
        sparse: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    profile: {
        avatar: String,
        bio: String,
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer_not_to_say']
        }
    },
    preferences: {
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ role: 1 });
userSchema.index({ sqlLevel: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for isLocked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with salt rounds of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }

    return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
    return this.find({ role: role });
};

// Static method to find by SQL level
userSchema.statics.findBySQLLevel = function(level) {
    return this.find({ sqlLevel: level });
};

// Static method to find by wallet address
userSchema.statics.findByWalletAddress = function(address) {
    return this.findOne({ walletAddress: address });
};

// Static method to create user with validation
userSchema.statics.createUser = async function(userData) {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Check if wallet address already exists
    if (userData.walletAddress) {
        const existingWallet = await this.findByWalletAddress(userData.walletAddress);
        if (existingWallet) {
            throw new Error('Wallet address already registered');
        }
    }

    // Create new user
    const user = new this(userData);
    await user.save();

    return user;
};

// Static method to update user profile
userSchema.statics.updateProfile = async function(userId, updateData) {
    // Remove sensitive fields from update
    const { password, email, role, sqlLevel, ...safeUpdates } = updateData;

    return this.findByIdAndUpdate(
        userId,
        { ...safeUpdates, updatedAt: new Date() },
        { new: true, runValidators: true }
    );
};

// Static method to change password
userSchema.statics.changePassword = async function(userId, currentPassword, newPassword) {
    const user = await this.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return user;
};

// Static method to deactivate user
userSchema.statics.deactivateUser = async function(userId) {
    return this.findByIdAndUpdate(
        userId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
    );
};

// Static method to reactivate user
userSchema.statics.reactivateUser = async function(userId) {
    return this.findByIdAndUpdate(
        userId,
        { isActive: true, updatedAt: new Date() },
        { new: true }
    );
};

// Static method to upgrade SQL level
userSchema.statics.upgradeSQLLevel = async function(userId, newLevel) {
    const validLevels = ['basic', 'premium', 'vip', 'admin'];
    if (!validLevels.includes(newLevel)) {
        throw new Error('Invalid SQL level');
    }

    return this.findByIdAndUpdate(
        userId,
        { sqlLevel: newLevel, updatedAt: new Date() },
        { new: true }
    );
};

// Static method to get user statistics
userSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                },
                verifiedUsers: {
                    $sum: { $cond: ['$isEmailVerified', 1, 0] }
                },
                usersByRole: {
                    $push: '$role'
                },
                usersBySQLLevel: {
                    $push: '$sqlLevel'
                }
            }
        }
    ]);

    if (stats.length === 0) {
        return {
            totalUsers: 0,
            activeUsers: 0,
            verifiedUsers: 0,
            usersByRole: {},
            usersBySQLLevel: {}
        };
    }

    const stat = stats[0];

    // Count roles
    const roleCounts = stat.usersByRole.reduce((acc, role) => {
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {});

    // Count SQL levels
    const levelCounts = stat.usersBySQLLevel.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {});

    return {
        totalUsers: stat.totalUsers,
        activeUsers: stat.activeUsers,
        verifiedUsers: stat.verifiedUsers,
        usersByRole: roleCounts,
        usersBySQLLevel: levelCounts
    };
};

// JSON serialization
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();

    // Remove sensitive information
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    delete userObject.emailVerificationToken;
    delete userObject.emailVerificationExpires;
    delete userObject.loginAttempts;
    delete userObject.lockUntil;

    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
