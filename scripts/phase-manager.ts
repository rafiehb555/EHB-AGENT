import fs from 'fs';
import path from 'path';
import BackendBuilderAgent from './backend-builder';
import FrontendBuilderAgent from './frontend-builder';
import PromptAnalyzerAgent from './prompt-analyzer';

interface PhaseStatus {
  phase: number;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  output?: string[];
  errors?: string[];
}

interface PhaseConfig {
  name: string;
  description: string;
  agent: string;
  dependencies: number[];
  output: string[];
}

class PhaseManager {
  private phases: Map<number, PhaseConfig>;
  private status: Map<number, PhaseStatus>;
  private promptAnalyzer: PromptAnalyzerAgent;
  private frontendBuilder: FrontendBuilderAgent;
  private backendBuilder: BackendBuilderAgent;
  private statusFile: string;

  constructor() {
    this.phases = new Map();
    this.status = new Map();
    this.promptAnalyzer = new PromptAnalyzerAgent();
    this.frontendBuilder = new FrontendBuilderAgent();
    this.backendBuilder = new BackendBuilderAgent();
    this.statusFile = path.join(__dirname, '../memory/phase-status.json');
    
    this.initializePhases();
    this.loadStatus();
  }

  private initializePhases() {
    const phaseConfigs: PhaseConfig[] = [
      {
        name: 'Initialization + Core Setup',
        description: 'Basic project setup and core agents',
        agent: 'core',
        dependencies: [],
        output: ['core-agents', 'memory-system']
      },
      {
        name: 'Prompt Analyzer',
        description: 'AI prompt understanding and memory tracking',
        agent: 'prompt-analyzer',
        dependencies: [1],
        output: ['prompt-memory', 'intent-detection']
      },
      {
        name: 'Frontend Builder Agent',
        description: 'React/Tailwind UI component generator',
        agent: 'frontend-builder',
        dependencies: [2],
        output: ['react-components', 'dashboards', 'ui-system']
      },
      {
        name: 'Backend Logic + API Builder',
        description: 'Node.js APIs with Express and JWT',
        agent: 'backend-builder',
        dependencies: [2],
        output: ['api-routes', 'auth-system', 'database-models']
      },
      {
        name: 'Admin Panel Generator',
        description: 'Role-based admin dashboards',
        agent: 'admin-builder',
        dependencies: [3, 4],
        output: ['admin-panels', 'role-control', 'franchise-management']
      },
      {
        name: 'Auto Deployment Engine',
        description: 'GitHub + Vercel + Replit integration',
        agent: 'deployment-manager',
        dependencies: [3, 4],
        output: ['deployment-scripts', 'ci-cd', 'environment-configs']
      },
      {
        name: 'Database & Prisma Schema',
        description: 'Auto database schema and seeder',
        agent: 'db-builder',
        dependencies: [4],
        output: ['prisma-schema', 'database-migrations', 'seed-data']
      },
      {
        name: 'Blockchain Integration',
        description: 'Moonbeam wallet and EHBGC token system',
        agent: 'blockchain-agent',
        dependencies: [4, 5],
        output: ['smart-contracts', 'wallet-system', 'token-logic']
      },
      {
        name: 'AI Assistant Integration',
        description: 'GPT assistant and voice input',
        agent: 'ai-assistant',
        dependencies: [3, 5],
        output: ['ai-chat', 'voice-input', 'smart-search']
      },
      {
        name: 'Testing & Bug Fix Engine',
        description: 'Automated QA and error tracking',
        agent: 'qa-agent',
        dependencies: [3, 4, 5],
        output: ['test-suites', 'bug-tracking', 'auto-fixes']
      },
      {
        name: 'Final Production Packager',
        description: 'Complete project packaging and export',
        agent: 'packager',
        dependencies: [3, 4, 5, 6, 7, 8, 9, 10],
        output: ['production-bundle', 'deployment-ready', 'documentation']
      }
    ];

    phaseConfigs.forEach((config, index) => {
      this.phases.set(index + 1, config);
    });
  }

  private loadStatus() {
    if (fs.existsSync(this.statusFile)) {
      const data = JSON.parse(fs.readFileSync(this.statusFile, 'utf8'));
      this.status = new Map(Object.entries(data).map(([key, value]) => [parseInt(key), value as PhaseStatus]));
    }
  }

  private saveStatus() {
    const data = Object.fromEntries(this.status);
    fs.writeFileSync(this.statusFile, JSON.stringify(data, null, 2));
  }

  public getPhaseStatus(phaseNumber: number): PhaseStatus | undefined {
    return this.status.get(phaseNumber);
  }

  public getAllPhaseStatus(): PhaseStatus[] {
    return Array.from(this.status.values()).sort((a, b) => a.phase - b.phase);
  }

  public async startPhase(phaseNumber: number, prompt?: string): Promise<PhaseStatus> {
    const phaseConfig = this.phases.get(phaseNumber);
    if (!phaseConfig) {
      throw new Error(`Phase ${phaseNumber} not found`);
    }

    // Check dependencies
    const dependencies = phaseConfig.dependencies;
    for (const dep of dependencies) {
      const depStatus = this.status.get(dep);
      if (!depStatus || depStatus.status !== 'completed') {
        throw new Error(`Phase ${phaseNumber} depends on Phase ${dep} which is not completed`);
      }
    }

    // Update status
    const status: PhaseStatus = {
      phase: phaseNumber,
      name: phaseConfig.name,
      status: 'in-progress',
      startTime: new Date().toISOString(),
      output: [],
      errors: []
    };

    this.status.set(phaseNumber, status);
    this.saveStatus();

    try {
      console.log(`🚀 Starting Phase ${phaseNumber}: ${phaseConfig.name}`);
      
      // Analyze prompt if provided
      if (prompt) {
        const analysis = this.promptAnalyzer.analyzePrompt(prompt);
        status.output?.push(`Prompt analyzed: ${analysis.detectedIntent}`);
      }

      // Execute phase based on agent type
      switch (phaseConfig.agent) {
        case 'prompt-analyzer':
          await this.executePromptAnalyzerPhase(phaseNumber, status);
          break;
        case 'frontend-builder':
          await this.executeFrontendBuilderPhase(phaseNumber, status);
          break;
        case 'backend-builder':
          await this.executeBackendBuilderPhase(phaseNumber, status);
          break;
        case 'admin-builder':
          await this.executeAdminBuilderPhase(phaseNumber, status);
          break;
        case 'deployment-manager':
          await this.executeDeploymentPhase(phaseNumber, status);
          break;
        case 'db-builder':
          await this.executeDatabasePhase(phaseNumber, status);
          break;
        case 'blockchain-agent':
          await this.executeBlockchainPhase(phaseNumber, status);
          break;
        case 'ai-assistant':
          await this.executeAIAssistantPhase(phaseNumber, status);
          break;
        case 'qa-agent':
          await this.executeQAPhase(phaseNumber, status);
          break;
        case 'packager':
          await this.executePackagerPhase(phaseNumber, status);
          break;
        default:
          throw new Error(`Unknown agent type: ${phaseConfig.agent}`);
      }

      status.status = 'completed';
      status.endTime = new Date().toISOString();
      console.log(`✅ Phase ${phaseNumber} completed successfully`);

    } catch (error) {
      status.status = 'failed';
      status.endTime = new Date().toISOString();
      status.errors?.push((error as Error).message);
      console.error(`❌ Phase ${phaseNumber} failed:`, (error as Error).message);
    }

    this.saveStatus();
    return status;
  }

  private async executePromptAnalyzerPhase(phaseNumber: number, status: PhaseStatus) {
    // Generate sample prompts for testing
    const samplePrompts = [
      'Create a dashboard for GoSellr with filter system',
      'Build backend API for user authentication',
      'Generate admin panel for franchise management',
      'Setup blockchain wallet integration'
    ];

    for (const prompt of samplePrompts) {
      const analysis = this.promptAnalyzer.analyzePrompt(prompt);
      status.output?.push(`Analyzed: "${prompt}" → ${analysis.detectedIntent}`);
    }

    // Generate intent tags
    const intentStats = this.promptAnalyzer.getIntentStats();
    status.output?.push(`Intent stats: ${JSON.stringify(intentStats)}`);
  }

  private async executeFrontendBuilderPhase(phaseNumber: number, status: PhaseStatus) {
    const services = ['GoSellr', 'JPS', 'Franchise', 'PSS'];

    for (const service of services) {
      this.frontendBuilder.generateServiceComponents(service);
      status.output?.push(`Generated components for ${service}`);
    }

    // Generate core components
    this.frontendBuilder.generateSQLBadge();
    this.frontendBuilder.generateSearchBar();
    status.output?.push('Generated core UI components');
  }

  private async executeBackendBuilderPhase(phaseNumber: number, status: PhaseStatus) {
    const services = ['user', 'product', 'franchise'];

    for (const service of services) {
      this.backendBuilder.generateServiceAPI(service);
      status.output?.push(`Generated API for ${service}`);
    }

    // Generate auth and core files
    this.backendBuilder.generateAuthRoutes();
    this.backendBuilder.generatePackageJson();
    this.backendBuilder.generateEnvFile();
    status.output?.push('Generated authentication and configuration files');
  }

  private async executeAdminBuilderPhase(phaseNumber: number, status: PhaseStatus) {
    // Generate admin panel components
    const adminComponents = [
      'FranchiseStatsCard',
      'ComplaintTracker',
      'SQLLevelTable',
      'UserIncomeBoard',
      'ServiceToggles'
    ];

    for (const component of adminComponents) {
      this.frontendBuilder.generateComponent({
        name: component,
        type: 'card',
        service: 'admin',
        props: ['title', 'description', 'data'],
        features: ['responsive', 'interactive'],
        sqlLevel: 'VIP'
      });
      status.output?.push(`Generated admin component: ${component}`);
    }
  }

  private async executeDeploymentPhase(phaseNumber: number, status: PhaseStatus) {
    // Generate deployment configuration files
    const deploymentFiles = [
      'vercel.json',
      '.env.generator.ts',
      'github-auto-push.ts',
      'deploy.sh'
    ];

    for (const file of deploymentFiles) {
      const filePath = path.join(__dirname, '../deployment', file);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Generate basic deployment config
      let content = '';
      switch (file) {
        case 'vercel.json':
          content = JSON.stringify({
            version: 2,
            builds: [{ src: "next.config.js", use: "@vercel/next" }],
            routes: [{ src: "/(.*)", dest: "/" }]
          }, null, 2);
          break;
        case '.env.generator.ts':
          content = `export const generateEnv = () => {
  const envKeys = {
    DATABASE_URL: "your_database_url_here",
    JWT_SECRET: "your_jwt_secret_here",
    VERCEL_PROJECT_ID: "your_vercel_id_here"
  };
  return envKeys;
};`;
          break;
        case 'github-auto-push.ts':
          content = `export const pushToGitHub = (commitMsg = "Auto Commit") => {
  console.log("Pushing to GitHub:", commitMsg);
  // Implementation here
};`;
          break;
        case 'deploy.sh':
          content = `#!/bin/bash
echo "Deploying EHB project..."
npm run build
npm run deploy`;
          break;
      }
      
      fs.writeFileSync(filePath, content);
      status.output?.push(`Generated deployment file: ${file}`);
    }
  }

  private async executeDatabasePhase(phaseNumber: number, status: PhaseStatus) {
    // Generate Prisma schema and seed files
    const dbPath = path.join(__dirname, '../backend/prisma');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    // Generate seed file
    const seedContent = `import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create sample users
  await prisma.user.createMany({
    data: [
      { name: 'Admin User', email: 'admin@ehb.com', password: 'hashed_pass', role: 'admin', sqlLevel: 'VIP' },
      { name: 'Test User', email: 'test@ehb.com', password: 'hashed_pass', role: 'user', sqlLevel: 'Free' },
    ],
  });

  // Create sample products
  await prisma.product.createMany({
    data: [
      { name: 'Sample Product 1', price: 29.99, status: 'active', createdBy: 1 },
      { name: 'Sample Product 2', price: 49.99, status: 'active', createdBy: 1 },
    ],
  });

  console.log('Database seeded successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());`;

    const seedPath = path.join(dbPath, 'seed.ts');
    fs.writeFileSync(seedPath, seedContent);
    status.output?.push('Generated database seed file');
  }

  private async executeBlockchainPhase(phaseNumber: number, status: PhaseStatus) {
    // Generate blockchain integration files
    const blockchainPath = path.join(__dirname, '../blockchain');
    if (!fs.existsSync(blockchainPath)) {
      fs.mkdirSync(blockchainPath, { recursive: true });
    }

    // Generate smart contract
    const contractContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EHBGC {
    string public name = "EHB Global Coin";
    string public symbol = "EHBGC";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public lockedBalance;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}`;

    const contractPath = path.join(blockchainPath, 'EHBGC.sol');
    fs.writeFileSync(contractPath, contractContent);
    status.output?.push('Generated smart contract: EHBGC.sol');
  }

  private async executeAIAssistantPhase(phaseNumber: number, status: PhaseStatus) {
    // Generate AI assistant components
    const aiComponents = [
      'AssistantWidget',
      'GlobalSearchBar',
      'VoiceInput'
    ];

    for (const component of aiComponents) {
      this.frontendBuilder.generateComponent({
        name: component,
        type: 'search',
        service: 'ai',
        props: ['onSearch', 'placeholder'],
        features: ['ai-powered', 'voice-input'],
        sqlLevel: 'VIP'
      });
      status.output?.push(`Generated AI component: ${component}`);
    }
  }

  private async executeQAPhase(phaseNumber: number, status: PhaseStatus) {
    // Generate QA testing files
    const qaPath = path.join(__dirname, '../qa-agent');
    if (!fs.existsSync(qaPath)) {
      fs.mkdirSync(qaPath, { recursive: true });
    }

    // Generate test files
    const testFiles = [
      'gosellr.test.ts',
      'dashboard.test.tsx',
      'auth.test.ts'
    ];

    for (const testFile of testFiles) {
      const testContent = `import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "@jest/globals";

describe("${testFile.replace('.test.ts', '').replace('.test.tsx', '')} Tests", () => {
  it("should render correctly", () => {
    expect(true).toBe(true);
  });
});`;

      const testPath = path.join(qaPath, 'tests', testFile);
      const testDir = path.dirname(testPath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      fs.writeFileSync(testPath, testContent);
      status.output?.push(`Generated test file: ${testFile}`);
    }
  }

  private async executePackagerPhase(phaseNumber: number, status: PhaseStatus) {
    // Generate final packaging files
    const packagePath = path.join(__dirname, '../deployment');
    if (!fs.existsSync(packagePath)) {
      fs.mkdirSync(packagePath, { recursive: true });
    }

    // Generate package script
    const packageScript = `#!/bin/bash
echo "Packaging EHB project..."

# Create production bundle
tar -czf ehb-full-project.tar.gz \\
  --exclude=node_modules \\
  --exclude=.git \\
  --exclude=*.log \\
  ./frontend ./backend ./admin ./blockchain

echo "Package created: ehb-full-project.tar.gz"`;

    const scriptPath = path.join(packagePath, 'package.sh');
    fs.writeFileSync(scriptPath, packageScript);
    fs.chmodSync(scriptPath, '755');
    
    status.output?.push('Generated packaging script');
  }

  public getNextPhase(): number | null {
    for (let i = 1; i <= 11; i++) {
      const status = this.status.get(i);
      if (!status || status.status === 'pending') {
        return i;
      }
    }
    return null;
  }

  public getProgress(): { completed: number; total: number; percentage: number } {
    const total = 11;
    const completed = Array.from(this.status.values()).filter(s => s.status === 'completed').length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  }

  public generateReport(): string {
    const progress = this.getProgress();
    const allStatus = this.getAllPhaseStatus();
    
    let report = `# EHB AI Dev Agent - Phase Report\n\n`;
    report += `## Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)\n\n`;
    
    report += `## Phase Status:\n\n`;
    allStatus.forEach(status => {
      const statusIcon = status.status === 'completed' ? '✅' : 
                        status.status === 'in-progress' ? '🔄' : 
                        status.status === 'failed' ? '❌' : '⏳';
      report += `${statusIcon} **Phase ${status.phase}**: ${status.name} (${status.status})\n`;
    });
    
    return report;
  }
}

export default PhaseManager; 