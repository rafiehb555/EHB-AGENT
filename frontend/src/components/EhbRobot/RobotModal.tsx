import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Mic, Type, Send, Settings, User, MessageCircle, CheckCircle, AlertCircle, Lightbulb, TrendingUp, Brain } from 'react-icons/fi';
import { parseCommand, executeCommand } from '../../utils/robotCommands';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'robot';
  timestamp: Date;
  type?: 'text' | 'voice';
  action?: any;
  status?: 'success' | 'error' | 'processing';
  suggestions?: any[];
  learning?: any;
}

interface RobotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RobotModal = ({ isOpen, onClose }: RobotModalProps) => {
  const [selectedMode, setSelectedMode] = useState<'robot' | 'assistant' | 'agent'>('robot');
  const [inputType, setInputType] = useState<'text' | 'voice'>('text');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your EHB Robot. How can I help you today?',
      sender: 'robot',
      timestamp: new Date(),
      status: 'success'
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [learningStats, setLearningStats] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
      loadLearningStats();
    }
  }, [isOpen]);

  const modes = [
    { id: 'robot', name: 'EHB Robot', icon: Bot, description: 'AI-powered with learning' },
    { id: 'assistant', name: 'EHB Assistant', icon: MessageCircle, description: 'Text-based AI chat' },
    { id: 'agent', name: 'EHB Agent', icon: User, description: 'Help & guidance only' }
  ];

  const loadUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/robot/profile/demo-user');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadLearningStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/robot/analytics');
      if (response.ok) {
        const data = await response.json();
        setLearningStats(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load learning stats:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Process command based on mode
    if (selectedMode === 'robot') {
      await processRobotCommand(inputText);
    } else {
      // Simple chat response for assistant/agent modes
      setTimeout(() => {
        const robotResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `I understand you said: "${inputText}". How can I assist you further?`,
          sender: 'robot',
          timestamp: new Date(),
          status: 'success'
        };
        setMessages(prev => [...prev, robotResponse]);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const processRobotCommand = async (command: string) => {
    try {
      // Parse the command
      const parsedCommand = parseCommand(command);

      if (parsedCommand) {
        // Show processing message
        const processingMessage: Message = {
          id: (Date.now() + 0.5).toString(),
          text: `Processing: "${parsedCommand.original}"...`,
          sender: 'robot',
          timestamp: new Date(),
          status: 'processing'
        };
        setMessages(prev => [...prev, processingMessage]);

        // Execute the command with AI learning
        const result = await executeCommand(parsedCommand);

        // Update processing message with result
        const resultMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.message,
          sender: 'robot',
          timestamp: new Date(),
          status: result.success ? 'success' : 'error',
          action: result,
          suggestions: result.suggestions || [],
          learning: result.learning
        };

        setMessages(prev => {
          const newMessages = [...prev];
          // Replace processing message with result
          const processingIndex = newMessages.findIndex(m => m.id === processingMessage.id);
          if (processingIndex !== -1) {
            newMessages[processingIndex] = resultMessage;
          }
          return newMessages;
        });

        // If it's a navigation command, handle it
        if (parsedCommand.action.type === 'navigate' && result.success) {
          // TODO: Implement actual navigation
          console.log('Navigating to:', result.page);
        }

        // Reload user profile and stats after learning
        await loadUserProfile();
        await loadLearningStats();
      } else {
        // Command not understood
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `I didn't understand: "${command}". Try saying something like "Order 2 cold drinks" or "Open GoSellr".`,
          sender: 'robot',
          timestamp: new Date(),
          status: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Command processing error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error processing your command. Please try again.',
        sender: 'robot',
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);

      // Auto-send voice commands in robot mode
      if (selectedMode === 'robot') {
        setTimeout(() => {
          handleSendMessage();
        }, 500);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'processing':
        return <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>;
      default:
        return null;
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setInputText(suggestion.text);
    setShowSuggestions(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {modes.find(m => m.id === selectedMode)?.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {modes.find(m => m.id === selectedMode)?.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  title="AI Suggestions"
                  aria-label="Toggle AI suggestions"
                >
                  <Lightbulb size={20} />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => {/* Settings modal */}}
                  title="Settings"
                  aria-label="Open settings"
                >
                  <Settings size={20} />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={onClose}
                  title="Close"
                  aria-label="Close robot modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex space-x-2 p-4 border-b border-gray-200">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      selectedMode === mode.id
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={`Switch to ${mode.name} mode`}
                    aria-label={`Switch to ${mode.name} mode`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{mode.name}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Learning Stats */}
            {selectedMode === 'robot' && learningStats && (
              <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Brain size={12} className="text-purple-600" />
                      <span className="text-purple-600 font-medium">
                        {learningStats.totalUsers} users
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <TrendingUp size={12} className="text-blue-600" />
                      <span className="text-blue-600 font-medium">
                        {learningStats.avgSuccessRate}% success
                      </span>
                    </span>
                  </div>
                  <span className="text-gray-500">
                    AI Learning Active
                  </span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>

                        {/* AI Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-blue-600">💡 Suggestions:</p>
                            {message.suggestions.slice(0, 3).map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="block text-xs text-blue-500 hover:text-blue-700 underline"
                              >
                                {suggestion.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {getStatusIcon(message.status)}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isProcessing && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestions Panel */}
            {showSuggestions && selectedMode === 'robot' && (
              <motion.div
                className="border-t border-gray-200 p-4 bg-gradient-to-r from-purple-50 to-blue-50"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center space-x-1">
                  <Lightbulb size={14} className="text-purple-600" />
                  <span>AI Suggestions</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {userProfile?.commonItems?.slice(0, 4).map((item: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick({ text: `Order ${item.name}` })}
                      className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50 transition-colors"
                    >
                      Order {item.name}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSuggestionClick({ text: 'Check my wallet balance' })}
                    className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50 transition-colors"
                  >
                    Check Balance
                  </button>
                  <button
                    onClick={() => handleSuggestionClick({ text: 'Open GoSellr' })}
                    className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50 transition-colors"
                  >
                    Open GoSellr
                  </button>
                </div>
              </motion.div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                {/* Input Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setInputType('text')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      inputType === 'text'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="Switch to text input"
                    aria-label="Switch to text input"
                  >
                    <Type size={16} />
                  </button>
                  <button
                    onClick={() => setInputType('voice')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      inputType === 'voice'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="Switch to voice input"
                    aria-label="Switch to voice input"
                  >
                    <Mic size={16} />
                  </button>
                </div>

                {/* Input Field */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      inputType === 'voice'
                        ? "Click microphone to speak..."
                        : selectedMode === 'robot'
                          ? "Try: Order 2 cold drinks, Open GoSellr..."
                          : "Type your message..."
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={inputType === 'voice'}
                  />

                  {inputType === 'voice' && (
                    <button
                      onClick={handleVoiceInput}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                      title={isListening ? "Listening..." : "Start voice input"}
                      aria-label={isListening ? "Listening..." : "Start voice input"}
                    >
                      <Mic size={16} />
                    </button>
                  )}
                </div>

                {/* Send Button */}
                {inputType === 'text' && (
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RobotModal;
