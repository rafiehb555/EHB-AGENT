const PersonalBrain = require('../models/PersonalBrain');

class BrainTrainer {
  constructor() {
    this.trainingQueue = [];
    this.isTraining = false;
  }

  // Learn from user interaction
  async learnFromInteraction(userId, interaction) {
    try {
      const brain = await PersonalBrain.getBrainByUser(userId);
      if (!brain) {
        console.log(`🧠 Creating new brain for user: ${userId}`);
        return await this.createNewBrain(userId, interaction);
      }

      // Learn from the interaction
      await brain.learnFromInteraction(interaction);

      // Update interaction stats
      const responseTime = interaction.responseTime || 1000;
      await brain.updateInteractionStats(interaction.success, responseTime);

      // Trigger training if enough data
      if (brain.trainingDataPoints % 10 === 0) {
        await this.triggerTraining(brain);
      }

      console.log(`🧠 Brain updated for user: ${userId}`);
      return brain;

    } catch (error) {
      console.error('Brain training error:', error);
      throw error;
    }
  }

  // Create new brain for user
  async createNewBrain(userId, initialInteraction) {
    const brain = new PersonalBrain({
      userId,
      walletAddress: initialInteraction.walletAddress || 'unknown',
      trainingDataPoints: 1,
      lastTrained: new Date()
    });

    // Initialize with default preferences based on first interaction
    brain.preferences = this.analyzeInitialPreferences(initialInteraction);
    brain.modelConfig = this.getDefaultModelConfig();

    await brain.save();
    console.log(`🧠 New brain created for user: ${userId}`);

    return brain;
  }

  // Analyze initial preferences from first interaction
  analyzeInitialPreferences(interaction) {
    const preferences = {
      responseLength: 'conversational',
      tone: 'friendly',
      language: {
        primary: 'english',
        secondary: 'urdu',
        autoSwitch: true
      },
      emojiUsage: 'moderate',
      formality: 'casual'
    };

    // Analyze language preference
    if (interaction.language === 'urdu') {
      preferences.language.primary = 'urdu';
      preferences.language.secondary = 'english';
    }

    // Analyze tone preference
    if (interaction.formal) {
      preferences.tone = 'formal';
      preferences.formality = 'formal';
    }

    // Analyze response length preference
    if (interaction.shortResponse) {
      preferences.responseLength = 'concise';
    }

    return preferences;
  }

  // Get default model configuration
  getDefaultModelConfig() {
    return {
      temperature: 0.7,
      maxTokens: 150,
      topP: 0.9,
      customPrompts: [],
      instructionTuning: "You are a helpful AI assistant. Be concise and friendly."
    };
  }

  // Trigger training when enough data is collected
  async triggerTraining(brain) {
    try {
      console.log(`🧠 Starting training for user: ${brain.userId}`);

      // Analyze patterns
      const patterns = await this.analyzePatterns(brain);

      // Update model configuration based on patterns
      await this.updateModelConfig(brain, patterns);

      // Update expertise areas
      await this.updateExpertise(brain);

      // Evaluate performance
      await this.evaluatePerformance(brain);

      brain.lastTrained = new Date();
      await brain.save();

      console.log(`✅ Training completed for user: ${brain.userId}`);

    } catch (error) {
      console.error('Training error:', error);
    }
  }

  // Analyze user patterns
  async analyzePatterns(brain) {
    const patterns = {
      mostCommonIntents: [],
      preferredCommands: [],
      activeHours: [],
      vocabulary: {
        favoriteWords: [],
        avoidedWords: []
      }
    };

    // Analyze common intents
    if (brain.learnedPatterns.commonIntents.length > 0) {
      patterns.mostCommonIntents = brain.learnedPatterns.commonIntents
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);
    }

    // Analyze preferred commands
    if (brain.learnedPatterns.preferredCommands.length > 0) {
      patterns.preferredCommands = brain.learnedPatterns.preferredCommands
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);
    }

    // Analyze active hours
    if (brain.interactionStats.mostActiveHours.length > 0) {
      patterns.activeHours = brain.interactionStats.mostActiveHours
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }

    return patterns;
  }

  // Update model configuration based on patterns
  async updateModelConfig(brain, patterns) {
    // Adjust temperature based on user behavior
    const successRate = brain.interactionStats.successfulInteractions / brain.interactionStats.totalInteractions;
    if (successRate > 0.8) {
      brain.modelConfig.temperature = Math.min(brain.modelConfig.temperature + 0.1, 1.0);
    } else if (successRate < 0.6) {
      brain.modelConfig.temperature = Math.max(brain.modelConfig.temperature - 0.1, 0.1);
    }

    // Adjust response length based on preferences
    if (brain.preferences.responseLength === 'concise') {
      brain.modelConfig.maxTokens = Math.min(brain.modelConfig.maxTokens, 100);
    } else if (brain.preferences.responseLength === 'detailed') {
      brain.modelConfig.maxTokens = Math.max(brain.modelConfig.maxTokens, 200);
    }

    // Update instruction tuning based on tone preference
    const toneInstructions = {
      formal: "You are a professional AI assistant. Use formal language and be precise.",
      friendly: "You are a friendly AI assistant. Be warm and conversational.",
      casual: "You are a casual AI assistant. Be relaxed and informal.",
      professional: "You are a professional AI assistant. Be efficient and business-like."
    };

    brain.modelConfig.instructionTuning = toneInstructions[brain.preferences.tone] || toneInstructions.friendly;

    // Add custom prompts based on common intents
    patterns.mostCommonIntents.forEach(intent => {
      const existingPrompt = brain.modelConfig.customPrompts.find(p => p.name === intent.intent);
      if (!existingPrompt) {
        brain.modelConfig.customPrompts.push({
          name: intent.intent,
          prompt: `User frequently asks about ${intent.intent}. Provide helpful responses.`,
          category: 'intent',
          isActive: true
        });
      }
    });
  }

  // Update expertise areas
  async updateExpertise(brain) {
    // Analyze domain expertise based on command categories
    const categoryCounts = {};
    brain.learnedPatterns.preferredCommands.forEach(cmd => {
      categoryCounts[cmd.category] = (categoryCounts[cmd.category] || 0) + cmd.usageCount;
    });

    // Update primary domains
    const topDomains = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([domain, count]) => ({
        domain,
        confidence: Math.min(count / brain.trainingDataPoints, 1.0),
        lastUsed: new Date(),
        trainingData: count
      }));

    brain.expertise.primaryDomains = topDomains;

    // Update learned skills
    const skills = new Set();
    brain.learnedPatterns.preferredCommands.forEach(cmd => {
      skills.add(cmd.category);
    });

    brain.expertise.learnedSkills = Array.from(skills).map(skill => ({
      skill,
      proficiency: Math.min(brain.trainingDataPoints / 100, 1.0),
      lastPracticed: new Date(),
      applications: [skill]
    }));
  }

  // Evaluate performance
  async evaluatePerformance(brain) {
    const accuracyScore = brain.interactionStats.successfulInteractions / brain.interactionStats.totalInteractions;
    const learningRate = brain.trainingDataPoints / Math.max(brain.brainAge, 1);

    brain.performance = {
      accuracyScore: accuracyScore * 100,
      userSatisfaction: this.calculateSatisfaction(brain),
      learningRate: learningRate,
      lastEvaluation: new Date()
    };
  }

  // Calculate user satisfaction
  calculateSatisfaction(brain) {
    let satisfaction = 50; // Base satisfaction

    // Adjust based on success rate
    const successRate = brain.interactionStats.successfulInteractions / brain.interactionStats.totalInteractions;
    satisfaction += successRate * 30;

    // Adjust based on response time
    const avgResponseTime = brain.interactionStats.averageResponseTime;
    if (avgResponseTime < 1000) satisfaction += 10;
    else if (avgResponseTime > 3000) satisfaction -= 10;

    // Adjust based on training progress
    satisfaction += brain.trainingProgress * 0.1;

    return Math.min(Math.max(satisfaction, 0), 100);
  }

  // Generate personalized response
  async generatePersonalizedResponse(userId, input, context = {}) {
    try {
      const brain = await PersonalBrain.getBrainByUser(userId);
      if (!brain) {
        return this.getDefaultResponse(input);
      }

      // Apply brain preferences to response generation
      const personalizedPrompt = this.buildPersonalizedPrompt(brain, input, context);

      // Here you would call your AI model with the personalized prompt
      const response = await this.callAIModel(personalizedPrompt, brain.modelConfig);

      // Learn from this interaction
      await this.learnFromInteraction(userId, {
        intent: this.extractIntent(input),
        command: input,
        success: true,
        response: response,
        timestamp: new Date(),
        responseTime: context.responseTime || 1000
      });

      return response;

    } catch (error) {
      console.error('Personalized response error:', error);
      return this.getDefaultResponse(input);
    }
  }

  // Build personalized prompt
  buildPersonalizedPrompt(brain, input, context) {
    let prompt = brain.modelConfig.instructionTuning + "\n\n";

    // Add user preferences
    prompt += `User preferences: ${brain.preferences.tone} tone, ${brain.preferences.responseLength} responses.\n`;

    // Add context from learned patterns
    if (brain.learnedPatterns.commonIntents.length > 0) {
      const topIntent = brain.learnedPatterns.commonIntents[0];
      prompt += `User frequently asks about: ${topIntent.intent}\n`;
    }

    // Add custom prompts
    brain.modelConfig.customPrompts
      .filter(p => p.isActive)
      .forEach(p => {
        prompt += `${p.prompt}\n`;
      });

    prompt += `\nUser input: ${input}\n\nResponse:`;

    return prompt;
  }

  // Call AI model (placeholder - integrate with your AI service)
  async callAIModel(prompt, config) {
    // This is where you'd integrate with OpenAI, Claude, etc.
    // For now, return a simulated response
    return `I understand your request. Based on your preferences, here's what I can help you with: ${prompt.split('User input:')[1]?.trim() || 'your request'}`;
  }

  // Extract intent from input
  extractIntent(input) {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('order') || lowerInput.includes('buy')) return 'shopping';
    if (lowerInput.includes('book') || lowerInput.includes('schedule')) return 'booking';
    if (lowerInput.includes('remind')) return 'reminder';
    if (lowerInput.includes('check') || lowerInput.includes('balance')) return 'finance';

    return 'general';
  }

  // Get default response
  getDefaultResponse(input) {
    return `I'm here to help you with: ${input}. How can I assist you today?`;
  }

  // Export brain data
  async exportBrain(userId) {
    const brain = await PersonalBrain.getBrainByUser(userId);
    if (!brain) {
      throw new Error('Brain not found');
    }

    return brain.exportBrain();
  }

  // Import brain data
  async importBrain(userId, brainData) {
    let brain = await PersonalBrain.getBrainByUser(userId);

    if (!brain) {
      brain = new PersonalBrain({
        userId,
        walletAddress: brainData.walletAddress || 'unknown'
      });
    }

    await brain.importBrain(brainData);
    return brain;
  }
}

module.exports = new BrainTrainer();
