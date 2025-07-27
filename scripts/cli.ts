#!/usr/bin/env node

import readline from 'readline';
import PhaseManager from './phase-manager';
import PromptAnalyzerAgent from './prompt-analyzer';

class EHBDevCLI {
  private phaseManager: PhaseManager;
  private promptAnalyzer: PromptAnalyzerAgent;
  private rl: readline.Interface;

  constructor() {
    this.phaseManager = new PhaseManager();
    this.promptAnalyzer = new PromptAnalyzerAgent();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  public async start() {
    console.log('\n🚀 EHB AI Dev Agent - Full Phase Roadmap');
    console.log('==========================================\n');
    
    this.showWelcome();
    
    while (true) {
      try {
        const command = await this.getUserInput('\nEnter command (help for options): ');
        await this.processCommand(command.trim().toLowerCase());
      } catch (error) {
        console.error('❌ Error:', (error as Error).message);
      }
    }
  }

  private showWelcome() {
    console.log('Available Commands:');
    console.log('  start phase [number]  - Start a specific phase');
    console.log('  next                   - Start the next available phase');
    console.log('  status                 - Show current phase status');
    console.log('  report                 - Generate detailed report');
    console.log('  analyze [prompt]       - Analyze a prompt');
    console.log('  history                - Show prompt history');
    console.log('  progress               - Show overall progress');
    console.log('  help                   - Show this help');
    console.log('  exit                   - Exit the CLI');
    console.log('\nExample: start phase 2');
  }

  private async processCommand(command: string) {
    const parts = command.split(' ');
    const action = parts[0];

    switch (action) {
      case 'start':
        if (parts[1] === 'phase' && parts[2]) {
          const phaseNumber = parseInt(parts[2]);
          await this.startPhase(phaseNumber);
        } else {
          console.log('❌ Usage: start phase [number]');
        }
        break;

      case 'next':
        await this.startNextPhase();
        break;

      case 'status':
        this.showStatus();
        break;

      case 'report':
        this.generateReport();
        break;

      case 'analyze':
        if (parts.length > 1) {
          const prompt = parts.slice(1).join(' ');
          await this.analyzePrompt(prompt);
        } else {
          console.log('❌ Usage: analyze [your prompt]');
        }
        break;

      case 'history':
        this.showPromptHistory();
        break;

      case 'progress':
        this.showProgress();
        break;

      case 'help':
        this.showWelcome();
        break;

      case 'exit':
        console.log('👋 Goodbye!');
        this.rl.close();
        process.exit(0);
        break;

      default:
        console.log('❌ Unknown command. Type "help" for options.');
    }
  }

  private async startPhase(phaseNumber: number) {
    if (phaseNumber < 1 || phaseNumber > 11) {
      console.log('❌ Phase number must be between 1 and 11');
      return;
    }

    console.log(`🚀 Starting Phase ${phaseNumber}...`);
    
    try {
      const status = await this.phaseManager.startPhase(phaseNumber);
      
      if (status.status === 'completed') {
        console.log(`✅ Phase ${phaseNumber} completed successfully!`);
        if (status.output && status.output.length > 0) {
          console.log('\n📋 Output:');
          status.output.forEach(output => console.log(`  • ${output}`));
        }
      } else {
        console.log(`❌ Phase ${phaseNumber} failed`);
        if (status.errors && status.errors.length > 0) {
          console.log('\n❌ Errors:');
          status.errors.forEach(error => console.log(`  • ${error}`));
        }
      }
    } catch (error) {
      console.error(`❌ Failed to start Phase ${phaseNumber}:`, (error as Error).message);
    }
  }

  private async startNextPhase() {
    const nextPhase = this.phaseManager.getNextPhase();
    
    if (!nextPhase) {
      console.log('✅ All phases are completed!');
      return;
    }

    console.log(`🔄 Starting next phase: ${nextPhase}`);
    await this.startPhase(nextPhase);
  }

  private showStatus() {
    const allStatus = this.phaseManager.getAllPhaseStatus();
    
    console.log('\n📊 Phase Status:');
    console.log('================');
    
    allStatus.forEach(status => {
      const icon = status.status === 'completed' ? '✅' : 
                  status.status === 'in-progress' ? '🔄' : 
                  status.status === 'failed' ? '❌' : '⏳';
      
      console.log(`${icon} Phase ${status.phase}: ${status.name}`);
      console.log(`   Status: ${status.status}`);
      
      if (status.startTime) {
        console.log(`   Started: ${new Date(status.startTime).toLocaleString()}`);
      }
      
      if (status.endTime) {
        console.log(`   Completed: ${new Date(status.endTime).toLocaleString()}`);
      }
      
      console.log('');
    });
  }

  private generateReport() {
    const report = this.phaseManager.generateReport();
    console.log('\n📋 EHB AI Dev Agent Report');
    console.log('==========================');
    console.log(report);
  }

  private async analyzePrompt(prompt: string) {
    console.log(`🔍 Analyzing prompt: "${prompt}"`);
    
    try {
      const analysis = this.promptAnalyzer.analyzePrompt(prompt);
      
      console.log('\n📊 Analysis Results:');
      console.log(`  Intent: ${analysis.detectedIntent}`);
      console.log(`  Phase: ${analysis.assignedPhase}`);
      console.log(`  Priority: ${analysis.priority}`);
      console.log(`  Category: ${analysis.category}`);
      console.log(`  Complexity: ${analysis.estimatedComplexity}/10`);
      console.log(`  Tags: ${analysis.tags.join(', ')}`);
      
      if (analysis.suggestedActions.length > 0) {
        console.log('\n💡 Suggested Actions:');
        analysis.suggestedActions.forEach(action => {
          console.log(`  • ${action}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to analyze prompt:', (error as Error).message);
    }
  }

  private showPromptHistory() {
    const history = this.promptAnalyzer.getPromptHistory(10);
    
    if (history.length === 0) {
      console.log('📝 No prompts in history');
      return;
    }

    console.log('\n📝 Recent Prompts:');
    console.log('==================');
    
    history.forEach((prompt, index) => {
      console.log(`${index + 1}. "${prompt.originalPrompt}"`);
      console.log(`   Intent: ${prompt.detectedIntent}`);
      console.log(`   Phase: ${prompt.assignedPhase}`);
      console.log(`   Time: ${new Date(prompt.timestamp).toLocaleString()}`);
      console.log('');
    });
  }

  private showProgress() {
    const progress = this.phaseManager.getProgress();
    
    console.log('\n📈 Overall Progress:');
    console.log('===================');
    console.log(`Completed: ${progress.completed}/${progress.total} phases`);
    console.log(`Percentage: ${progress.percentage}%`);
    
    // Create progress bar
    const barLength = 20;
    const filledLength = Math.round((progress.percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`Progress: [${bar}] ${progress.percentage}%`);
    
    if (progress.percentage === 100) {
      console.log('\n🎉 All phases completed! EHB AI Dev Agent is ready!');
    } else {
      const nextPhase = this.phaseManager.getNextPhase();
      if (nextPhase) {
        console.log(`\n🔄 Next phase: ${nextPhase}`);
      }
    }
  }

  private getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Start the CLI if this file is run directly
if (require.main === module) {
  const cli = new EHBDevCLI();
  cli.start().catch(console.error);
}

export default EHBDevCLI; 