import React, { useState, useEffect } from 'react';

interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileFeatures {
    isPWA: boolean;
    isInstalled: boolean;
    canInstall: boolean;
    hasVoiceInput: boolean;
    hasNotifications: boolean;
    isFullScreen: boolean;
}

const RobotMobileLauncher: React.FC = () => {
    const [mobileFeatures, setMobileFeatures] = useState<MobileFeatures>({
        isPWA: false,
        isInstalled: false,
        canInstall: false,
        hasVoiceInput: false,
        hasNotifications: false,
        isFullScreen: false
    });
    const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        checkMobileFeatures();
        setupInstallPrompt();
        checkNotificationPermission();
        setupFullScreenListener();
    }, []);

    const checkMobileFeatures = () => {
        const features: MobileFeatures = {
            isPWA: window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true,
            isInstalled: window.matchMedia('(display-mode: standalone)').matches,
            canInstall: false, // Will be set by install prompt
            hasVoiceInput: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
            hasNotifications: 'Notification' in window,
            isFullScreen: document.fullscreenElement !== null
        };

        setMobileFeatures(features);
    };

    const setupInstallPrompt = () => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPrompt(e as InstallPromptEvent);
            setMobileFeatures(prev => ({ ...prev, canInstall: true }));
        });
    };

    const checkNotificationPermission = () => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    };

    const setupFullScreenListener = () => {
        document.addEventListener('fullscreenchange', () => {
            setMobileFeatures(prev => ({
                ...prev,
                isFullScreen: document.fullscreenElement !== null
            }));
        });
    };

    const handleInstallPWA = async () => {
        if (!installPrompt) return;

        try {
            await installPrompt.prompt();
            const choice = await installPrompt.userChoice;

            if (choice.outcome === 'accepted') {
                console.log('✅ PWA installed successfully');
                setMobileFeatures(prev => ({
                    ...prev,
                    isInstalled: true,
                    canInstall: false
                }));
            }
        } catch (error) {
            console.error('Install PWA error:', error);
        }
    };

    const startVoiceInput = () => {
        if (!mobileFeatures.hasVoiceInput) return;

        const SpeechRecognition = (window as any).SpeechRecognition ||
                                (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceText('Listening...');
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setVoiceText(transcript);
            setIsListening(false);

            // Process the voice command
            processVoiceCommand(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Voice recognition error:', event.error);
            setIsListening(false);
            setVoiceText('Error: ' + event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const processVoiceCommand = (command: string) => {
        // Process the voice command and send to robot
        console.log('Processing voice command:', command);

        // Simulate robot processing
        setTimeout(() => {
            alert(`🤖 Robot processed: "${command}"`);
        }, 1000);
    };

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) return;

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                // Show welcome notification
                new Notification('EHB Robot', {
                    body: 'Welcome! I\'m ready to help you.',
                    icon: '/robot-icon.png'
                });
            }
        } catch (error) {
            console.error('Request notification permission error:', error);
        }
    };

    const toggleFullScreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    const openRobotApp = () => {
        // Open robot in full-screen mode
        window.open('/ehb-robot', '_blank', 'fullscreen=yes');
    };

    const addToHomeScreen = () => {
        // Show instructions for adding to home screen
        const instructions = `
📱 Add EHB Robot to Home Screen:

iOS Safari:
1. Tap the Share button (square with arrow)
2. Tap "Add to Home Screen"
3. Tap "Add"

Android Chrome:
1. Tap the menu (three dots)
2. Tap "Add to Home screen"
3. Tap "Add"

This will create a shortcut that opens EHB Robot in full-screen mode!
        `;

        alert(instructions);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-4">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">🤖 EHB Robot</h1>
                    <p className="text-gray-300">Your AI Assistant</p>
                </div>

                {/* Status Cards */}
                <div className="space-y-4 mb-8">
                    {/* PWA Status */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">App Status</h3>
                                <p className="text-sm text-gray-300">
                                    {mobileFeatures.isInstalled ? '✅ Installed' : '📱 Web App'}
                                </p>
                            </div>
                            {mobileFeatures.canInstall && (
                                <button
                                    onClick={handleInstallPWA}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    Install App
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Voice Input */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Voice Input</h3>
                                <p className="text-sm text-gray-300">
                                    {mobileFeatures.hasVoiceInput ? '✅ Available' : '❌ Not supported'}
                                </p>
                            </div>
                            {mobileFeatures.hasVoiceInput && (
                                <button
                                    onClick={startVoiceInput}
                                    disabled={isListening}
                                    className={`rounded-full w-12 h-12 flex items-center justify-center transition-colors ${
                                        isListening
                                            ? 'bg-red-600 animate-pulse'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {isListening ? '🔴' : '🎤'}
                                </button>
                            )}
                        </div>
                        {voiceText && (
                            <div className="mt-2 p-2 bg-black/20 rounded text-sm">
                                "{voiceText}"
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Notifications</h3>
                                <p className="text-sm text-gray-300">
                                    {notificationPermission === 'granted' ? '✅ Enabled' :
                                     notificationPermission === 'denied' ? '❌ Blocked' : '⚠️ Not set'}
                                </p>
                            </div>
                            {notificationPermission !== 'granted' && (
                                <button
                                    onClick={requestNotificationPermission}
                                    className="bg-yellow-600 hover:bg-yellow-700 rounded-lg px-3 py-1 text-sm font-medium transition-colors"
                                >
                                    Enable
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    {/* Launch Robot */}
                    <button
                        onClick={openRobotApp}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg p-4 font-semibold text-lg transition-all transform hover:scale-105"
                    >
                        🚀 Launch EHB Robot
                    </button>

                    {/* Add to Home Screen */}
                    <button
                        onClick={addToHomeScreen}
                        className="w-full bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-lg p-4 font-medium transition-colors"
                    >
                        📱 Add to Home Screen
                    </button>

                    {/* Full Screen Mode */}
                    <button
                        onClick={toggleFullScreen}
                        className="w-full bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-lg p-4 font-medium transition-colors"
                    >
                        {mobileFeatures.isFullScreen ? '📱 Exit Full Screen' : '🖥️ Full Screen Mode'}
                    </button>

                    {/* Voice Commands */}
                    {mobileFeatures.hasVoiceInput && (
                        <button
                            onClick={startVoiceInput}
                            disabled={isListening}
                            className={`w-full rounded-lg p-4 font-medium transition-colors ${
                                isListening
                                    ? 'bg-red-600 animate-pulse'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {isListening ? '🔴 Listening...' : '🎤 Voice Commands'}
                        </button>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => processVoiceCommand('Book my weekly groceries')}
                            className="bg-white/5 hover:bg-white/10 rounded-lg p-3 text-sm transition-colors"
                        >
                            🛒 Groceries
                        </button>
                        <button
                            onClick={() => processVoiceCommand('Schedule AC service')}
                            className="bg-white/5 hover:bg-white/10 rounded-lg p-3 text-sm transition-colors"
                        >
                            🔧 Services
                        </button>
                        <button
                            onClick={() => processVoiceCommand('Book doctor appointment')}
                            className="bg-white/5 hover:bg-white/10 rounded-lg p-3 text-sm transition-colors"
                        >
                            👨‍⚕️ Medical
                        </button>
                        <button
                            onClick={() => processVoiceCommand('Set reminder for meeting')}
                            className="bg-white/5 hover:bg-white/10 rounded-lg p-3 text-sm transition-colors"
                        >
                            ⏰ Reminders
                        </button>
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-8 bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">💡 Tips</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Install the app for the best experience</li>
                        <li>• Use voice commands for hands-free operation</li>
                        <li>• Enable notifications for task updates</li>
                        <li>• Add to home screen for quick access</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RobotMobileLauncher;
