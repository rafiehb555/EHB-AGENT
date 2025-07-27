import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Mic, Type, Send, Settings, User, MessageCircle } from 'react-icons/fi';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'robot';
  timestamp: Date;
  type?: 'text' | 'voice';
}

interface RobotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RobotModal: React.FC<RobotModalProps> = ({ isOpen, onClose }) => {
  const [selectedMode, setSelectedMode] = useState<'robot' | 'assistant' | 'agent'>('robot');
  const [inputType, setInputType] = useState<'text' | 'voice'>('text');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your EHB Robot. How can I help you today?',
      sender: 'robot',
      timestamp: new Date()
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const modes = [
    { id: 'robot', name: 'EHB Robot', icon: Bot, description: 'Auto actions & smart assistance' },
    { id: 'assistant', name: 'EHB Assistant', icon: MessageCircle, description: 'Text-based AI chat' },
    { id: 'agent', name: 'EHB Agent', icon: User, description: 'Help & guidance only' }
  ];

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

    // Simulate robot response
    setTimeout(() => {
      const robotResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I understand you said: "${inputText}". I'm processing your request...`,
        sender: 'robot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, robotResponse]);
      setIsProcessing(false);
    }, 1000);
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
                  onClick={() => {/* Settings modal */}}
                >
                  <Settings size={20} />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={onClose}
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
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{mode.name}</span>
                  </button>
                );
              })}
            </div>

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
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
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
