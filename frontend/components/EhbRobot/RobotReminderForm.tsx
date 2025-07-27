import React, { useState } from 'react';

interface Reminder {
    id: string;
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

interface RobotReminderFormProps {
    userId: string;
    onReminderCreate: (reminder: Reminder) => void;
    onClose: () => void;
}

const RobotReminderForm: React.FC<RobotReminderFormProps> = ({
    userId,
    onReminderCreate,
    onClose
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
    const [time, setTime] = useState('09:00');
    const [selectedDays, setSelectedDays] = useState<string[]>(['Monday']);
    const [loading, setLoading] = useState(false);

    const daysOfWeek = [
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            alert('Please enter a reminder title');
            return;
        }

        try {
            setLoading(true);

            const reminder: Reminder = {
                id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: title.trim(),
                description: description.trim(),
                frequency,
                time,
                days: frequency === 'once' ? [] : selectedDays,
                active: true,
                createdAt: new Date().toISOString(),
                nextTrigger: calculateNextTrigger()
            };

            onReminderCreate(reminder);
            onClose();
        } catch (error) {
            console.error('Create reminder error:', error);
            alert('Failed to create reminder. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateNextTrigger = (): string => {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);

        if (frequency === 'once') {
            // Set to today at specified time
            const next = new Date(now);
            next.setHours(hours, minutes, 0, 0);

            // If time has passed today, set to tomorrow
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

            // Find next occurrence of selected days
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const currentDay = dayNames[now.getDay()];

            let daysToAdd = 1;
            while (!selectedDays.includes(dayNames[(now.getDay() + daysToAdd) % 7])) {
                daysToAdd++;
            }

            next.setDate(next.getDate() + daysToAdd);
            return next.toISOString();
        }

        if (frequency === 'monthly') {
            const next = new Date(now);
            next.setHours(hours, minutes, 0, 0);
            next.setDate(1); // Start of next month
            next.setMonth(next.getMonth() + 1);
            return next.toISOString();
        }

        return new Date().toISOString();
    };

    const handleDayToggle = (day: string) => {
        setSelectedDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            } else {
                return [...prev, day];
            }
        });
    };

    const getFrequencyDescription = () => {
        switch (frequency) {
            case 'once':
                return 'One-time reminder';
            case 'daily':
                return 'Every day at the specified time';
            case 'weekly':
                return `Every ${selectedDays.join(', ')} at the specified time`;
            case 'monthly':
                return 'First day of every month at the specified time';
            default:
                return '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">⏰ Create Smart Reminder</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Reminder Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Order groceries, Book AC service"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details about this reminder..."
                            rows={3}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Frequency
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                            <option value="once">Once</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            {getFrequencyDescription()}
                        </p>
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Time
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Days of Week (for weekly frequency) */}
                    {frequency === 'weekly' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Days of Week
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {daysOfWeek.map(day => (
                                    <label key={day.value} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedDays.includes(day.value)}
                                            onChange={() => handleDayToggle(day.value)}
                                            className="rounded border-white/20 bg-white/10"
                                        />
                                        <span className="text-sm">{day.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="bg-white/5 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2">Preview:</h4>
                        <p className="text-sm text-gray-300">
                            "{title}" will trigger {getFrequencyDescription().toLowerCase()} at {time}
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Reminder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RobotReminderForm;
