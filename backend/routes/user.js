const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// GET /api/user/profile - Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile'
        });
    }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, address, profile, preferences } = req.body;

        const updatedUser = await User.updateProfile(req.user.id, {
            firstName,
            lastName,
            phone,
            address,
            profile,
            preferences
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser.toJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/user/change-password - Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        await User.changePassword(req.user.id, currentPassword, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/user/stats - Get user statistics (admin only)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
    try {
        const stats = await User.getStats();

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics'
        });
    }
});

module.exports = router;
