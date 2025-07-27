import React, { useState } from 'react';

interface RobotConfig {
    id: string;
    name: string;
    description: string;
    tasks: string[];
    schedule: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
        time: string;
        days?: string[];
        customSchedule?: string;
    };
    budgetLimit: number;
    targetArea: string;
    voiceEnabled: boolean;
    language: 'english' | 'urdu' | 'both';
    priority: 'low' | 'medium' | 'high';
    notifications: boolean;
    autoExecute: boolean;
}

interface RobotCreatorProps {
    userId?: string;
    walletAddress?: string;
    onCreateRobot: (config: RobotConfig) => void;
    onCancel: () => void;
}

const RobotCreator: React.FC<RobotCreatorProps> = ({
    userId,
    walletAddress,
    onCreateRobot,
    onCancel
}) => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState<Partial<RobotConfig>>({
        name: '',
        description: '',
        tasks: [],
        schedule: {
            frequency: 'daily',
            time: '09:00'
        },
        budgetLimit: 100,
        targetArea: '',
        voiceEnabled: true,
        language: 'english',
        priority: 'medium',
        notifications: true,
        autoExecute: false
    });

    const [currentTask, setCurrentTask] = useState('');
    const [loading, setLoading] = useState(false);

    const taskSuggestions = [
        'Order groceries',
        'Schedule appointments',
        'Send reminders',
        'Track expenses',
        'Monitor health metrics',
        'Book services',
        'Send notifications',
        'Generate reports',
        'Process payments',
        'Update social media',
        'Monitor weather',
        'Track packages',
        'Manage calendar',
        'Send emails',
        'Create backups'
    ];

    const areaSuggestions = [
        'Home automation',
        'Personal finance',
        'Health & fitness',
        'Education & learning',
        'Business management',
        'Entertainment',
        'Travel planning',
        'Shopping assistance',
        'Communication',
        'Productivity'
    ];

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleCreateRobot = async () => {
        if (!config.name || !config.description || config.tasks.length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const robotConfig: RobotConfig = {
                id: `robot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...config as RobotConfig
            };

            await onCreateRobot(robotConfig);
        } catch (error) {
            console.error('Failed to create robot:', error);
            alert('Failed to create robot. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addTask = () => {
        if (currentTask.trim() && !config.tasks?.includes(currentTask.trim())) {
            setConfig(prev => ({
                ...prev,
                tasks: [...(prev.tasks || []), currentTask.trim()]
            }));
            setCurrentTask('');
        }
    };

    const removeTask = (task: string) => {
        setConfig(prev => ({
            ...prev,
            tasks: prev.tasks?.filter(t => t !== task) || []
        }));
    };

    const addSuggestedTask = (task: string) => {
        if (!config.tasks?.includes(task)) {
            setConfig(prev => ({
                ...prev,
                tasks: [...(prev.tasks || []), task]
            }));
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">🤖 Basic Information</h3>
                <p className="text-gray-300 text-sm mb-4">Let's start by giving your robot a name and description.</p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Robot Name *
                </label>
                <input
                    type="text"
                    value={config.name || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My Personal Assistant, Shopping Bot, Health Monitor"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Description *
                </label>
                <textarea
                    value={config.description || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what your robot should do and how it should help you..."
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Target Area
                </label>
                <select
                    value={config.targetArea || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, targetArea: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                >
                    <option value="">Select an area</option>
                    {areaSuggestions.map(area => (
                        <option key={area} value={area}>{area}</option>
                    ))}
                </select>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">📋 Tasks & Capabilities</h3>
                <p className="text-gray-300 text-sm mb-4">Define what tasks your robot should perform.</p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Add Custom Task
                </label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={currentTask}
                        onChange={(e) => setCurrentTask(e.target.value)}
                        placeholder="Enter a task your robot should perform..."
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button
                        onClick={addTask}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Suggested Tasks
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {taskSuggestions.map(task => (
                        <button
                            key={task}
                            onClick={() => addSuggestedTask(task)}
                            disabled={config.tasks?.includes(task)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                config.tasks?.includes(task)
                                    ? 'bg-green-600/20 text-green-300 cursor-not-allowed'
                                    : 'bg-white/10 hover:bg-white/20 text-gray-300'
                            }`}
                        >
                            {task}
                        </button>
                    ))}
                </div>
            </div>

            {config.tasks && config.tasks.length > 0 && (
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Selected Tasks ({config.tasks.length})
                    </label>
                    <div className="space-y-2">
                        {config.tasks.map((task, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-sm">{task}</span>
                                <button
                                    onClick={() => removeTask(task)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">⏰ Schedule & Behavior</h3>
                <p className="text-gray-300 text-sm mb-4">Configure when and how your robot should operate.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Frequency
                    </label>
                    <select
                        value={config.schedule?.frequency || 'daily'}
                        onChange={(e) => setConfig(prev => ({
                            ...prev,
                            schedule: { ...prev.schedule!, frequency: e.target.value as any }
                        }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Time
                    </label>
                    <input
                        type="time"
                        value={config.schedule?.time || '09:00'}
                        onChange={(e) => setConfig(prev => ({
                            ...prev,
                            schedule: { ...prev.schedule!, time: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Priority Level
                    </label>
                    <select
                        value={config.priority || 'medium'}
                        onChange={(e) => setConfig(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Budget Limit (EHBGC)
                    </label>
                    <input
                        type="number"
                        value={config.budgetLimit || 100}
                        onChange={(e) => setConfig(prev => ({ ...prev, budgetLimit: Number(e.target.value) }))}
                        min="0"
                        max="10000"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Language
                    </label>
                    <select
                        value={config.language || 'english'}
                        onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="english">English</option>
                        <option value="urdu">Urdu</option>
                        <option value="both">Both</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Voice Enabled
                    </label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={config.voiceEnabled || false}
                                onChange={(e) => setConfig(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm">Enable voice commands</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">⚙️ Advanced Settings</h3>
                <p className="text-gray-300 text-sm mb-4">Configure advanced behavior and notifications.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                        <h4 className="font-medium">Push Notifications</h4>
                        <p className="text-sm text-gray-300">Receive notifications when robot completes tasks</p>
                    </div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={config.notifications || false}
                            onChange={(e) => setConfig(prev => ({ ...prev, notifications: e.target.checked }))}
                            className="mr-2"
                        />
                        <span className="text-sm">Enable</span>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                        <h4 className="font-medium">Auto Execute</h4>
                        <p className="text-sm text-gray-300">Allow robot to execute tasks automatically without confirmation</p>
                    </div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={config.autoExecute || false}
                            onChange={(e) => setConfig(prev => ({ ...prev, autoExecute: e.target.checked }))}
                            className="mr-2"
                        />
                        <span className="text-sm">Enable</span>
                    </label>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Robot Summary</h4>
                <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {config.name}</div>
                    <div><strong>Tasks:</strong> {config.tasks?.length || 0} tasks</div>
                    <div><strong>Schedule:</strong> {config.schedule?.frequency} at {config.schedule?.time}</div>
                    <div><strong>Budget:</strong> {config.budgetLimit} EHBGC</div>
                    <div><strong>Language:</strong> {config.language}</div>
                    <div><strong>Voice:</strong> {config.voiceEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">🤖 Create Your Own Robot</h2>
                        <p className="text-gray-300">Build a custom AI assistant</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Step {step} of 4</span>
                        <span className="text-sm text-gray-300">{Math.round((step / 4) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 4) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step Content */}
                <div className="mb-6">
                    {renderStepContent()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            step === 1
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                    >
                        ← Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handleCreateRobot}
                            disabled={loading || !config.name || !config.description || (config.tasks?.length || 0) === 0}
                            className={`px-6 py-2 rounded-lg transition-colors ${
                                loading || !config.name || !config.description || (config.tasks?.length || 0) === 0
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {loading ? 'Creating...' : 'Create Robot'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RobotCreator;
