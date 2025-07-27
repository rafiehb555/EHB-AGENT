import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useVoiceAPI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Process voice/text input
  const processVoiceText = useCallback(async (text, options = {}) => {
    setIsProcessing(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/voice/process`, {
        message: text,
        mode: options.mode || 'standard',
        context: options.context || {}
      });

      if (response.data.success) {
        return response.data.response;
      } else {
        throw new Error(response.data.error || 'Failed to process voice input');
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Voice processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Text-to-speech
  const speakText = useCallback(async (text, options = {}) => {
    if (!text) return;

    setIsSpeaking(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/voice/speak`, {
        text,
        voice: options.voice || 'default',
        language: options.language || 'en',
        speed: options.speed || 1.0
      });

      if (response.data.success) {
        // Use browser's built-in speech synthesis as fallback
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = options.speed || 1.0;
          utterance.pitch = 1.0;
          utterance.volume = options.volume || 0.8;
          utterance.lang = options.language || 'en-US';

          speechSynthesis.speak(utterance);
        }

        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to speak text');
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);

      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.speed || 1.0;
        utterance.pitch = 1.0;
        utterance.volume = options.volume || 0.8;
        utterance.lang = options.language || 'en-US';

        speechSynthesis.speak(utterance);
      }

      throw new Error(error.response?.data?.error || error.message || 'Text-to-speech failed');
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  // Voice recognition
  const recognizeVoice = useCallback(async (audioData, options = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/voice/recognize`, {
        audioData,
        format: options.format || 'wav',
        language: options.language || 'en'
      });

      if (response.data.success) {
        return response.data.text;
      } else {
        throw new Error(response.data.error || 'Failed to recognize voice');
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Voice recognition failed');
    }
  }, []);

  // Voice vault operations
  const storeInVault = useCallback(async (key, data, voiceSignature) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/voice/vault/store`, {
        key,
        data,
        voiceSignature
      });

      if (response.data.success) {
        toast.success('Data stored securely in voice vault');
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to store in vault');
      }
    } catch (error) {
      console.error('Voice vault store error:', error);
      toast.error('Failed to store in voice vault');
      throw new Error(error.response?.data?.error || error.message || 'Voice vault operation failed');
    }
  }, []);

  const retrieveFromVault = useCallback(async (key, voiceSignature) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/voice/vault/retrieve`, {
        key,
        voiceSignature
      });

      if (response.data.success) {
        toast.success('Data retrieved from voice vault');
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to retrieve from vault');
      }
    } catch (error) {
      console.error('Voice vault retrieve error:', error);
      toast.error('Failed to retrieve from voice vault');
      throw new Error(error.response?.data?.error || error.message || 'Voice vault operation failed');
    }
  }, []);

  // Voice analysis for telepathy mode
  const analyzeVoice = useCallback(async (audioData, context = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/voice/analyze`, {
        audioData,
        context
      });

      if (response.data.success) {
        return response.data.analysis;
      } else {
        throw new Error(response.data.error || 'Failed to analyze voice');
      }
    } catch (error) {
      console.error('Voice analysis error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Voice analysis failed');
    }
  }, []);

  // Advanced features
  const activateTelepathyMode = useCallback(async (voicePattern, context) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/telepathy`, {
        voicePattern,
        context
      });

      if (response.data.success) {
        toast.success('Telepathy mode activated!');
        return response.data.prediction;
      } else {
        throw new Error(response.data.error || 'Failed to activate telepathy mode');
      }
    } catch (error) {
      console.error('Telepathy mode error:', error);
      toast.error('Failed to activate telepathy mode');
      throw new Error(error.response?.data?.error || error.message || 'Telepathy mode failed');
    }
  }, []);

  const executeCrossServiceCommand = useCallback(async (command, services) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/cross-service`, {
        command,
        services
      });

      if (response.data.success) {
        toast.success(`Executed ${response.data.executedServices} services`);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to execute cross-service command');
      }
    } catch (error) {
      console.error('Cross-service command error:', error);
      toast.error('Failed to execute cross-service command');
      throw new Error(error.response?.data?.error || error.message || 'Cross-service execution failed');
    }
  }, []);

  // Voice settings
  const getVoiceSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/voice/settings`);

      if (response.data.success) {
        return response.data.settings;
      } else {
        throw new Error(response.data.error || 'Failed to get voice settings');
      }
    } catch (error) {
      console.error('Get voice settings error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get voice settings');
    }
  }, []);

  const updateVoiceSettings = useCallback(async (settings) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/voice/settings`, {
        settings
      });

      if (response.data.success) {
        toast.success('Voice settings updated');
        return response.data.settings;
      } else {
        throw new Error(response.data.error || 'Failed to update voice settings');
      }
    } catch (error) {
      console.error('Update voice settings error:', error);
      toast.error('Failed to update voice settings');
      throw new Error(error.response?.data?.error || error.message || 'Failed to update voice settings');
    }
  }, []);

  // Health check
  const checkVoiceHealth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/voice/health`);

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Voice service unhealthy');
      }
    } catch (error) {
      console.error('Voice health check error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Voice health check failed');
    }
  }, []);

  return {
    // State
    isProcessing,
    isSpeaking,

    // Core functions
    processVoiceText,
    speakText,
    recognizeVoice,

    // Voice vault
    storeInVault,
    retrieveFromVault,

    // Advanced features
    analyzeVoice,
    activateTelepathyMode,
    executeCrossServiceCommand,

    // Settings
    getVoiceSettings,
    updateVoiceSettings,

    // Health
    checkVoiceHealth
  };
};

export { useVoiceAPI };
