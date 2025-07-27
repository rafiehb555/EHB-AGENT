#!/usr/bin/env node

/**
 * Simple Deployment Test
 * Basic deployment test without complex checks
 */

const fs = require('fs');
const path = require('path');

class SimpleDeploymentTest {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: {},
            status: 'running'
        };
    }

    /**
     * Basic file structure check
     */
    async checkFileStructure() {
        console.log('📁 Checking file structure...');
        
        const requiredFiles = [
            'package.json',
            'frontend/package.json',
            'backend/requirements.txt',
            'agents/ehb-agent-hub.js',
            'agents/portable-ehb-system.js'
        ];
        
        const missingFiles = [];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                missingFiles.push(file);
            }
        }
        
        const passed = missingFiles.length === 0;
        
        this.results.tests.fileStructure = {
            passed,
            message: passed ? 'All required files found' : `Missing files: ${missingFiles.join(', ')}`,
            missingFiles
        };
        
        console.log(`✅ File structure check: ${passed ? 'PASSED' : 'FAILED'}`);
        return passed;
    }

    /**
     * Basic dependency check
     */
    async checkDependencies() {
        console.log('📦 Checking dependencies...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
            
            const requiredDeps = ['react', 'next', 'axios'];
            const missingDeps = [];
            
            for (const dep of requiredDeps) {
                if (!packageJson.dependencies?.[dep] && !frontendPackageJson.dependencies?.[dep]) {
                    missingDeps.push(dep);
                }
            }
            
            const passed = missingDeps.length === 0;
            
            this.results.tests.dependencies = {
                passed,
                message: passed ? 'All required dependencies found' : `Missing dependencies: ${missingDeps.join(', ')}`,
                missingDeps
            };
            
            console.log(`✅ Dependencies check: ${passed ? 'PASSED' : 'FAILED'}`);
            return passed;
        } catch (error) {
            this.results.tests.dependencies = {
                passed: false,
                message: `Error checking dependencies: ${error.message}`
            };
            console.log('❌ Dependencies check: FAILED');
            return false;
        }
    }

    /**
     * Basic agent functionality check
     */
    async checkAgentFunctionality() {
        console.log('🤖 Checking agent functionality...');
        
        const agents = [
            'agents/ehb-agent-hub.js',
            'agents/portable-ehb-system.js',
            'agents/external-api-integration.js',
            'agents/production-deployment.js'
        ];
        
        const workingAgents = [];
        const brokenAgents = [];
        
        for (const agent of agents) {
            if (fs.existsSync(agent)) {
                try {
                    // Try to require the agent
                    require(path.resolve(agent));
                    workingAgents.push(agent);
                } catch (error) {
                    brokenAgents.push({ agent, error: error.message });
                }
            } else {
                brokenAgents.push({ agent, error: 'File not found' });
            }
        }
        
        const passed = brokenAgents.length === 0;
        
        this.results.tests.agentFunctionality = {
            passed,
            message: passed ? 'All agents working' : `${brokenAgents.length} agents have issues`,
            workingAgents,
            brokenAgents
        };
        
        console.log(`✅ Agent functionality check: ${passed ? 'PASSED' : 'FAILED'}`);
        return passed;
    }

    /**
     * Basic configuration check
     */
    async checkConfiguration() {
        console.log('⚙️ Checking configuration...');
        
        const configFiles = [
            'ehb-agent-config.json',
            'ehb-portable-config.json',
            'api-integration-config.json',
            'deployment-config.json'
        ];
        
        const existingConfigs = [];
        const missingConfigs = [];
        
        for (const config of configFiles) {
            if (fs.existsSync(config)) {
                existingConfigs.push(config);
            } else {
                missingConfigs.push(config);
            }
        }
        
        const passed = existingConfigs.length > 0; // At least one config should exist
        
        this.results.tests.configuration = {
            passed,
            message: passed ? 'Configuration files found' : 'No configuration files found',
            existingConfigs,
            missingConfigs
        };
        
        console.log(`✅ Configuration check: ${passed ? 'PASSED' : 'FAILED'}`);
        return passed;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting simple deployment test...');
        
        const tests = [
            this.checkFileStructure(),
            this.checkDependencies(),
            this.checkAgentFunctionality(),
            this.checkConfiguration()
        ];
        
        const results = await Promise.all(tests);
        const allPassed = results.every(result => result);
        
        this.results.status = allPassed ? 'passed' : 'failed';
        this.results.summary = {
            totalTests: tests.length,
            passedTests: results.filter(r => r).length,
            failedTests: results.filter(r => !r).length,
            allPassed
        };
        
        // Save results
        const resultsPath = path.join(process.cwd(), 'simple-deployment-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        
        console.log('\n📊 Test Results:');
        console.log(`Total Tests: ${this.results.summary.totalTests}`);
        console.log(`Passed: ${this.results.summary.passedTests}`);
        console.log(`Failed: ${this.results.summary.failedTests}`);
        console.log(`Overall Status: ${this.results.status.toUpperCase()}`);
        
        if (allPassed) {
            console.log('🎉 All tests passed! System is ready for deployment.');
        } else {
            console.log('⚠️ Some tests failed. Please fix issues before deployment.');
        }
        
        return this.results;
    }
}

// Main execution
async function main() {
    const test = new SimpleDeploymentTest();
    await test.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleDeploymentTest; 