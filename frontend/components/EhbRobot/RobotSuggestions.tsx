import React, { useState, useEffect } from 'react';
import RobotMemory from '../../../utils/robotMemory';
import RobotEmotionEngine from '../../../utils/robotEmotionEngine';

interface Suggestion {
    id: string;
    text: string;
    type: 'typing' | 'smart' | 'quick';
    confidence: number;
    action?: string;
}

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: string;
    action: string;
    color: string;
}

interface RobotSuggestionsProps {
    userId: string;
    onSuggestionClick: (suggestion: string) => void;
    onQuickActionClick: (action: string) => void;
    currentInput?: string;
    showQuickActions?: boolean;
}

const RobotSuggestions: React.FC<RobotSuggestionsProps> = ({
    userId,
    onSuggestionClick,
    onQuickActionClick,
    currentInput = '',
    showQuickActions = true
}) => {
    const [typingSuggestions, setTypingSuggestions] = useState<string[]>([]);
    const [smartSuggestions, setSmartSuggestions] = useState<Suggestion[]>([]);
    const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const robotMemory = new RobotMemory();
    const emotionEngine = new RobotEmotionEngine();

    useEffect(() => {
        if (userId) {
            loadSuggestions();
            loadQuickActions();
        }
    }, [userId, currentInput]);

    const loadSuggestions = async () => {
        try {
            setLoading(true);

            // Get typing suggestions
            if (currentInput.length > 2) {
                const typingSuggestions = await robotMemory.getTypingSuggestions(userId, currentInput);
                setTypingSuggestions(typingSuggestions);
            } else {
                setTypingSuggestions([]);
            }

            // Get smart suggestions
            const smartSuggestions = await robotMemory.getSmartSuggestions(userId, currentInput);
            const formattedSuggestions: Suggestion[] = smartSuggestions.map((suggestion, index) => ({
                id: `smart_${index}`,
                text: suggestion.title,
                type: 'smart',
                confidence: suggestion.confidence,
                action: suggestion.action
            }));
            setSmartSuggestions(formattedSuggestions);

            setShowSuggestions(typingSuggestions.length > 0 || formattedSuggestions.length > 0);
        } catch (error) {
            console.error('Load suggestions error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadQuickActions = async () => {
        try {
            const preferences = await robotMemory.loadUserPreferences(userId);
            if (!preferences) return;

            const actions: QuickAction[] = [];

            // Repeat last order
            if (preferences.history.totalOrders > 0) {
                actions.push({
                    id: 'repeat_order',
                    title: 'Repeat Last Order',
                    description: 'Quick reorder of your previous items',
                    icon: '🔄',
                    action: 'repeat_last_order',
                    color: 'bg-blue-500'
                });
            }

            // Schedule delivery
            actions.push({
                id: 'schedule_delivery',
                title: 'Schedule Delivery',
                description: 'Set up recurring deliveries',
                icon: '📅',
                action: 'schedule_delivery',
                color: 'bg-green-500'
            });

            // Book last used service
            if (preferences.preferences.topServices.length > 0) {
                actions.push({
                    id: 'book_service',
                    title: `Book ${preferences.preferences.topServices[0]}`,
                    description: 'Reconnect with your preferred service provider',
                    icon: '🔧',
                    action: `book_${preferences.preferences.topServices[0].toLowerCase()}`,
                    color: 'bg-purple-500'
                });
            }

            // Morning routine
            const currentHour = new Date().getHours();
            if (currentHour >= 6 && currentHour <= 10) {
                actions.push({
                    id: 'morning_routine',
                    title: 'Morning Routine',
                    description: 'Your usual morning order',
                    icon: '🌅',
                    action: 'morning_routine',
                    color: 'bg-orange-500'
                });
            }

            // Evening routine
            if (currentHour >= 17 && currentHour <= 21) {
                actions.push({
                    id: 'evening_routine',
                    title: 'Evening Routine',
                    description: 'Your usual evening order',
                    icon: '🌆',
                    action: 'evening_routine',
                    color: 'bg-indigo-500'
                });
            }

            setQuickActions(actions);
        } catch (error) {
            console.error('Load quick actions error:', error);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onSuggestionClick(suggestion);
        setShowSuggestions(false);
    };

    const handleQuickActionClick = (action: string) => {
        onQuickActionClick(action);
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-400';
        if (confidence >= 0.6) return 'text-yellow-400';
        return 'text-gray-400';
    };

    const getConfidenceText = (confidence: number) => {
        if (confidence >= 0.8) return 'High confidence';
        if (confidence >= 0.6) return 'Medium confidence';
        return 'Low confidence';
    };

    if (loading) {
        return (
            <div className="p-4">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-400">Loading suggestions...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Quick Actions */}
            {showQuickActions && quickActions.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        ⚡ Quick Actions for You
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {quickActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleQuickActionClick(action.action)}
                                className={`${action.color} hover:opacity-80 transition-opacity rounded-lg p-3 text-white text-left`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="text-xl">{action.icon}</span>
                                    <div>
                                        <h4 className="font-semibold text-sm">{action.title}</h4>
                                        <p className="text-xs opacity-90">{action.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        💡 Smart Suggestions
                    </h3>
                    <div className="space-y-2">
                        {smartSuggestions.map(suggestion => (
                            <button
                                key={suggestion.id}
                                onClick={() => handleSuggestionClick(suggestion.text)}
                                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{suggestion.text}</p>
                                        <p className="text-sm text-gray-300">
                                            Based on your preferences
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                                            {getConfidenceText(suggestion.confidence)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {Math.round(suggestion.confidence * 100)}%
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Typing Suggestions */}
            {showSuggestions && typingSuggestions.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        ✨ Typing Suggestions
                    </h3>
                    <div className="space-y-2">
                        {typingSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="text-blue-400">→</span>
                                    <span>{suggestion}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* No Suggestions */}
            {!loading && !showSuggestions && smartSuggestions.length === 0 && quickActions.length === 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
                    <p className="text-gray-400">Start typing to see personalized suggestions</p>
                </div>
            )}
        </div>
    );
};

export default RobotSuggestions;
