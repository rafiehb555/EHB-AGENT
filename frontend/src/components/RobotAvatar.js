import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX, FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const RobotAvatar = ({
  isListening,
  isSpeaking,
  onWakeWord,
  onVoiceCommand,
  robotStatus = 'idle',
  wakeWord = 'EHB',
  onSettingsChange
}) => {
  const [avatarState, setAvatarState] = useState('idle');
  const [eyeColor, setEyeColor] = useState('#00ff88');
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [customWakeWord, setCustomWakeWord] = useState(wakeWord);
  const [avatarSize, setAvatarSize] = useState('medium');
  const [animationSpeed, setAnimationSpeed] = useState('normal');

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const wakeWordDetectorRef = useRef(null);

  // Avatar states and animations
  const avatarStates = {
    idle: {
      eyeColor: '#00ff88',
      pulseIntensity: 0.3,
      glowIntensity: 0.5,
      rotation: 0
    },
    listening: {
      eyeColor: '#ffff00',
      pulseIntensity: 0.8,
      glowIntensity: 0.9,
      rotation: 5
    },
    speaking: {
      eyeColor: '#ff0088',
      pulseIntensity: 1.0,
      glowIntensity: 1.0,
      rotation: -5
    },
    processing: {
      eyeColor: '#0088ff',
      pulseIntensity: 0.6,
      glowIntensity: 0.7,
      rotation: 0
    },
    error: {
      eyeColor: '#ff0000',
      pulseIntensity: 0.4,
      glowIntensity: 0.6,
      rotation: 0
    }
  };

  // Update avatar state based on robot status
  useEffect(() => {
    setAvatarState(robotStatus);
    setEyeColor(avatarStates[robotStatus]?.eyeColor || '#00ff88');
  }, [robotStatus]);

  // Initialize audio context for wake word detection
  useEffect(() => {
    if (isWakeWordEnabled) {
      initializeWakeWordDetection();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isWakeWordEnabled]);

  const initializeWakeWordDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;

      startWakeWordDetection();
    } catch (error) {
      console.error('Error initializing wake word detection:', error);
      toast.error('Microphone access denied');
    }
  };

  const startWakeWordDetection = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const detectWakeWord = () => {
      if (!isWakeWordEnabled) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Simple wake word detection based on audio patterns
      const averageVolume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

      if (averageVolume > 50) { // Threshold for voice detection
        // In a real implementation, you'd use a proper wake word detection library
        // For now, we'll simulate wake word detection
        setTimeout(() => {
          if (isWakeWordEnabled) {
            onWakeWord?.(customWakeWord);
            toast.success(`Wake word detected: ${customWakeWord}`);
          }
        }, 1000);
      }

      requestAnimationFrame(detectWakeWord);
    };

    detectWakeWord();
  };

  const handleWakeWordToggle = () => {
    setIsWakeWordEnabled(!isWakeWordEnabled);
    if (!isWakeWordEnabled) {
      initializeWakeWordDetection();
    }
  };

  const handleVoiceToggle = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    onSettingsChange?.({ voiceEnabled: !isVoiceEnabled });
  };

  const handleWakeWordChange = (newWakeWord) => {
    setCustomWakeWord(newWakeWord);
    onSettingsChange?.({ wakeWord: newWakeWord });
    toast.success(`Wake word updated to: ${newWakeWord}`);
  };

  const getAvatarSize = () => {
    switch (avatarSize) {
      case 'small': return 'w-32 h-32';
      case 'medium': return 'w-48 h-48';
      case 'large': return 'w-64 h-64';
      default: return 'w-48 h-48';
    }
  };

  const getAnimationSpeed = () => {
    switch (animationSpeed) {
      case 'slow': return 2;
      case 'normal': return 1;
      case 'fast': return 0.5;
      default: return 1;
    }
  };

  return (
    <div className="robot-avatar-container">
      {/* 3D Robot Avatar */}
      <motion.div
        className={`robot-avatar ${getAvatarSize()}`}
        animate={{
          scale: isListening ? 1.1 : 1,
          rotateY: avatarStates[avatarState]?.rotation || 0,
          filter: `brightness(${avatarStates[avatarState]?.glowIntensity || 0.5})`
        }}
        transition={{
          duration: getAnimationSpeed(),
          ease: "easeInOut"
        }}
      >
        {/* Robot Head */}
        <div className="robot-head">
          {/* Eyes */}
          <div className="robot-eyes">
            <motion.div
              className="robot-eye left-eye"
              animate={{
                backgroundColor: eyeColor,
                boxShadow: `0 0 20px ${eyeColor}`,
                scale: isListening ? [1, 1.2, 1] : 1
              }}
              transition={{
                duration: getAnimationSpeed(),
                repeat: isListening ? Infinity : 0
              }}
            />
            <motion.div
              className="robot-eye right-eye"
              animate={{
                backgroundColor: eyeColor,
                boxShadow: `0 0 20px ${eyeColor}`,
                scale: isListening ? [1, 1.2, 1] : 1
              }}
              transition={{
                duration: getAnimationSpeed(),
                repeat: isListening ? Infinity : 0,
                delay: 0.5
              }}
            />
          </div>

          {/* Mouth */}
          <motion.div
            className="robot-mouth"
            animate={{
              scaleX: isSpeaking ? [1, 1.3, 1] : 1,
              opacity: isSpeaking ? 0.8 : 0.3
            }}
            transition={{
              duration: getAnimationSpeed(),
              repeat: isSpeaking ? Infinity : 0
            }}
          />

          {/* Antenna */}
          <motion.div
            className="robot-antenna"
            animate={{
              rotate: isListening ? [0, 10, -10, 0] : 0,
              scaleY: isListening ? 1.2 : 1
            }}
            transition={{
              duration: getAnimationSpeed(),
              repeat: isListening ? Infinity : 0
            }}
          >
            <div className="antenna-light" />
          </motion.div>

          {/* Status Indicator */}
          <motion.div
            className="status-indicator"
            animate={{
              backgroundColor: eyeColor,
              boxShadow: `0 0 10px ${eyeColor}`,
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: getAnimationSpeed(),
              repeat: Infinity
            }}
          />
        </div>

        {/* Robot Body */}
        <div className="robot-body">
          {/* Chest Panel */}
          <motion.div
            className="chest-panel"
            animate={{
              opacity: isListening ? 0.8 : 0.4,
              scale: isListening ? 1.05 : 1
            }}
            transition={{
              duration: getAnimationSpeed()
            }}
          >
            <div className="panel-grid">
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  className="panel-light"
                  animate={{
                    opacity: isListening ? [0.3, 1, 0.3] : 0.3,
                    scale: isListening ? [1, 1.2, 1] : 1
                  }}
                  transition={{
                    duration: getAnimationSpeed(),
                    repeat: isListening ? Infinity : 0,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Arms */}
          <motion.div
            className="robot-arm left-arm"
            animate={{
              rotate: isListening ? [0, 5, -5, 0] : 0
            }}
            transition={{
              duration: getAnimationSpeed(),
              repeat: isListening ? Infinity : 0
            }}
          />
          <motion.div
            className="robot-arm right-arm"
            animate={{
              rotate: isListening ? [0, -5, 5, 0] : 0
            }}
            transition={{
              duration: getAnimationSpeed(),
              repeat: isListening ? Infinity : 0,
              delay: 0.5
            }}
          />
        </div>

        {/* Pulse Effect */}
        <motion.div
          className="pulse-ring"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0, 0.8]
          }}
          transition={{
            duration: getAnimationSpeed() * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Status Text */}
      <motion.div
        className="avatar-status"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="status-text">
          {avatarState === 'idle' && 'Ready'}
          {avatarState === 'listening' && 'Listening...'}
          {avatarState === 'speaking' && 'Speaking...'}
          {avatarState === 'processing' && 'Processing...'}
          {avatarState === 'error' && 'Error'}
        </span>
      </motion.div>

      {/* Control Panel */}
      <div className="avatar-controls">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWakeWordToggle}
          className={`control-btn ${isWakeWordEnabled ? 'active' : ''}`}
          title={isWakeWordEnabled ? 'Disable Wake Word' : 'Enable Wake Word'}
        >
          {isWakeWordEnabled ? <FiEye /> : <FiEyeOff />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleVoiceToggle}
          className={`control-btn ${isVoiceEnabled ? 'active' : ''}`}
          title={isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
        >
          {isVoiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          className="control-btn settings-btn"
          title="Avatar Settings"
        >
          <FiSettings />
        </motion.button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="avatar-settings"
          >
            <h3>Avatar Settings</h3>

            <div className="setting-group">
              <label>Wake Word:</label>
              <input
                type="text"
                value={customWakeWord}
                onChange={(e) => handleWakeWordChange(e.target.value)}
                className="setting-input"
                placeholder="Enter wake word"
              />
            </div>

            <div className="setting-group">
              <label>Avatar Size:</label>
              <select
                value={avatarSize}
                onChange={(e) => setAvatarSize(e.target.value)}
                className="setting-select"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Animation Speed:</label>
              <select
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(e.target.value)}
                className="setting-select"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(false)}
              className="close-settings-btn"
            >
              Close
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wake Word Display */}
      {isWakeWordEnabled && (
        <motion.div
          className="wake-word-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="wake-word-label">Say:</span>
          <span className="wake-word-text">{customWakeWord}</span>
        </motion.div>
      )}
    </div>
  );
};

export default RobotAvatar;
