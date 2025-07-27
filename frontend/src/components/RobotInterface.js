import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiSend, FiSettings, FiVolume2, FiVolumeX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Components
import ChatMessage from './ChatMessage';
import VoiceVisualizer from './VoiceVisualizer';
import AdvancedFeaturesPanel from './AdvancedFeaturesPanel';

// Hooks
import { useRobotStore } from '../hooks/useRobotStore';
import { useVoiceAPI } from '../hooks/useVoiceAPI';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

// Styles
import './RobotInterface.css';

const RobotInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [voiceMode, setVoiceMode] = useState('standard'); // standard, telepathy, cross-service
  const [recognitionMethod, setRecognitionMethod] = useState('auto'); // auto, browser, whisper

  const messagesEndRef = useRef(null);
  const { robotStatus, updateRobotStatus } = useRobotStore();
  const { processVoiceText, speakText } = useVoiceAPI();

  // Voice recognition hook
  const {
    isListening,
    transcript,
    isSupported,
    recognitionMethod: currentRecognitionMethod,
    isProcessing,
    toggleListening,
    clearTranscript,
    switchMethod,
    getStatus,
    getSupportedMethods
  } = useVoiceRecognition();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    addMessage('robot', 'Hello! I am EHB AI Robot (SIVOS™ PRO MAX). How can I help you today?', 'welcome');
  }, []);

  // Update input text when transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      setInputText(transcript);
    }
  }, [transcript, isListening]);

  // Update robot status based on voice recognition
  useEffect(() => {
    const status = getStatus();
    if (status === 'listening') {
      updateRobotStatus('listening');
    } else if (status === 'processing') {
      updateRobotStatus('processing');
    } else if (status === 'idle' && robotStatus === 'listening') {
      updateRobotStatus('ready');
    }
  }, [isListening, isProcessing, getStatus, updateRobotStatus, robotStatus]);

  const addMessage = (sender, text, type = 'text', data = {}) => {
    const newMessage = {
      id: Date.now(),
      sender,
      text,
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleVoiceInput = async (text) => {
    if (!text.trim()) return;

    // Add user message
    addMessage('user', text, 'voice');

    // Update robot status
    updateRobotStatus('processing');

    try {
      // Process with AI
      const response = await processVoiceText(text, { mode: voiceMode });

      // Add robot response
      addMessage('robot', response, 'ai');

      // Speak the response
      await speakText(response);

      updateRobotStatus('ready');
    } catch (error) {
      console.error('Voice processing error:', error);
      addMessage('robot', 'Sorry, I encountered an error. Please try again.', 'error');
      updateRobotStatus('error');
      toast.error('Voice processing failed');
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    await handleVoiceInput(inputText);
    setInputText('');
    clearTranscript();
  };

  const handleVoiceButtonClick = () => {
    if (isListening) {
      toggleListening();
    } else {
      // Auto-detect best method if set to auto
      if (recognitionMethod === 'auto') {
        const methods = getSupportedMethods();
        if (methods.includes('browser')) {
          switchMethod('browser');
        } else {
          switchMethod('whisper');
        }
      }
      toggleListening();
    }
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    toast.success(isSpeaking ? 'Voice disabled' : 'Voice enabled');
  };

  const handleAdvancedFeature = (feature, data) => {
    addMessage('robot', `Activating ${feature}...`, 'feature', { feature, data });
    // Handle different advanced features
    switch (feature) {
      case 'telepathy':
        setVoiceMode('telepathy');
        toast.success('Telepathy mode activated!');
        break;
      case 'cross-service':
        setVoiceMode('cross-service');
        toast.success('Cross-service mode activated!');
        break;
      case 'voice-vault':
        toast.success('Voice vault accessed!');
        break;
      default:
        toast.info(`Feature: ${feature}`);
    }
  };

  const getRecognitionMethodDisplay = () => {
    if (recognitionMethod === 'auto') {
      return currentRecognitionMethod === 'browser' ? 'Browser' : 'Whisper';
    }
    return recognitionMethod === 'browser' ? 'Browser' : 'Whisper';
  };

  const getRecognitionStatus = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    return 'Ready';
  };

  return (
    <div className="robot-interface">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="interface-container"
      >
        {/* Header */}
        <div className="interface-header">
          <div className="robot-status">
            <div className={`status-indicator ${robotStatus}`}>
              <div className="status-dot"></div>
              <span className="status-text">{robotStatus}</span>
            </div>
          </div>

          <div className="interface-controls">
            <motion.button
              className={`control-button ${isSpeaking ? 'active' : ''}`}
              onClick={toggleSpeaking}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isSpeaking ? 'Disable Voice' : 'Enable Voice'}
            >
              {isSpeaking ? <FiVolume2 /> : <FiVolumeX />}
            </motion.button>

            <motion.button
              className="control-button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Advanced Features"
            >
              <FiSettings />
            </motion.button>
          </div>
        </div>

        {/* Advanced Features Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="advanced-panel"
            >
              <AdvancedFeaturesPanel
                onFeatureSelect={handleAdvancedFeature}
                currentMode={voiceMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div className="chat-container">
          <div className="messages-list">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.sender === 'user' ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Voice Visualizer */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="voice-visualizer-container"
          >
            <VoiceVisualizer isListening={isListening} />
          </motion.div>
        )}

        {/* Input Area */}
        <div className="input-area">
          <form onSubmit={handleTextSubmit} className="input-form">
            <div className="input-container">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message or use voice..."
                className="text-input"
                disabled={isListening}
              />

              <motion.button
                type="submit"
                className="send-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={!inputText.trim() || isListening}
              >
                <FiSend />
              </motion.button>
            </div>
          </form>

          {/* Voice Button */}
          <motion.button
            className={`voice-button ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceButtonClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={!isSupported && currentRecognitionMethod === 'browser'}
            title={`${getRecognitionStatus()} (${getRecognitionMethodDisplay()})`}
          >
            {isListening ? <FiMicOff /> : <FiMic />}
            {isListening && <div className="listening-indicator"></div>}
          </motion.button>
        </div>

        {/* Voice Recognition Status */}
        <div className="voice-status">
          <div className="status-info">
            <span className="status-label">Voice Recognition:</span>
            <span className={`status-value ${getStatus()}`}>
              {getRecognitionStatus()}
            </span>
          </div>

          <div className="method-info">
            <span className="method-label">Method:</span>
            <span className="method-value">{getRecognitionMethodDisplay()}</span>
          </div>

          {transcript && (
            <div className="transcript-info">
              <span className="transcript-label">Transcript:</span>
              <span className="transcript-value">{transcript}</span>
            </div>
          )}
        </div>

        {/* Voice Mode Indicator */}
        {voiceMode !== 'standard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="voice-mode-indicator"
          >
            <span className="mode-icon">
              {voiceMode === 'telepathy' ? '🧠' : '🔗'}
            </span>
            <span className="mode-text">
              {voiceMode === 'telepathy' ? 'Telepathy Mode' : 'Cross-Service Mode'}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default RobotInterface;
