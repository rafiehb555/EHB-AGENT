import React, { useState, useEffect, useRef } from 'react';

interface VoiceCommand {
    id: string;
    command: string;
    action: string;
    description: string;
    category: 'navigation' | 'order' | 'service' | 'wallet' | 'general';
}

interface VoiceResponse {
    message: string;
    action?: string;
    data?: any;
    confidence: number;
}

interface RobotVoiceOnlyProps {
    userId?: string;
    walletAddress?: string;
    onCommandExecute: (command: string, data?: any) => void;
    onExitVoiceMode: () => void;
}

const RobotVoiceOnly: React.FC<RobotVoiceOnlyProps> = ({
    userId,
    walletAddress,
    onCommandExecute,
    onExitVoiceMode
}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [responses, setResponses] = useState<VoiceResponse[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('Ready to listen');

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    // Available voice commands
    const voiceCommands: VoiceCommand[] = [
        // Navigation commands
        { id: '1', command: 'go to gosellr', action: 'navigate', description: 'Navigate to GoSellr platform', category: 'navigation' },
        { id: '2', command: 'go to wallet', action: 'navigate', description: 'Open wallet interface', category: 'navigation' },
        { id: '3', command: 'go to robot store', action: 'navigate', description: 'Open robot marketplace', category: 'navigation' },
        { id: '4', command: 'go to settings', action: 'navigate', description: 'Open settings page', category: 'navigation' },

        // Order commands
        { id: '5', command: 'place milk order', action: 'order', description: 'Place order for milk', category: 'order' },
        { id: '6', command: 'order bread', action: 'order', description: 'Place order for bread', category: 'order' },
        { id: '7', command: 'order water bottles', action: 'order', description: 'Place order for water bottles', category: 'order' },
        { id: '8', command: 'repeat last order', action: 'order', description: 'Repeat your last order', category: 'order' },
        { id: '9', command: 'check order status', action: 'order', description: 'Check current order status', category: 'order' },

        // Service commands
        { id: '10', command: 'book electrician', action: 'service', description: 'Book electrician service', category: 'service' },
        { id: '11', command: 'book ac service', action: 'service', description: 'Book AC maintenance service', category: 'service' },
        { id: '12', command: 'book plumber', action: 'service', description: 'Book plumber service', category: 'service' },
        { id: '13', command: 'schedule delivery', action: 'service', description: 'Schedule a delivery', category: 'service' },

        // Wallet commands
        { id: '14', command: 'check wallet balance', action: 'wallet', description: 'Check wallet balance', category: 'wallet' },
        { id: '15', command: 'show transactions', action: 'wallet', description: 'Show recent transactions', category: 'wallet' },
        { id: '16', command: 'transfer funds', action: 'wallet', description: 'Transfer funds to another wallet', category: 'wallet' },

        // General commands
        { id: '17', command: 'exit voice mode', action: 'exit', description: 'Exit voice-only mode', category: 'general' },
        { id: '18', command: 'help', action: 'help', description: 'Show available commands', category: 'general' },
        { id: '19', command: 'what can you do', action: 'help', description: 'List available capabilities', category: 'general' },
        { id: '20', command: 'stop listening', action: 'stop', description: 'Stop voice recognition', category: 'general' }
    ];

    useEffect(() => {
        initializeVoiceRecognition();
        initializeSpeechSynthesis();

        // Auto-start listening after 2 seconds
        const timer = setTimeout(() => {
            if (voiceEnabled) {
                startListening();
            }
        }, 2000);

        return () => {
            clearTimeout(timer);
            stopListening();
        };
    }, [voiceEnabled]);

    const initializeVoiceRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();

            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setCurrentStatus('Listening...');
                speak('Voice mode activated. I am ready to help you.');
            };

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setTranscript(finalTranscript.toLowerCase());
                    processVoiceCommand(finalTranscript.toLowerCase());
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Voice recognition error:', event.error);
                setCurrentStatus(`Error: ${event.error}`);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                setCurrentStatus('Voice recognition stopped');
            };

            setVoiceEnabled(true);
        } else {
            setCurrentStatus('Voice recognition not supported');
            setVoiceEnabled(false);
        }
    };

    const initializeSpeechSynthesis = () => {
        synthesisRef.current = window.speechSynthesis;
    };

    const startListening = () => {
        if (recognitionRef.current && voiceEnabled) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Failed to start voice recognition:', error);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.error('Failed to stop voice recognition:', error);
            }
        }
    };

    const speak = (text: string) => {
        if (synthesisRef.current) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            synthesisRef.current.speak(utterance);
        }
    };

    const processVoiceCommand = async (command: string) => {
        setIsProcessing(true);
        setCurrentStatus('Processing command...');

        // Find matching command
        const matchedCommand = voiceCommands.find(cmd =>
            command.includes(cmd.command) || cmd.command.includes(command)
        );

        if (matchedCommand) {
            const response = await executeCommand(matchedCommand, command);
            setResponses(prev => [...prev, response]);

            // Speak the response
            speak(response.message);

            // Execute the action
            if (response.action) {
                onCommandExecute(response.action, response.data);
            }
        } else {
            const response: VoiceResponse = {
                message: `I didn't understand that command. Please try again or say "help" for available commands.`,
                confidence: 0.1
            };
            setResponses(prev => [...prev, response]);
            speak(response.message);
        }

        setIsProcessing(false);
        setCurrentStatus('Ready for next command');

        // Restart listening after processing
        setTimeout(() => {
            if (voiceEnabled) {
                startListening();
            }
        }, 1000);
    };

    const executeCommand = async (command: VoiceCommand, originalCommand: string): Promise<VoiceResponse> => {
        switch (command.action) {
            case 'navigate':
                return {
                    message: `Navigating to ${command.description}.`,
                    action: 'navigate',
                    data: { destination: command.command },
                    confidence: 0.9
                };

            case 'order':
                return {
                    message: `I'll help you ${command.description}. Processing your request now.`,
                    action: 'order',
                    data: { item: command.command.replace('order ', '').replace('place ', '') },
                    confidence: 0.8
                };

            case 'service':
                return {
                    message: `I'll ${command.description} for you. Let me schedule that now.`,
                    action: 'service',
                    data: { service: command.command.replace('book ', '') },
                    confidence: 0.8
                };

            case 'wallet':
                return {
                    message: `I'll ${command.description} for you.`,
                    action: 'wallet',
                    data: { action: command.command },
                    confidence: 0.9
                };

            case 'exit':
                onExitVoiceMode();
                return {
                    message: 'Exiting voice mode. Returning to normal interface.',
                    action: 'exit',
                    confidence: 1.0
                };

            case 'help':
                const helpMessage = `Available commands: ${voiceCommands.map(cmd => cmd.command).join(', ')}`;
                return {
                    message: helpMessage,
                    confidence: 1.0
                };

            case 'stop':
                stopListening();
                return {
                    message: 'Stopped listening. Say "start listening" to resume.',
                    confidence: 1.0
                };

            default:
                return {
                    message: 'Command executed successfully.',
                    confidence: 0.7
                };
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const showHelp = () => {
        const helpResponse: VoiceResponse = {
            message: `Here are some commands you can try: ${voiceCommands.slice(0, 5).map(cmd => cmd.command).join(', ')}. Say "help" for more commands.`,
            confidence: 1.0
        };
        setResponses(prev => [...prev, helpResponse]);
        speak(helpResponse.message);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 w-full max-w-md mx-4 text-center">
                {/* Voice Mode Header */}
                <div className="mb-6">
                    <div className="text-6xl mb-4">🎤</div>
                    <h1 className="text-2xl font-bold mb-2">Voice-Only Mode</h1>
                    <p className="text-gray-300">Hands-free AI assistant</p>
                </div>

                {/* Status Display */}
                <div className="mb-6">
                    <div className={`text-lg font-semibold mb-2 ${
                        isListening ? 'text-green-400' :
                        isProcessing ? 'text-yellow-400' : 'text-gray-300'
                    }`}>
                        {currentStatus}
                    </div>

                    {/* Visual indicator */}
                    <div className={`w-4 h-4 rounded-full mx-auto ${
                        isListening ? 'bg-green-400 animate-pulse' :
                        isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                </div>

                {/* Current Transcript */}
                {transcript && (
                    <div className="mb-6 p-4 bg-white/5 rounded-lg">
                        <h3 className="text-sm font-medium mb-2">You said:</h3>
                        <p className="text-lg">{transcript}</p>
                    </div>
                )}

                {/* Recent Responses */}
                {responses.length > 0 && (
                    <div className="mb-6 max-h-32 overflow-y-auto">
                        <h3 className="text-sm font-medium mb-2">Recent responses:</h3>
                        {responses.slice(-3).map((response, index) => (
                            <div key={index} className="text-sm text-gray-300 mb-1">
                                {response.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* Control Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={toggleListening}
                        disabled={!voiceEnabled}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                            isListening
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                        } ${!voiceEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
                    </button>

                    <button
                        onClick={showHelp}
                        className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        ❓ Show Help
                    </button>

                    <button
                        onClick={onExitVoiceMode}
                        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        🚪 Exit Voice Mode
                    </button>
                </div>

                {/* Voice Commands List */}
                <div className="mt-6 text-left">
                    <h3 className="text-sm font-medium mb-2">Available Commands:</h3>
                    <div className="text-xs text-gray-400 space-y-1 max-h-20 overflow-y-auto">
                        {voiceCommands.slice(0, 8).map(cmd => (
                            <div key={cmd.id} className="flex justify-between">
                                <span>{cmd.command}</span>
                                <span className="text-gray-500">{cmd.category}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Accessibility Info */}
                <div className="mt-4 text-xs text-gray-500">
                    <p>Voice recognition works best in quiet environments</p>
                    <p>Speak clearly and at normal volume</p>
                </div>
            </div>
        </div>
    );
};

export default RobotVoiceOnly;
