// EHB Robot AI Learning Service
// Phase 4: AI Smart Learning & Personalization

const fs = require('fs').promises;
const path = require('path');

class AILearningService {
  constructor() {
    this.userProfiles = new Map();
    this.commandPatterns = new Map();
    this.suggestions = new Map();
    this.learningDataPath = path.join(__dirname, '../data/ai-learning');
    this.init();
  }

  async init() {
    try {
      await this.ensureDataDirectory();
      await this.loadLearningData();
      console.log('🤖 AI Learning Service initialized');
    } catch (error) {
      console.error('Failed to initialize AI Learning Service:', error);
    }
  }

  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.learningDataPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  async loadLearningData() {
    try {
      // Load user profiles
      const profilesPath = path.join(this.learningDataPath, 'user-profiles.json');
      const profilesData = await fs.readFile(profilesPath, 'utf8').catch(() => '{}');
      const profiles = JSON.parse(profilesData);
      this.userProfiles = new Map(Object.entries(profiles));

      // Load command patterns
      const patternsPath = path.join(this.learningDataPath, 'command-patterns.json');
      const patternsData = await fs.readFile(patternsPath, 'utf8').catch(() => '{}');
      const patterns = JSON.parse(patternsData);
      this.commandPatterns = new Map(Object.entries(patterns));

      // Load suggestions
      const suggestionsPath = path.join(this.learningDataPath, 'suggestions.json');
      const suggestionsData = await fs.readFile(suggestionsPath, 'utf8').catch(() => '{}');
      const suggestions = JSON.parse(suggestionsData);
      this.suggestions = new Map(Object.entries(suggestions));

      console.log(`📊 Loaded ${this.userProfiles.size} user profiles, ${this.commandPatterns.size} patterns, ${this.suggestions.size} suggestions`);
    } catch (error) {
      console.error('Failed to load learning data:', error);
    }
  }

  async saveLearningData() {
    try {
      // Save user profiles
      const profilesPath = path.join(this.learningDataPath, 'user-profiles.json');
      const profiles = Object.fromEntries(this.userProfiles);
      await fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2));

      // Save command patterns
      const patternsPath = path.join(this.learningDataPath, 'command-patterns.json');
      const patterns = Object.fromEntries(this.commandPatterns);
      await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2));

      // Save suggestions
      const suggestionsPath = path.join(this.learningDataPath, 'suggestions.json');
      const suggestions = Object.fromEntries(this.suggestions);
      await fs.writeFile(suggestionsPath, JSON.stringify(suggestions, null, 2));

      console.log('💾 Learning data saved successfully');
    } catch (error) {
      console.error('Failed to save learning data:', error);
    }
  }

  // Learn from user interaction
  async learnFromInteraction(userId, command, result, context = {}) {
    try {
      // Update user profile
      await this.updateUserProfile(userId, command, result, context);

      // Learn command patterns
      await this.learnCommandPattern(command, result);

      // Generate suggestions
      await this.generateSuggestions(userId);

      // Save learning data
      await this.saveLearningData();

      console.log(`🧠 Learned from interaction: ${userId} -> "${command}"`);
    } catch (error) {
      console.error('Failed to learn from interaction:', error);
    }
  }

  // Update user profile with interaction data
  async updateUserProfile(userId, command, result, context) {
    const profile = this.userProfiles.get(userId) || {
      userId,
      commandHistory: [],
      preferences: {},
      patterns: {},
      lastInteraction: null,
      totalCommands: 0,
      successRate: 0,
      favoriteCommands: [],
      commonItems: [],
      preferredTimes: []
    };

    // Add command to history
    profile.commandHistory.push({
      command,
      result,
      context,
      timestamp: new Date().toISOString(),
      success: result.success
    });

    // Keep only last 100 commands
    if (profile.commandHistory.length > 100) {
      profile.commandHistory = profile.commandHistory.slice(-100);
    }

    // Update statistics
    profile.totalCommands++;
    profile.lastInteraction = new Date().toISOString();
    profile.successRate = this.calculateSuccessRate(profile.commandHistory);

    // Extract preferences
    this.extractUserPreferences(profile, command, result, context);

    // Update patterns
    this.updateUserPatterns(profile, command, result);

    this.userProfiles.set(userId, profile);
  }

  // Extract user preferences from interactions
  extractUserPreferences(profile, command, result, context) {
    // Extract favorite items
    if (result.order && result.order.items) {
      result.order.items.forEach(item => {
        const existing = profile.commonItems.find(i => i.name === item.name);
        if (existing) {
          existing.count++;
        } else {
          profile.commonItems.push({ name: item.name, count: 1 });
        }
      });
    }

    // Extract preferred times
    if (context.time || result.deliveryTime) {
      const time = context.time || result.deliveryTime;
      const existing = profile.preferredTimes.find(t => t.time === time);
      if (existing) {
        existing.count++;
      } else {
        profile.preferredTimes.push({ time, count: 1 });
      }
    }

    // Sort by frequency
    profile.commonItems.sort((a, b) => b.count - a.count);
    profile.preferredTimes.sort((a, b) => b.count - a.count);

    // Keep top 10
    profile.commonItems = profile.commonItems.slice(0, 10);
    profile.preferredTimes = profile.preferredTimes.slice(0, 10);
  }

  // Update user command patterns
  updateUserPatterns(profile, command, result) {
    const commandType = this.extractCommandType(command);

    if (!profile.patterns[commandType]) {
      profile.patterns[commandType] = {
        count: 0,
        successRate: 0,
        variations: []
      };
    }

    const pattern = profile.patterns[commandType];
    pattern.count++;
    pattern.successRate = this.calculateSuccessRate(
      profile.commandHistory.filter(cmd => this.extractCommandType(cmd.command) === commandType)
    );

    // Add command variation
    const variation = this.extractCommandVariation(command);
    const existingVariation = pattern.variations.find(v => v.text === variation);
    if (existingVariation) {
      existingVariation.count++;
    } else {
      pattern.variations.push({ text: variation, count: 1 });
    }

    // Sort variations by frequency
    pattern.variations.sort((a, b) => b.count - a.count);
  }

  // Learn command patterns across all users
  async learnCommandPattern(command, result) {
    const commandType = this.extractCommandType(command);
    const pattern = this.commandPatterns.get(commandType) || {
      type: commandType,
      totalUses: 0,
      successRate: 0,
      variations: [],
      commonParams: {}
    };

    pattern.totalUses++;
    pattern.successRate = result.success ?
      (pattern.successRate * (pattern.totalUses - 1) + 1) / pattern.totalUses :
      (pattern.successRate * (pattern.totalUses - 1)) / pattern.totalUses;

    // Add variation
    const variation = this.extractCommandVariation(command);
    const existingVariation = pattern.variations.find(v => v.text === variation);
    if (existingVariation) {
      existingVariation.count++;
    } else {
      pattern.variations.push({ text: variation, count: 1 });
    }

    // Extract common parameters
    this.extractCommonParams(pattern, command, result);

    this.commandPatterns.set(commandType, pattern);
  }

  // Generate personalized suggestions for user
  async generateSuggestions(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];

    const suggestions = [];

    // Time-based suggestions
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour <= 10) {
      suggestions.push({
        type: 'time-based',
        text: 'Order breakfast items',
        confidence: 0.8,
        reason: 'Morning time detected'
      });
    } else if (currentHour >= 11 && currentHour <= 15) {
      suggestions.push({
        type: 'time-based',
        text: 'Order lunch items',
        confidence: 0.8,
        reason: 'Lunch time detected'
      });
    }

    // Preference-based suggestions
    if (profile.commonItems.length > 0) {
      const topItem = profile.commonItems[0];
      suggestions.push({
        type: 'preference',
        text: `Order ${topItem.name}`,
        confidence: 0.9,
        reason: `You frequently order ${topItem.name}`
      });
    }

    // Pattern-based suggestions
    const mostUsedPattern = Object.entries(profile.patterns)
      .sort(([,a], [,b]) => b.count - a.count)[0];

    if (mostUsedPattern) {
      const [patternType, pattern] = mostUsedPattern;
      if (pattern.variations.length > 0) {
        const topVariation = pattern.variations[0];
        suggestions.push({
          type: 'pattern',
          text: topVariation.text,
          confidence: 0.7,
          reason: `Based on your common ${patternType} pattern`
        });
      }
    }

    // Success-based suggestions
    const recentCommands = profile.commandHistory.slice(-5);
    const failedCommands = recentCommands.filter(cmd => !cmd.success);

    if (failedCommands.length > 0) {
      const lastFailed = failedCommands[failedCommands.length - 1];
      suggestions.push({
        type: 'correction',
        text: `Try: ${this.suggestCorrection(lastFailed.command)}`,
        confidence: 0.6,
        reason: 'Based on recent failed command'
      });
    }

    this.suggestions.set(userId, suggestions);
    return suggestions;
  }

  // Get personalized suggestions for user
  async getSuggestions(userId, context = {}) {
    const suggestions = this.suggestions.get(userId) || [];

    // Add context-based suggestions
    if (context.currentPage) {
      suggestions.push({
        type: 'context',
        text: `Navigate to ${context.currentPage}`,
        confidence: 0.5,
        reason: `You're currently on ${context.currentPage}`
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Get user profile
  async getUserProfile(userId) {
    return this.userProfiles.get(userId) || null;
  }

  // Get command patterns
  async getCommandPatterns() {
    return Array.from(this.commandPatterns.values());
  }

  // Calculate success rate
  calculateSuccessRate(commands) {
    if (commands.length === 0) return 0;
    const successful = commands.filter(cmd => cmd.success).length;
    return (successful / commands.length) * 100;
  }

  // Extract command type
  extractCommandType(command) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('order') || lowerCommand.includes('buy') || lowerCommand.includes('get')) {
      return 'order';
    } else if (lowerCommand.includes('open') || lowerCommand.includes('navigate') || lowerCommand.includes('go')) {
      return 'navigate';
    } else if (lowerCommand.includes('balance') || lowerCommand.includes('wallet')) {
      return 'balance';
    } else if (lowerCommand.includes('book') || lowerCommand.includes('schedule')) {
      return 'service';
    } else if (lowerCommand.includes('remind') || lowerCommand.includes('reminder')) {
      return 'reminder';
    } else if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      return 'search';
    } else {
      return 'other';
    }
  }

  // Extract command variation
  extractCommandVariation(command) {
    // Normalize command for pattern matching
    return command.toLowerCase()
      .replace(/\d+/g, '{quantity}')
      .replace(/\b(?:for|at|on|in)\b/g, '{time}')
      .trim();
  }

  // Extract common parameters
  extractCommonParams(pattern, command, result) {
    // Extract quantities
    const quantityMatch = command.match(/(\d+)/);
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1]);
      if (!pattern.commonParams.quantities) pattern.commonParams.quantities = [];
      pattern.commonParams.quantities.push(quantity);
    }

    // Extract items
    if (result.order && result.order.items) {
      if (!pattern.commonParams.items) pattern.commonParams.items = [];
      result.order.items.forEach(item => {
        pattern.commonParams.items.push(item.name);
      });
    }
  }

  // Suggest correction for failed command
  suggestCorrection(failedCommand) {
    const lowerCommand = failedCommand.toLowerCase();

    if (lowerCommand.includes('order') && !lowerCommand.includes('what')) {
      return 'Order 2 cold drinks';
    } else if (lowerCommand.includes('open') && !lowerCommand.includes('gosellr')) {
      return 'Open GoSellr';
    } else if (lowerCommand.includes('balance')) {
      return 'Check my wallet balance';
    } else if (lowerCommand.includes('book')) {
      return 'Book AC repair service';
    } else {
      return 'Try: Order 2 cold drinks';
    }
  }

  // Get learning analytics
  async getLearningAnalytics() {
    const totalUsers = this.userProfiles.size;
    const totalCommands = Array.from(this.userProfiles.values())
      .reduce((sum, profile) => sum + profile.totalCommands, 0);

    const avgSuccessRate = Array.from(this.userProfiles.values())
      .reduce((sum, profile) => sum + profile.successRate, 0) / totalUsers;

    const popularPatterns = Array.from(this.commandPatterns.values())
      .sort((a, b) => b.totalUses - a.totalUses)
      .slice(0, 5);

    return {
      totalUsers,
      totalCommands,
      avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      popularPatterns,
      learningDataSize: this.userProfiles.size + this.commandPatterns.size + this.suggestions.size
    };
  }
}

module.exports = new AILearningService();
