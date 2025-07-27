import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [recognitionMethod, setRecognitionMethod] = useState('browser'); // 'browser' or 'whisper'
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      // Check for Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setIsSupported(true);
        setRecognitionMethod('browser');
      } else {
        setIsSupported(false);
        setRecognitionMethod('whisper');
      }
    };

    checkSupport();
  }, []);

  // Initialize browser speech recognition
  const initializeBrowserRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      toast.success('🎤 Listening... Speak now!');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      switch (event.error) {
        case 'no-speech':
          toast.error('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          toast.error('Audio capture failed. Please check your microphone.');
          break;
        case 'not-allowed':
          toast.error('Microphone access denied. Please allow microphone access.');
          break;
        default:
          toast.error('Voice recognition error. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        toast.success('✅ Voice captured successfully!');
      }
    };

    return recognition;
  }, [isSupported, transcript]);

  // Initialize media recorder for Whisper API
  const initializeMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        audioChunksRef.current = [];

        // Process with Whisper API
        await processWithWhisper(audioBlob);
      };

      return mediaRecorder;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone. Please check permissions.');
      return null;
    }
  }, []);

  // Process audio with Whisper API
  const processWithWhisper = useCallback(async (audioBlob) => {
    if (!audioBlob) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'en');

      const response = await axios.post(`${API_BASE_URL}/voice/whisper`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      if (response.data.success) {
        setTranscript(response.data.text);
        toast.success('✅ Voice processed successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to process voice');
      }
    } catch (error) {
      console.error('Whisper API error:', error);
      toast.error('Failed to process voice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (isListening) return;

    if (recognitionMethod === 'browser' && isSupported) {
      // Use browser speech recognition
      const recognition = initializeBrowserRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    } else {
      // Use Whisper API
      const mediaRecorder = await initializeMediaRecorder();
      if (mediaRecorder) {
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsListening(true);
        toast.success('🎤 Recording... Speak now!');
      }
    }
  }, [isListening, recognitionMethod, isSupported, initializeBrowserRecognition, initializeMediaRecorder]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!isListening) return;

    if (recognitionMethod === 'browser' && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, [isListening, recognitionMethod]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // Get recognition status
  const getStatus = useCallback(() => {
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  }, [isListening, isProcessing]);

  // Get supported methods
  const getSupportedMethods = useCallback(() => {
    const methods = [];
    if (isSupported) methods.push('browser');
    methods.push('whisper');
    return methods;
  }, [isSupported]);

  // Switch recognition method
  const switchMethod = useCallback((method) => {
    if (isListening) {
      stopListening();
    }
    setRecognitionMethod(method);
    setTranscript('');
  }, [isListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    // State
    isListening,
    transcript,
    isSupported,
    recognitionMethod,
    isProcessing,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    switchMethod,

    // Utilities
    getStatus,
    getSupportedMethods,

    // Configuration
    setRecognitionMethod
  };
};

export { useVoiceRecognition };
