/**
 * EHB AI Dev Agent - Code Injector
 * Handles final integration of fetched code into project
 */

const fs = require('fs');
const path = require('path');

class CodeInjector {
    constructor() {
        this.projectRoot = path.join(__dirname, '../../');
        this.logFile = path.join(__dirname, '../logs/integrations.log');
    }

    /**
     * Main injection method
     */
    async injectCode(adaptedCode, projectContext) {
        try {
            console.log(`🔧 Code Injector: Injecting ${adaptedCode.componentName}`);
            
            // Step 1: Validate injection target
            const validation = this.validateInjection(adaptedCode, projectContext);
            if (!validation.valid) {
                throw new Error(`Injection validation failed: ${validation.error}`);
            }
            
            // Step 2: Create backup
            const backup = await this.createBackup(adaptedCode.path);
            
            // Step 3: Inject the code
            const injectionResult = await this.performInjection(adaptedCode, projectContext);
            
            // Step 4: Update dependencies
            await this.updateDependencies(adaptedCode.dependencies);
            
            // Step 5: Update imports and references
            await this.updateImports(adaptedCode, projectContext);
            
            // Step 6: Test injection
            const testResult = await this.testInjection(adaptedCode);
            
            // Step 7: Log activity
            this.logInjection(adaptedCode, injectionResult, testResult);
            
            return {
                success: true,
                message: `✅ Successfully injected ${adaptedCode.componentName} into ${adaptedCode.path}`,
                data: {
                    componentName: adaptedCode.componentName,
                    path: adaptedCode.path,
                    dependencies: adaptedCode.dependencies,
                    testResult: testResult
                }
            };
            
        } catch (error) {
            console.error('❌ Code Injection Error:', error.message);
            
            // Attempt rollback if backup exists
            if (backup) {
                await this.rollbackInjection(adaptedCode.path, backup);
            }
            
            this.logInjection(adaptedCode, null, { error: error.message });
            
            return {
                success: false,
                message: `❌ Failed to inject code: ${error.message}`
            };
        }
    }

    /**
     * Validate injection target
     */
    validateInjection(adaptedCode, projectContext) {
        // Check if target directory exists or can be created
        const targetDir = path.dirname(path.join(this.projectRoot, adaptedCode.path));
        
        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (error) {
                return {
                    valid: false,
                    error: `Cannot create target directory: ${targetDir}`
                };
            }
        }
        
        // Check if file already exists
        const targetFile = path.join(this.projectRoot, adaptedCode.path);
        if (fs.existsSync(targetFile)) {
            return {
                valid: true,
                warning: `File already exists: ${adaptedCode.path}`
            };
        }
        
        return { valid: true };
    }

    /**
     * Create backup of existing file
     */
    async createBackup(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        
        if (fs.existsSync(fullPath)) {
            const backupPath = `${fullPath}.backup.${Date.now()}`;
            fs.copyFileSync(fullPath, backupPath);
            console.log(`📦 Created backup: ${backupPath}`);
            return backupPath;
        }
        
        return null;
    }

    /**
     * Perform the actual injection
     */
    async performInjection(adaptedCode, projectContext) {
        const targetFile = path.join(this.projectRoot, adaptedCode.path);
        
        // Ensure directory exists
        const targetDir = path.dirname(targetFile);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Write the component file
        fs.writeFileSync(targetFile, adaptedCode.code);
        
        console.log(`✅ Code written to: ${adaptedCode.path}`);
        
        return {
            filePath: adaptedCode.path,
            fileSize: fs.statSync(targetFile).size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Update project dependencies
     */
    async updateDependencies(dependencies) {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            console.log('⚠️ No package.json found, skipping dependency update');
            return;
        }
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            let updated = false;
            
            for (const dep of dependencies) {
                if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
                    packageJson.dependencies[dep] = '^latest';
                    updated = true;
                    console.log(`📦 Added dependency: ${dep}`);
                }
            }
            
            if (updated) {
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                console.log('✅ Updated package.json with new dependencies');
            }
            
        } catch (error) {
            console.log(`⚠️ Failed to update dependencies: ${error.message}`);
        }
    }

    /**
     * Update imports and references
     */
    async updateImports(adaptedCode, projectContext) {
        // Find files that might need to import the new component
        const potentialImportFiles = this.findPotentialImportFiles(adaptedCode.componentName);
        
        for (const file of potentialImportFiles) {
            try {
                await this.addImportToFile(file, adaptedCode);
            } catch (error) {
                console.log(`⚠️ Failed to update imports in ${file}: ${error.message}`);
            }
        }
    }

    /**
     * Find files that might need to import the new component
     */
    findPotentialImportFiles(componentName) {
        const files = [];
        const searchDirs = ['pages', 'components', 'src'];
        
        for (const dir of searchDirs) {
            const dirPath = path.join(this.projectRoot, dir);
            if (fs.existsSync(dirPath)) {
                this.scanDirectory(dirPath, files);
            }
        }
        
        return files.filter(file => {
            const content = fs.readFileSync(file, 'utf8');
            return content.includes('import') && content.includes('from');
        });
    }

    /**
     * Recursively scan directory for files
     */
    scanDirectory(dir, files) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.scanDirectory(fullPath, files);
            } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
                files.push(fullPath);
            }
        }
    }

    /**
     * Add import statement to file
     */
    async addImportToFile(filePath, adaptedCode) {
        const content = fs.readFileSync(filePath, 'utf8');
        const importPath = this.calculateImportPath(filePath, adaptedCode.path);
        
        // Check if import already exists
        if (content.includes(`import ${adaptedCode.componentName}`)) {
            return;
        }
        
        // Add import statement
        const importStatement = `import ${adaptedCode.componentName} from '${importPath}';\n`;
        const updatedContent = importStatement + content;
        
        fs.writeFileSync(filePath, updatedContent);
        console.log(`📝 Added import to: ${path.relative(this.projectRoot, filePath)}`);
    }

    /**
     * Calculate relative import path
     */
    calculateImportPath(fromFile, toFile) {
        const fromDir = path.dirname(fromFile);
        const toDir = path.dirname(path.join(this.projectRoot, toFile));
        const relativePath = path.relative(fromDir, toDir);
        const fileName = path.basename(toFile, path.extname(toFile));
        
        return `./${relativePath}/${fileName}`.replace(/\\/g, '/');
    }

    /**
     * Test the injected code
     */
    async testInjection(adaptedCode) {
        try {
            // Basic syntax check
            const syntaxCheck = this.checkSyntax(adaptedCode.code);
            
            // File existence check
            const fileExists = fs.existsSync(path.join(this.projectRoot, adaptedCode.path));
            
            // Size check
            const fileSize = fileExists ? fs.statSync(path.join(this.projectRoot, adaptedCode.path)).size : 0;
            
            return {
                syntaxValid: syntaxCheck,
                fileExists: fileExists,
                fileSize: fileSize,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                syntaxValid: false,
                fileExists: false,
                fileSize: 0,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Basic syntax check (simplified)
     */
    checkSyntax(code) {
        try {
            // Basic checks
            if (!code.includes('export')) return false;
            if (!code.includes('import') && !code.includes('require')) return false;
            if (!code.includes('return')) return false;
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Rollback injection if needed
     */
    async rollbackInjection(filePath, backupPath) {
        try {
            const targetFile = path.join(this.projectRoot, filePath);
            
            if (backupPath && fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, targetFile);
                fs.unlinkSync(backupPath);
                console.log(`🔄 Rolled back injection: ${filePath}`);
            } else if (fs.existsSync(targetFile)) {
                fs.unlinkSync(targetFile);
                console.log(`🗑️ Removed injected file: ${filePath}`);
            }
        } catch (error) {
            console.error(`❌ Rollback failed: ${error.message}`);
        }
    }

    /**
     * Log injection activity
     */
    logInjection(adaptedCode, injectionResult, testResult) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            componentName: adaptedCode.componentName,
            path: adaptedCode.path,
            injectionResult: injectionResult,
            testResult: testResult,
            dependencies: adaptedCode.dependencies
        };
        
        // Ensure logs directory exists
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Append to log file
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
        
        console.log(`📝 Injection logged: ${adaptedCode.componentName}`);
    }

    /**
     * Get injection statistics
     */
    getInjectionStats() {
        try {
            if (!fs.existsSync(this.logFile)) {
                return { totalInjections: 0, successfulInjections: 0, failedInjections: 0 };
            }
            
            const logs = fs.readFileSync(this.logFile, 'utf8')
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            
            const total = logs.length;
            const successful = logs.filter(log => log.injectionResult && log.injectionResult.filePath).length;
            const failed = total - successful;
            
            return {
                totalInjections: total,
                successfulInjections: successful,
                failedInjections: failed,
                successRate: Math.round((successful / total) * 100)
            };
        } catch (error) {
            return { totalInjections: 0, successfulInjections: 0, failedInjections: 0 };
        }
    }
}

module.exports = CodeInjector; 