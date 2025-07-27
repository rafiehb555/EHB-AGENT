import fs from 'fs';
import path from 'path';

interface PromptAnalysis {
  timestamp: string;
  originalPrompt: string;
  detectedIntent: string;
  assignedPhase: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  category: string;
  estimatedComplexity: number;
  suggestedActions: string[];
}

class PromptAnalyzerAgent {
  private memoryPath: string;
  private intentTags: Map<string, string[]>;

  constructor() {
    this.memoryPath = path.join(__dirname, '../memory/prompts');
    this.ensureMemoryDirectory();
    this.intentTags = this.loadIntentTags();
  }

  private ensureMemoryDirectory() {
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
  }

  private loadIntentTags(): Map<string, string[]> {
    const tagsPath = path.join(__dirname, '../memory/intent-tags.json');
    if (fs.existsSync(tagsPath)) {
      const data = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
      return new Map(Object.entries(data));
    }
    return new Map();
  }

  public analyzePrompt(text: string): PromptAnalysis {
    const timestamp = new Date().toISOString();
    const fileId = `prompt-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.memoryPath, `${date}-${fileId}.json`);

    const intent = this.detectIntent(text);
    const phase = this.suggestPhase(intent);
    const tags = this.extractTags(text);
    const priority = this.determinePriority(text, intent);
    const category = this.categorizePrompt(text);
    const complexity = this.estimateComplexity(text, intent);
    const actions = this.suggestActions(intent, complexity);

    const analysis: PromptAnalysis = {
      timestamp,
      originalPrompt: text,
      detectedIntent: intent,
      assignedPhase: phase,
      tags,
      priority,
      category,
      estimatedComplexity: complexity,
      suggestedActions: actions
    };

    this.savePromptAnalysis(filePath, analysis);
    this.updateIntentTags(intent, tags);
    
    console.log(`✅ Prompt analyzed and saved to ${filePath}`);
    return analysis;
  }

  private detectIntent(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Frontend UI Intent
    if (lowerText.includes('dashboard') || lowerText.includes('filter') || lowerText.includes('ui')) {
      return 'frontend-ui-dashboard';
    }
    
    // Backend API Intent
    if (lowerText.includes('backend') || lowerText.includes('api') || lowerText.includes('server')) {
      return 'backend-logic';
    }
    
    // Blockchain Intent
    if (lowerText.includes('wallet') || lowerText.includes('coin') || lowerText.includes('blockchain')) {
      return 'blockchain-wallet';
    }
    
    // Admin Panel Intent
    if (lowerText.includes('franchise') || lowerText.includes('admin') || lowerText.includes('control')) {
      return 'admin-franchise-control';
    }
    
    // Database Intent
    if (lowerText.includes('database') || lowerText.includes('schema') || lowerText.includes('model')) {
      return 'database-schema';
    }
    
    // Deployment Intent
    if (lowerText.includes('deploy') || lowerText.includes('github') || lowerText.includes('vercel')) {
      return 'deployment-engine';
    }
    
    // Testing Intent
    if (lowerText.includes('test') || lowerText.includes('bug') || lowerText.includes('qa')) {
      return 'testing-qa';
    }
    
    // AI Assistant Intent
    if (lowerText.includes('ai') || lowerText.includes('assistant') || lowerText.includes('chat')) {
      return 'ai-assistant';
    }
    
    return 'general-development';
  }

  private suggestPhase(intent: string): string {
    const phaseMapping: Record<string, string> = {
      'frontend-ui-dashboard': 'Phase 3',
      'backend-logic': 'Phase 4',
      'admin-franchise-control': 'Phase 5',
      'deployment-engine': 'Phase 6',
      'database-schema': 'Phase 7',
      'blockchain-wallet': 'Phase 8',
      'ai-assistant': 'Phase 9',
      'testing-qa': 'Phase 10',
      'general-development': 'Phase 2'
    };
    
    return phaseMapping[intent] || 'Phase 2';
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Service tags
    if (lowerText.includes('gosellr')) tags.push('gosellr');
    if (lowerText.includes('jps')) tags.push('jps');
    if (lowerText.includes('pss')) tags.push('pss');
    if (lowerText.includes('franchise')) tags.push('franchise');
    if (lowerText.includes('admin')) tags.push('admin');
    
    // Technology tags
    if (lowerText.includes('react')) tags.push('react');
    if (lowerText.includes('tailwind')) tags.push('tailwind');
    if (lowerText.includes('node')) tags.push('nodejs');
    if (lowerText.includes('prisma')) tags.push('prisma');
    if (lowerText.includes('jwt')) tags.push('jwt');
    if (lowerText.includes('blockchain')) tags.push('blockchain');
    
    // Feature tags
    if (lowerText.includes('search')) tags.push('search');
    if (lowerText.includes('filter')) tags.push('filter');
    if (lowerText.includes('auth')) tags.push('authentication');
    if (lowerText.includes('wallet')) tags.push('wallet');
    if (lowerText.includes('sql')) tags.push('sql-level');
    
    return tags;
  }

  private determinePriority(text: string, intent: string): 'low' | 'normal' | 'high' | 'critical' {
    const lowerText = text.toLowerCase();
    
    // Critical keywords
    if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('emergency')) {
      return 'critical';
    }
    
    // High priority keywords
    if (lowerText.includes('important') || lowerText.includes('priority') || lowerText.includes('asap')) {
      return 'high';
    }
    
    // Low priority keywords
    if (lowerText.includes('later') || lowerText.includes('optional') || lowerText.includes('maybe')) {
      return 'low';
    }
    
    // Intent-based priority
    if (intent === 'admin-franchise-control' || intent === 'blockchain-wallet') {
      return 'high';
    }
    
    return 'normal';
  }

  private categorizePrompt(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('create') || lowerText.includes('build') || lowerText.includes('generate')) {
      return 'creation';
    }
    
    if (lowerText.includes('fix') || lowerText.includes('bug') || lowerText.includes('error')) {
      return 'fix';
    }
    
    if (lowerText.includes('update') || lowerText.includes('modify') || lowerText.includes('change')) {
      return 'modification';
    }
    
    if (lowerText.includes('deploy') || lowerText.includes('launch') || lowerText.includes('publish')) {
      return 'deployment';
    }
    
    if (lowerText.includes('test') || lowerText.includes('check') || lowerText.includes('verify')) {
      return 'testing';
    }
    
    return 'general';
  }

  private estimateComplexity(text: string, intent: string): number {
    let complexity = 1;
    
    // Text length factor
    complexity += Math.min(text.length / 100, 3);
    
    // Intent complexity
    const intentComplexity: Record<string, number> = {
      'frontend-ui-dashboard': 2,
      'backend-logic': 3,
      'admin-franchise-control': 4,
      'blockchain-wallet': 5,
      'database-schema': 3,
      'deployment-engine': 4,
      'ai-assistant': 4,
      'testing-qa': 3
    };
    
    complexity += intentComplexity[intent] || 1;
    
    // Keyword complexity
    const complexKeywords = ['blockchain', 'wallet', 'franchise', 'admin', 'deploy', 'schema'];
    complexKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        complexity += 1;
      }
    });
    
    return Math.min(Math.round(complexity), 10);
  }

  private suggestActions(intent: string, complexity: number): string[] {
    const actions: string[] = [];
    
    switch (intent) {
      case 'frontend-ui-dashboard':
        actions.push('Create React component');
        actions.push('Add Tailwind CSS styling');
        actions.push('Implement responsive design');
        break;
        
      case 'backend-logic':
        actions.push('Create API route');
        actions.push('Add JWT authentication');
        actions.push('Implement database model');
        break;
        
      case 'admin-franchise-control':
        actions.push('Create admin dashboard');
        actions.push('Add role-based access control');
        actions.push('Implement franchise management');
        break;
        
      case 'blockchain-wallet':
        actions.push('Create smart contract');
        actions.push('Implement wallet integration');
        actions.push('Add token management');
        break;
        
      case 'database-schema':
        actions.push('Create Prisma schema');
        actions.push('Add database models');
        actions.push('Generate migrations');
        break;
        
      case 'deployment-engine':
        actions.push('Setup GitHub repository');
        actions.push('Configure Vercel deployment');
        actions.push('Create deployment scripts');
        break;
        
      case 'ai-assistant':
        actions.push('Integrate AI chat widget');
        actions.push('Add voice input support');
        actions.push('Implement smart search');
        break;
        
      case 'testing-qa':
        actions.push('Create unit tests');
        actions.push('Add integration tests');
        actions.push('Setup automated testing');
        break;
    }
    
    if (complexity > 7) {
      actions.push('Break down into smaller tasks');
      actions.push('Create detailed documentation');
    }
    
    return actions;
  }

  private savePromptAnalysis(filePath: string, analysis: PromptAnalysis) {
    fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2));
  }

  private updateIntentTags(intent: string, tags: string[]) {
    if (!this.intentTags.has(intent)) {
      this.intentTags.set(intent, []);
    }
    
    const existingTags = this.intentTags.get(intent) || [];
    const newTags = tags.filter(tag => !existingTags.includes(tag));
    
    if (newTags.length > 0) {
      this.intentTags.set(intent, [...existingTags, ...newTags]);
      this.saveIntentTags();
    }
  }

  private saveIntentTags() {
    const tagsPath = path.join(__dirname, '../memory/intent-tags.json');
    const data = Object.fromEntries(this.intentTags);
    fs.writeFileSync(tagsPath, JSON.stringify(data, null, 2));
  }

  public getPromptHistory(limit: number = 10): PromptAnalysis[] {
    const files = fs.readdirSync(this.memoryPath)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);
    
    return files.map(file => {
      const filePath = path.join(this.memoryPath, file);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    });
  }

  public searchPrompts(query: string): PromptAnalysis[] {
    const allFiles = fs.readdirSync(this.memoryPath)
      .filter(file => file.endsWith('.json'));
    
    const results: PromptAnalysis[] = [];
    
    for (const file of allFiles) {
      const filePath = path.join(this.memoryPath, file);
      const analysis = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (analysis.originalPrompt.toLowerCase().includes(query.toLowerCase()) ||
          analysis.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))) {
        results.push(analysis);
      }
    }
    
    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getIntentStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    const allFiles = fs.readdirSync(this.memoryPath)
      .filter(file => file.endsWith('.json'));
    
    for (const file of allFiles) {
      const filePath = path.join(this.memoryPath, file);
      const analysis = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      stats[analysis.detectedIntent] = (stats[analysis.detectedIntent] || 0) + 1;
    }
    
    return stats;
  }
}

export default PromptAnalyzerAgent; 