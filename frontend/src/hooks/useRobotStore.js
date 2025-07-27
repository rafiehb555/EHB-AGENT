import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRobotStore = create(
  persist(
    (set, get) => ({
      // Robot Status
      robotStatus: 'ready', // ready, listening, processing, error, offline
      isConnected: true,

      // Voice Settings
      voiceEnabled: true,
      voiceVolume: 0.8,
      voiceSpeed: 1.0,
      voiceLanguage: 'en',

      // Advanced Features
      telepathyMode: false,
      crossServiceMode: false,
      voiceVaultEnabled: true,
      personalitySettings: {
        name: 'EHB Robot',
        language: 'en',
        tone: 'friendly',
        speed: 'normal'
      },

      // Conversation History
      conversationHistory: [],

      // User Preferences
      userPreferences: {
        theme: 'auto',
        notifications: true,
        autoScroll: true,
        soundEffects: true
      },

      // Task Management
      activeTasks: [],
      completedTasks: [],

      // Karmic Ranking
      karmicScore: 100,
      karmicLevel: 'silver',

      // Actions
      updateRobotStatus: (status) => set({ robotStatus: status }),

      setConnectionStatus: (connected) => set({ isConnected: connected }),

      updateVoiceSettings: (settings) => set((state) => ({
        ...state,
        ...settings
      })),

      toggleTelepathyMode: () => set((state) => ({
        telepathyMode: !state.telepathyMode
      })),

      toggleCrossServiceMode: () => set((state) => ({
        crossServiceMode: !state.crossServiceMode
      })),

      updatePersonality: (settings) => set((state) => ({
        personalitySettings: {
          ...state.personalitySettings,
          ...settings
        }
      })),

      addToConversationHistory: (message) => set((state) => ({
        conversationHistory: [
          ...state.conversationHistory,
          {
            ...message,
            timestamp: new Date().toISOString()
          }
        ].slice(-50) // Keep only last 50 messages
      })),

      updateUserPreferences: (preferences) => set((state) => ({
        userPreferences: {
          ...state.userPreferences,
          ...preferences
        }
      })),

      addTask: (task) => set((state) => ({
        activeTasks: [...state.activeTasks, task]
      })),

      completeTask: (taskId) => set((state) => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task) {
          return {
            activeTasks: state.activeTasks.filter(t => t.id !== taskId),
            completedTasks: [...state.completedTasks, { ...task, completedAt: new Date().toISOString() }]
          };
        }
        return state;
      }),

      updateKarmicScore: (score) => {
        const newScore = Math.max(0, Math.min(200, score));
        let level = 'bronze';

        if (newScore >= 150) level = 'diamond';
        else if (newScore >= 120) level = 'gold';
        else if (newScore >= 100) level = 'silver';
        else if (newScore >= 50) level = 'bronze';
        else level = 'restricted';

        set({ karmicScore: newScore, karmicLevel: level });
      },

      // Getters
      getRobotStatus: () => get().robotStatus,
      getIsConnected: () => get().isConnected,
      getVoiceSettings: () => ({
        voiceEnabled: get().voiceEnabled,
        voiceVolume: get().voiceVolume,
        voiceSpeed: get().voiceSpeed,
        voiceLanguage: get().voiceLanguage
      }),
      getPersonalitySettings: () => get().personalitySettings,
      getConversationHistory: () => get().conversationHistory,
      getUserPreferences: () => get().userPreferences,
      getActiveTasks: () => get().activeTasks,
      getKarmicInfo: () => ({
        score: get().karmicScore,
        level: get().karmicLevel
      }),

      // Reset functions
      resetConversation: () => set({ conversationHistory: [] }),
      resetTasks: () => set({ activeTasks: [], completedTasks: [] }),
      resetKarmicScore: () => set({ karmicScore: 100, karmicLevel: 'silver' }),

      // Health check
      performHealthCheck: async () => {
        try {
          const response = await fetch('/api/health');
          const data = await response.json();

          if (data.status === 'OK') {
            set({ isConnected: true, robotStatus: 'ready' });
            return true;
          } else {
            set({ isConnected: false, robotStatus: 'error' });
            return false;
          }
        } catch (error) {
          set({ isConnected: false, robotStatus: 'offline' });
          return false;
        }
      }
    }),
    {
      name: 'ehb-robot-store',
      partialize: (state) => ({
        voiceEnabled: state.voiceEnabled,
        voiceVolume: state.voiceVolume,
        voiceSpeed: state.voiceSpeed,
        voiceLanguage: state.voiceLanguage,
        personalitySettings: state.personalitySettings,
        userPreferences: state.userPreferences,
        karmicScore: state.karmicScore,
        karmicLevel: state.karmicLevel
      })
    }
  )
);

export { useRobotStore };
