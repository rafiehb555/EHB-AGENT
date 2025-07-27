import express from 'express';

interface Reminder {
    id: string;
    userId: string;
    title: string;
    description: string;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    time: string;
    days: string[];
    active: boolean;
    createdAt: string;
    lastTriggered?: string;
    nextTrigger?: string;
}

const router = express.Router();

// In-memory storage for reminders (in production, use database)
const reminders: Map<string, Reminder[]> = new Map();

// Create a new reminder
router.post('/create', async (req, res) => {
    try {
        const { userId, title, description, frequency, time, days } = req.body;

        if (!userId || !title || !frequency || !time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, title, frequency, time'
            });
        }

        const reminder: Reminder = {
            id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            title: title.trim(),
            description: description?.trim() || '',
            frequency,
            time,
            days: days || [],
            active: true,
            createdAt: new Date().toISOString(),
            nextTrigger: calculateNextTrigger(frequency, time, days)
        };

        // Store reminder
        if (!reminders.has(userId)) {
            reminders.set(userId, []);
        }
        reminders.get(userId)!.push(reminder);

        res.json({
            success: true,
            message: 'Reminder created successfully',
            data: reminder
        });
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user's reminders
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userReminders = reminders.get(userId) || [];

        res.json({
            success: true,
            data: {
                reminders: userReminders,
                total: userReminders.length,
                active: userReminders.filter(r => r.active).length
            }
        });
    } catch (error) {
        console.error('Get user reminders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update reminder
router.put('/update/:reminderId', async (req, res) => {
    try {
        const { reminderId } = req.params;
        const { title, description, frequency, time, days, active } = req.body;

        let found = false;
        for (const [userId, userReminders] of reminders.entries()) {
            const reminderIndex = userReminders.findIndex(r => r.id === reminderId);
            if (reminderIndex !== -1) {
                const updatedReminder = {
                    ...userReminders[reminderIndex],
                    title: title || userReminders[reminderIndex].title,
                    description: description || userReminders[reminderIndex].description,
                    frequency: frequency || userReminders[reminderIndex].frequency,
                    time: time || userReminders[reminderIndex].time,
                    days: days || userReminders[reminderIndex].days,
                    active: active !== undefined ? active : userReminders[reminderIndex].active,
                    nextTrigger: calculateNextTrigger(
                        frequency || userReminders[reminderIndex].frequency,
                        time || userReminders[reminderIndex].time,
                        days || userReminders[reminderIndex].days
                    )
                };

                userReminders[reminderIndex] = updatedReminder;
                found = true;

                res.json({
                    success: true,
                    message: 'Reminder updated successfully',
                    data: updatedReminder
                });
                break;
            }
        }

        if (!found) {
            res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }
    } catch (error) {
        console.error('Update reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete reminder
router.delete('/delete/:reminderId', async (req, res) => {
    try {
        const { reminderId } = req.params;

        let found = false;
        for (const [userId, userReminders] of reminders.entries()) {
            const reminderIndex = userReminders.findIndex(r => r.id === reminderId);
            if (reminderIndex !== -1) {
                userReminders.splice(reminderIndex, 1);
                found = true;

                res.json({
                    success: true,
                    message: 'Reminder deleted successfully'
                });
                break;
            }
        }

        if (!found) {
            res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }
    } catch (error) {
        console.error('Delete reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Toggle reminder active status
router.patch('/toggle/:reminderId', async (req, res) => {
    try {
        const { reminderId } = req.params;

        let found = false;
        for (const [userId, userReminders] of reminders.entries()) {
            const reminderIndex = userReminders.findIndex(r => r.id === reminderId);
            if (reminderIndex !== -1) {
                const reminder = userReminders[reminderIndex];
                reminder.active = !reminder.active;

                res.json({
                    success: true,
                    message: `Reminder ${reminder.active ? 'activated' : 'deactivated'} successfully`,
                    data: reminder
                });
                found = true;
                break;
            }
        }

        if (!found) {
            res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }
    } catch (error) {
        console.error('Toggle reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get due reminders (for checking which reminders should trigger)
router.get('/due/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const now = new Date();
        const userReminders = reminders.get(userId) || [];

        const dueReminders = userReminders.filter(reminder => {
            if (!reminder.active) return false;

            const nextTrigger = new Date(reminder.nextTrigger || '');
            return nextTrigger <= now;
        });

        res.json({
            success: true,
            data: {
                dueReminders,
                count: dueReminders.length
            }
        });
    } catch (error) {
        console.error('Get due reminders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Mark reminder as triggered
router.post('/trigger/:reminderId', async (req, res) => {
    try {
        const { reminderId } = req.params;

        let found = false;
        for (const [userId, userReminders] of reminders.entries()) {
            const reminderIndex = userReminders.findIndex(r => r.id === reminderId);
            if (reminderIndex !== -1) {
                const reminder = userReminders[reminderIndex];
                reminder.lastTriggered = new Date().toISOString();
                reminder.nextTrigger = calculateNextTrigger(reminder.frequency, reminder.time, reminder.days);

                res.json({
                    success: true,
                    message: 'Reminder marked as triggered',
                    data: reminder
                });
                found = true;
                break;
            }
        }

        if (!found) {
            res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }
    } catch (error) {
        console.error('Trigger reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get reminder statistics
router.get('/statistics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userReminders = reminders.get(userId) || [];

        const stats = {
            total: userReminders.length,
            active: userReminders.filter(r => r.active).length,
            inactive: userReminders.filter(r => !r.active).length,
            byFrequency: {
                once: userReminders.filter(r => r.frequency === 'once').length,
                daily: userReminders.filter(r => r.frequency === 'daily').length,
                weekly: userReminders.filter(r => r.frequency === 'weekly').length,
                monthly: userReminders.filter(r => r.frequency === 'monthly').length
            },
            dueToday: userReminders.filter(r => {
                if (!r.active) return false;
                const nextTrigger = new Date(r.nextTrigger || '');
                const today = new Date();
                return nextTrigger.toDateString() === today.toDateString();
            }).length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get reminder statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Helper function to calculate next trigger time
function calculateNextTrigger(frequency: string, time: string, days: string[]): string {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    if (frequency === 'once') {
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);

        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        return next.toISOString();
    }

    if (frequency === 'daily') {
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);

        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        return next.toISOString();
    }

    if (frequency === 'weekly') {
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let daysToAdd = 1;
        while (!days.includes(dayNames[(now.getDay() + daysToAdd) % 7])) {
            daysToAdd++;
        }

        next.setDate(next.getDate() + daysToAdd);
        return next.toISOString();
    }

    if (frequency === 'monthly') {
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
        return next.toISOString();
    }

    return new Date().toISOString();
}

export default router;
