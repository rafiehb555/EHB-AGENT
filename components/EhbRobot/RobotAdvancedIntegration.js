// 🚀 EHB AI Robot Advanced Integration Layer
// Connects all advanced features with the existing robot system

class RobotAdvancedIntegration {
    constructor() {
        this.advancedFeatures = null;
        this.robotModal = null;
        this.commandEngine = null;
        this.isAdvancedMode = false;

        this.initIntegration();
    }

    initIntegration() {
        // Initialize advanced features
        this.advancedFeatures = new AdvancedRobotFeatures();

        // Connect with existing robot components
        this.connectWithExistingSystem();

        console.log('🚀 Advanced Robot Integration initialized!');
    }

    connectWithExistingSystem() {
        // Wait for existing components to load
        setTimeout(() => {
            this.robotModal = window.ehbRobotModal;
            this.commandEngine = window.RobotCommandEngine;

            if (this.robotModal && this.commandEngine) {
                this.enableAdvancedFeatures();
            }
        }, 1000);
    }

    enableAdvancedFeatures() {
        // Add advanced mode toggle
        this.addAdvancedModeToggle();

        // Enhance command processing
        this.enhanceCommandProcessing();

        // Add voice vault interface
        this.addVoiceVaultInterface();

        // Add personality controls
        this.addPersonalityControls();

        // Add developer mode
        this.addDeveloperMode();

        // Add collaboration interface
        this.addCollaborationInterface();

        // Add legal assistant
        this.addLegalAssistant();

        // Add franchise court
        this.addFranchiseCourt();

        console.log('✅ Advanced features integrated with existing robot system');
    }

    addAdvancedModeToggle() {
        const toggleHtml = `
            <div class="advanced-mode-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" id="advancedModeToggle">
                    <span class="slider"></span>
                </label>
                <span class="toggle-label">🚀 Advanced Mode</span>
            </div>
        `;

        // Add to robot modal
        if (this.robotModal && this.robotModal.modal) {
            const header = this.robotModal.modal.querySelector('.modal-header');
            if (header) {
                header.insertAdjacentHTML('beforeend', toggleHtml);

                // Add event listener
                const toggle = document.getElementById('advancedModeToggle');
                toggle.addEventListener('change', (e) => {
                    this.isAdvancedMode = e.target.checked;
                    this.onAdvancedModeToggle();
                });
            }
        }
    }

    onAdvancedModeToggle() {
        if (this.isAdvancedMode) {
            this.showAdvancedFeatures();
            this.robotModal.addMessage('bot', '🚀 Advanced Mode activated! You now have access to telepathy, voice vault, personality builder, and more advanced features.');
        } else {
            this.hideAdvancedFeatures();
            this.robotModal.addMessage('bot', 'Standard mode activated. Advanced features disabled.');
        }
    }

    showAdvancedFeatures() {
        // Show advanced feature buttons
        const advancedButtons = `
            <div class="advanced-features-panel">
                <button class="advanced-btn" onclick="robotAdvancedIntegration.openTelepathyMode()">
                    🧠📡 Telepathy Mode
                </button>
                <button class="advanced-btn" onclick="robotAdvancedIntegration.openVoiceVault()">
                    📋🔒 Voice Vault
                </button>
                <button class="advanced-btn" onclick="robotAdvancedIntegration.openPersonalityBuilder()">
                    🧬🧠 Personality Builder
                </button>
                <button class="advanced-btn" onclick="robotAdvancedIntegration.openDeveloperMode()">
                    🧠🛠️ Developer Mode
                </button>
                <button class="advanced-btn" onclick="robotAdvancedIntegration.openCollaboration()">
                    🤝🔄 Collaboration
                </button>
                <button class="advanced-btn" onclick="robotAdvancedIntegration.openLegalAssistant()">
                    🧑‍⚖️💼 Legal Assistant
                </button>
                <button class="advanced-btn" onclick="robotAdvancedIntegration.openFranchiseCourt()">
                    🏛️📊 Franchise Court
                </button>
            </div>
        `;

        // Add to modal
        if (this.robotModal && this.robotModal.modal) {
            const chatContainer = this.robotModal.modal.querySelector('.chat-messages');
            if (chatContainer) {
                const existingPanel = chatContainer.querySelector('.advanced-features-panel');
                if (!existingPanel) {
                    chatContainer.insertAdjacentHTML('beforeend', advancedButtons);
                }
            }
        }
    }

    hideAdvancedFeatures() {
        const panel = document.querySelector('.advanced-features-panel');
        if (panel) {
            panel.remove();
        }
    }

    enhanceCommandProcessing() {
        // Override existing command processing
        if (this.commandEngine) {
            const originalProcessCommand = this.commandEngine.processCommand;

            this.commandEngine.processCommand = async (input, context) => {
                // Check for advanced commands first
                const advancedResult = await this.processAdvancedCommand(input, context);
                if (advancedResult) {
                    return advancedResult;
                }

                // Fall back to original processing
                return originalProcessCommand.call(this.commandEngine, input, context);
            };
        }
    }

    async processAdvancedCommand(input, context) {
        const lowerInput = input.toLowerCase();

        // Telepathy mode commands
        if (lowerInput.includes('telepathy') || lowerInput.includes('mind reading')) {
            return this.handleTelepathyCommand(input);
        }

        // Voice vault commands
        if (lowerInput.includes('vault') || lowerInput.includes('store') || lowerInput.includes('secure')) {
            return this.handleVoiceVaultCommand(input);
        }

        // Personality commands
        if (lowerInput.includes('personality') || lowerInput.includes('name') || lowerInput.includes('style')) {
            return this.handlePersonalityCommand(input);
        }

        // Developer commands
        if (lowerInput.includes('developer') || lowerInput.includes('code') || lowerInput.includes('deploy')) {
            return this.handleDeveloperCommand(input);
        }

        // Cross-service commands
        if (lowerInput.includes('job') && lowerInput.includes('wallet') && lowerInput.includes('sql')) {
            return this.handleCrossServiceCommand(input);
        }

        // Multi-step task commands
        if (lowerInput.includes('pehle') && lowerInput.includes('phir') && lowerInput.includes('aur')) {
            return this.handleMultiStepCommand(input);
        }

        // Collaboration commands
        if (lowerInput.includes('collaboration') || lowerInput.includes('team') || lowerInput.includes('share')) {
            return this.handleCollaborationCommand(input);
        }

        // Legal commands
        if (lowerInput.includes('legal') || lowerInput.includes('contract') || lowerInput.includes('case')) {
            return this.handleLegalCommand(input);
        }

        // Franchise court commands
        if (lowerInput.includes('dispute') || lowerInput.includes('complaint') || lowerInput.includes('court')) {
            return this.handleFranchiseCourtCommand(input);
        }

        return null; // Let original processor handle it
    }

    // 🧠📡 TELEPATHY MODE
    async handleTelepathyCommand(input) {
        const telepathyResult = this.advancedFeatures.expressionAnalyzer.predictIntent([
            { tone: 'normal', pauseDuration: 1000 },
            { tone: 'excited', pauseDuration: 500 }
        ]);

        const responses = {
            'needs_help': 'I sense you might need assistance. Would you like me to help you with something?',
            'wants_to_order': 'I can feel you want to place an order. What would you like to order?',
            'needs_assurance': 'I understand you might be feeling uncertain. Let me assure you, I\'m here to help.',
            'general_inquiry': 'I\'m reading your intent. How can I assist you today?'
        };

        return {
            success: true,
            message: responses[telepathyResult] || 'I\'m sensing your thoughts. How can I help?',
            requiresConfirmation: false
        };
    }

    // 📋🔒 VOICE VAULT
    async handleVoiceVaultCommand(input) {
        if (input.toLowerCase().includes('store')) {
            return {
                success: true,
                message: 'Voice vault ready. Please speak the data you want to store securely.',
                requiresConfirmation: true,
                confirmationData: {
                    type: 'voice_vault_store',
                    action: 'store_data'
                }
            };
        } else if (input.toLowerCase().includes('retrieve') || input.toLowerCase().includes('open')) {
            return {
                success: true,
                message: 'Voice vault ready. Please speak to unlock your stored data.',
                requiresConfirmation: true,
                confirmationData: {
                    type: 'voice_vault_retrieve',
                    action: 'retrieve_data'
                }
            };
        }

        return {
            success: true,
            message: 'Voice vault activated. Say "store" to save data or "retrieve" to access stored data.',
            requiresConfirmation: false
        };
    }

    // 🧬🧠 PERSONALITY BUILDER
    async handlePersonalityCommand(input) {
        if (input.toLowerCase().includes('name')) {
            const nameMatch = input.match(/name\s+(\w+)/i);
            if (nameMatch) {
                const newName = nameMatch[1];
                this.advancedFeatures.personalitySettings.updatePersonality({ name: newName });
                return {
                    success: true,
                    message: `Perfect! I'm now called ${newName}. How can I help you, ${newName}?`,
                    requiresConfirmation: false
                };
            }
        }

        if (input.toLowerCase().includes('language')) {
            const language = input.toLowerCase().includes('urdu') ? 'urdu' : 'english';
            this.advancedFeatures.personalitySettings.updatePersonality({ language });
            return {
                success: true,
                message: `Language changed to ${language}. I'll now speak in ${language}.`,
                requiresConfirmation: false
            };
        }

        return {
            success: true,
            message: 'Personality builder activated. You can change my name, language, tone, and style.',
            requiresConfirmation: false
        };
    }

    // 🧠🛠️ DEVELOPER MODE
    async handleDeveloperCommand(input) {
        if (!this.advancedFeatures.developerMode.enabled) {
            this.advancedFeatures.developerMode.enable();
        }

        const result = await this.advancedFeatures.developerMode.executeCommand(input);
        return {
            success: true,
            message: result,
            requiresConfirmation: false
        };
    }

    // 🧩🔀 CROSS-SERVICE COMMAND
    async handleCrossServiceCommand(input) {
        const result = await this.advancedFeatures.executeCrossServiceCommand(input);
        return {
            success: true,
            message: result.message,
            requiresConfirmation: false,
            data: result
        };
    }

    // 🧠📆 MULTI-STEP TASK
    async handleMultiStepCommand(input) {
        // Parse multi-step tasks from input
        const tasks = this.parseMultiStepTasks(input);
        const chainId = this.advancedFeatures.taskManager.createTaskChain(tasks, 'current_user');

        // Execute the task chain
        const result = await this.advancedFeatures.taskManager.executeTaskChain(chainId);

        return {
            success: true,
            message: `Multi-step task completed! ${result.completed} tasks completed successfully.`,
            requiresConfirmation: false,
            data: result
        };
    }

    parseMultiStepTasks(input) {
        const tasks = [];

        // Simple parsing for demo
        if (input.includes('pehle')) {
            const pehleMatch = input.match(/pehle\s+(.+?)(?=\s+phir|aur|$)/i);
            if (pehleMatch) tasks.push(pehleMatch[1].trim());
        }

        if (input.includes('phir')) {
            const phirMatch = input.match(/phir\s+(.+?)(?=\s+aur|$)/i);
            if (phirMatch) tasks.push(phirMatch[1].trim());
        }

        if (input.includes('aur')) {
            const aurMatch = input.match(/aur\s+(.+?)(?=\s+$)/i);
            if (aurMatch) tasks.push(aurMatch[1].trim());
        }

        return tasks;
    }

    // 🤝🔄 COLLABORATION
    async handleCollaborationCommand(input) {
        return {
            success: true,
            message: 'Collaboration mode activated. You can now work with other users through their robots.',
            requiresConfirmation: true,
            confirmationData: {
                type: 'collaboration',
                action: 'create_session'
            }
        };
    }

    // 🧑‍⚖️💼 LEGAL ASSISTANT
    async handleLegalCommand(input) {
        if (input.toLowerCase().includes('contract')) {
            return {
                success: true,
                message: 'Legal assistant activated. I can help you create contracts, file cases, and connect with VIP SQL lawyers.',
                requiresConfirmation: true,
                confirmationData: {
                    type: 'legal_contract',
                    action: 'create_contract'
                }
            };
        }

        if (input.toLowerCase().includes('case')) {
            return {
                success: true,
                message: 'Case filing system activated. I can help you file legal cases and auto-pay fees from your wallet.',
                requiresConfirmation: true,
                confirmationData: {
                    type: 'legal_case',
                    action: 'file_case'
                }
            };
        }

        return {
            success: true,
            message: 'Legal assistant ready. Say "contract" for contract creation or "case" for filing legal cases.',
            requiresConfirmation: false
        };
    }

    // 🏛️📊 FRANCHISE COURT
    async handleFranchiseCourtCommand(input) {
        return {
            success: true,
            message: 'Franchise court activated. I can help you file disputes and auto-resolve them with fines and credits.',
            requiresConfirmation: true,
            confirmationData: {
                type: 'franchise_court',
                action: 'file_dispute'
            }
        };
    }

    // UI Methods for Advanced Features
    openTelepathyMode() {
        this.robotModal.addMessage('bot', '🧠📡 Telepathy mode activated! I can now understand your unspoken intent through voice patterns.');
    }

    openVoiceVault() {
        this.robotModal.addMessage('bot', '📋🔒 Voice vault ready! Speak your confidential data and it will be stored securely with voice-lock protection.');
    }

    openPersonalityBuilder() {
        this.robotModal.addMessage('bot', '🧬🧠 Personality builder activated! You can customize my name, language, tone, and behavior.');
    }

    openDeveloperMode() {
        this.advancedFeatures.developerMode.enable();
        this.robotModal.addMessage('bot', '🧠🛠️ Developer mode activated! You can now give voice commands for coding, deployment, and development tasks.');
    }

    openCollaboration() {
        this.robotModal.addMessage('bot', '🤝🔄 Collaboration mode activated! You can now work with other users through their robots.');
    }

    openLegalAssistant() {
        this.robotModal.addMessage('bot', '🧑‍⚖️💼 Legal assistant activated! I can help with contracts, cases, and VIP SQL lawyer connections.');
    }

    openFranchiseCourt() {
        this.robotModal.addMessage('bot', '🏛️📊 Franchise court activated! I can handle disputes with auto-resolution and fines.');
    }
}

// Create global instance
window.robotAdvancedIntegration = new RobotAdvancedIntegration();
