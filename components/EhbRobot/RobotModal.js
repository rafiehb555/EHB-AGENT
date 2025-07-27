class EhbRobotModal {
    constructor() {
        this.isVisible = false;
        this.selectedMode = 'robot';
        this.messages = [];
        this.voiceRecognition = null;
        this.isListening = false;
        this.language = this.detectLanguage();
        this.init();
    }

    init() {
        this.createModal();
        this.addStyles();
        this.bindEvents();
        this.initializeVoiceRecognition();
    }

    detectLanguage() {
        const browserLang = navigator.language || 'en-US';
        const langMap = {
            'ur': 'ur-PK',
            'ar': 'ar-SA',
            'hi': 'hi-IN',
            'bn': 'bn-BD',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-BR',
            'ru': 'ru-RU',
            'zh': 'zh-CN',
            'ja': 'ja-JP',
            'ko': 'ko-KR'
        };

        const langCode = browserLang.split('-')[0];
        return langMap[langCode] || browserLang;
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'ehb-robot-modal';
        this.modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <div class="header-content">
                            <div class="mode-selector">
                                <select id="robot-mode">
                                    <option value="robot">🤖 EHB Robot</option>
                                    <option value="assistant">👨‍💼 EHB Assistant</option>
                                    <option value="agent">🕵️ EHB Agent</option>
                                </select>
                            </div>
                            <h3 id="modal-title">EHB AI Assistant</h3>
                        </div>
                        <button class="close-btn" id="close-modal">×</button>
                    </div>

                    <div class="modal-body">
                        <div class="chat-container">
                            <div class="messages" id="messages-container">
                                <!-- Messages will be added here -->
                            </div>
                        </div>

                        <div class="input-container">
                            <div class="input-type-selector">
                                <button class="input-type-btn active" data-type="text">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                    Text
                                </button>
                                <button class="input-type-btn" data-type="voice">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 1C13.66 1 15 2.34 15 4V8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8V4C9 2.34 10.34 1 12 1Z" stroke="currentColor" stroke-width="2"/>
                                        <path d="M19 10V9C19 5.13 15.87 2 12 2C8.13 2 5 5.13 5 9V10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M5 10C5 11.1 4.1 12 3 12H21C19.9 12 19 11.1 19 10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 12V18" stroke="currentColor" stroke-width="2"/>
                                        <path d="M8 18H16" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                    Voice
                                </button>
                            </div>

                            <div class="text-input-container" id="text-input-container">
                                <input type="text" id="message-input" placeholder="Type your message..." />
                                <button id="send-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>

                            <div class="voice-input-container" id="voice-input-container" style="display: none;">
                                <button id="voice-btn" class="voice-btn">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 1C13.66 1 15 2.34 15 4V8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8V4C9 2.34 10.34 1 12 1Z" stroke="currentColor" stroke-width="2"/>
                                        <path d="M19 10V9C19 5.13 15.87 2 12 2C8.13 2 5 5.13 5 9V10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M5 10C5 11.1 4.1 12 3 12H21C19.9 12 19 11.1 19 10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 12V18" stroke="currentColor" stroke-width="2"/>
                                        <path d="M8 18H16" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                    <span id="voice-status">Click to speak</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #ehb-robot-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10001;
                display: none;
            }

            .modal-overlay {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 400px;
                height: 500px;
                background: transparent;
                display: flex;
                align-items: flex-start;
                justify-content: flex-end;
                padding: 0;
            }

            .modal-container {
                background: white;
                border-radius: 20px;
                width: 100%;
                max-width: 400px;
                max-height: 500px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: modalSlideIn 0.3s ease-out;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(30px) translateY(-30px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) translateY(0) scale(1);
                }
            }

            /* Force top-right positioning */
            #ehb-robot-modal .modal-overlay {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                left: auto !important;
                bottom: auto !important;
                width: 400px !important;
                height: 500px !important;
                background: transparent !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                display: flex !important;
                align-items: flex-start !important;
                justify-content: flex-end !important;
                padding: 0 !important;
            }

            /* Remove backdrop blur from body */
            body.modal-open {
                overflow: auto !important;
            }

            body.modal-open::before {
                display: none !important;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                border-radius: 20px 20px 0 0;
            }

            .header-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .mode-selector select {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
            }

            .mode-selector select option {
                background: #333;
                color: white;
            }

            #modal-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .modal-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 0;
            }

            .chat-container {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                max-height: 400px;
            }

            .messages {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .message {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                animation: messageSlideIn 0.3s ease-out;
            }

            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .message.user {
                flex-direction: row-reverse;
            }

            .message-avatar {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }

            .message.user .message-avatar {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }

            .message.bot .message-avatar {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
            }

            .message-content {
                background: #f5f5f5;
                padding: 12px 16px;
                border-radius: 18px;
                max-width: 70%;
                word-wrap: break-word;
            }

            .message.user .message-content {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }

            .message.bot .message-content {
                background: #f0f0f0;
                color: #333;
            }

            .input-container {
                padding: 20px;
                border-top: 1px solid #e0e0e0;
                background: #fafafa;
                border-radius: 0 0 20px 20px;
            }

            .input-type-selector {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .input-type-btn {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 8px 12px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }

            .input-type-btn.active {
                background: #4CAF50;
                color: white;
                border-color: #4CAF50;
            }

            .text-input-container {
                display: flex;
                gap: 10px;
            }

            #message-input {
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #ddd;
                border-radius: 25px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.3s;
            }

            #message-input:focus {
                border-color: #4CAF50;
            }

            #send-btn {
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 50%;
                width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s;
            }

            #send-btn:hover {
                background: #45a049;
                transform: scale(1.05);
            }

            .voice-input-container {
                display: flex;
                justify-content: center;
            }

            .voice-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                padding: 20px;
                border: 2px solid #4CAF50;
                background: white;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s;
                min-width: 120px;
            }

            .voice-btn:hover {
                background: #f0f8f0;
            }

            .voice-btn.listening {
                background: #4CAF50;
                color: white;
                animation: pulse 1.5s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            #voice-status {
                font-size: 12px;
                text-align: center;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .modal-container {
                    max-width: 95vw;
                    max-height: 90vh;
                }

                .modal-header {
                    padding: 15px 20px;
                }

                .chat-container {
                    padding: 15px;
                    max-height: 300px;
                }

                .input-container {
                    padding: 15px;
                }

                .message-content {
                    max-width: 85%;
                }
            }

            /* Phase 2: Action confirmations and processing indicators */
            .processing-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                padding: 20px;
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid #4CAF50;
                border-radius: 10px;
                margin: 10px 0;
                animation: fadeIn 0.3s ease-out;
            }

            .processing-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #4CAF50;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .processing-text {
                font-size: 14px;
                color: #4CAF50;
                font-weight: 500;
            }

            .action-confirmation {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 15px;
                border-radius: 10px;
                margin: 10px 0;
                animation: slideInUp 0.3s ease-out;
                border: 1px solid;
            }

            .action-confirmation.success {
                background: rgba(76, 175, 80, 0.1);
                border-color: #4CAF50;
                color: #4CAF50;
            }

            .action-confirmation.info {
                background: rgba(33, 150, 243, 0.1);
                border-color: #2196F3;
                color: #2196F3;
            }

            .action-confirmation.warning {
                background: rgba(255, 152, 0, 0.1);
                border-color: #FF9800;
                color: #FF9800;
            }

            .confirmation-icon {
                font-size: 24px;
            }

            .confirmation-text {
                font-size: 14px;
                font-weight: 600;
                text-align: center;
            }

            .confirmation-details {
                font-size: 12px;
                text-align: center;
                opacity: 0.8;
            }

            .confirmation-progress {
                width: 100%;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                overflow: hidden;
            }

            .confirmation-progress::after {
                content: '';
                display: block;
                width: 30%;
                height: 100%;
                background: currentColor;
                animation: progress 2s ease-in-out infinite;
            }

            @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* Phase 3: Authentication and confirmation styles */
            .auth-prompt {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                padding: 20px;
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid #FFC107;
                border-radius: 10px;
                margin: 10px 0;
                animation: slideInUp 0.3s ease-out;
            }

            .auth-icon {
                font-size: 32px;
            }

            .auth-text {
                font-size: 16px;
                font-weight: 600;
                text-align: center;
                color: #FFC107;
            }

            .auth-actions {
                display: flex;
                gap: 10px;
            }

            .auth-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .login-btn {
                background: #4CAF50;
                color: white;
            }

            .login-btn:hover {
                background: #45a049;
            }

            .register-btn {
                background: #2196F3;
                color: white;
            }

            .register-btn:hover {
                background: #1976D2;
            }

            .confirmation-prompt {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                padding: 20px;
                background: rgba(33, 150, 243, 0.1);
                border: 1px solid #2196F3;
                border-radius: 10px;
                margin: 10px 0;
                animation: slideInUp 0.3s ease-out;
            }

            .confirmation-text {
                font-size: 16px;
                font-weight: 600;
                text-align: center;
                color: #2196F3;
            }

            .confirmation-actions {
                display: flex;
                gap: 10px;
            }

            .confirm-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .yes-btn {
                background: #4CAF50;
                color: white;
            }

            .yes-btn:hover {
                background: #45a049;
            }

            .no-btn {
                background: #f44336;
                color: white;
            }

            .no-btn:hover {
                background: #d32f2f;
            }

            .success-animation {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                padding: 20px;
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid #4CAF50;
                border-radius: 10px;
                margin: 10px 0;
                animation: bounceIn 0.5s ease-out;
            }

            .success-icon {
                font-size: 48px;
                animation: pulse 1s ease-in-out infinite;
            }

            .success-text {
                font-size: 18px;
                font-weight: 600;
                color: #4CAF50;
            }

            @keyframes bounceIn {
                0% {
                    opacity: 0;
                    transform: scale(0.3);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.05);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Close button
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hide();
        });

        // Mode selector
        document.getElementById('robot-mode').addEventListener('change', (e) => {
            this.selectedMode = e.target.value;
            this.updateModalTitle();
        });

        // Input type selector
        document.querySelectorAll('.input-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.closest('.input-type-btn').dataset.type;
                this.switchInputType(type);
            });
        });

        // Send button
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key in input
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        // Close on overlay click
        this.modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hide();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    initializeVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();

            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = this.language;

            this.voiceRecognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton();
            };

            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.addMessage('user', transcript);
                this.processUserMessage(transcript);
                this.isListening = false;
                this.updateVoiceButton();
            };

            this.voiceRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateVoiceButton();
            };

            this.voiceRecognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };
        } else {
            console.warn('Speech recognition not supported');
            document.querySelector('.input-type-btn[data-type="voice"]').style.display = 'none';
        }
    }

    switchInputType(type) {
        const textContainer = document.getElementById('text-input-container');
        const voiceContainer = document.getElementById('voice-input-container');
        const buttons = document.querySelectorAll('.input-type-btn');

        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.closest('.input-type-btn').classList.add('active');

        if (type === 'text') {
            textContainer.style.display = 'flex';
            voiceContainer.style.display = 'none';
        } else {
            textContainer.style.display = 'none';
            voiceContainer.style.display = 'flex';
        }
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceStatus = document.getElementById('voice-status');

        if (this.isListening) {
            voiceBtn.classList.add('listening');
            voiceStatus.textContent = 'Listening...';
        } else {
            voiceBtn.classList.remove('listening');
            voiceStatus.textContent = 'Click to speak';
        }
    }

    toggleVoiceRecognition() {
        if (!this.voiceRecognition) {
            alert('Voice recognition is not supported in your browser');
            return;
        }

        if (this.isListening) {
            this.voiceRecognition.stop();
        } else {
            this.voiceRecognition.start();
        }
    }

    updateModalTitle() {
        const titles = {
            'robot': '🤖 EHB Robot',
            'assistant': '👨‍💼 EHB Assistant',
            'agent': '🕵️ EHB Agent'
        };
        document.getElementById('modal-title').textContent = titles[this.selectedMode];
    }

    addMessage(sender, content) {
        const message = {
            id: Date.now(),
            sender,
            content,
            timestamp: new Date()
        };

        this.messages.push(message);
        this.displayMessage(message);
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender}`;
        messageElement.innerHTML = `
            <div class="message-avatar">
                ${message.sender === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content">
                ${message.content}
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (message) {
            this.addMessage('user', message);
            this.processUserMessage(message);
            input.value = '';
        }
    }

            processUserMessage(message) {
        // Phase 3: Use real backend integration
        if (window.RobotCommandEngine && this.selectedMode === 'robot') {
            // Initialize command engine if not already done
            if (!this.commandEngine) {
                this.commandEngine = new window.RobotCommandEngine();
            }

            // Process command with real backend integration
            this.commandEngine.processCommand(message).then(result => {
                this.addMessage('bot', result.message);

                // DISABLED: Authentication requirement for development
                // if (result.requiresAuth) {
                //     this.showAuthPrompt();
                // }

                // Handle confirmation requirement
                if (result.requiresConfirmation) {
                    this.showConfirmationPrompt(result.confirmationData);
                }

                // Handle special actions
                if (result.action) {
                    this.handleSpecialAction(result.action, result.data);
                }
            }).catch(error => {
                console.error('Command processing error:', error);
                this.addMessage('bot', 'Sorry, I encountered an error while processing your request.');
            });
        } else {
            // Fallback to Phase 1 responses for Assistant and Agent modes
            setTimeout(() => {
                const responses = {
                    'assistant': [
                        '👨‍💼 I\'ll help you with that...',
                        '👨‍💼 Let me assist you...',
                        '👨‍💼 I\'m here to help...',
                        '👨‍💼 Working on your request...'
                    ],
                    'agent': [
                        '🕵️ Investigating your request...',
                        '🕵️ Let me analyze that...',
                        '🕵️ Processing your query...',
                        '🕵️ Working on the solution...'
                    ]
                };

                const modeResponses = responses[this.selectedMode] || ['Processing your request...'];
                const randomResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)];

                this.addMessage('bot', randomResponse);
            }, 1000);
        }
    }

    show() {
        this.modal.style.display = 'block';
        this.isVisible = true;
        document.getElementById('message-input').focus();

        // Add welcome message if no messages
        if (this.messages.length === 0) {
            this.addMessage('bot', `Hello! I'm your ${this.selectedMode === 'robot' ? 'EHB Robot' : this.selectedMode === 'assistant' ? 'EHB Assistant' : 'EHB Agent'}. How can I help you today?`);
        }
    }

    hide() {
        this.modal.style.display = 'none';
        this.isVisible = false;

        // Stop voice recognition if active
        if (this.isListening && this.voiceRecognition) {
            this.voiceRecognition.stop();
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Show authentication prompt
    showAuthPrompt() {
        const authMessage = `
            <div class="auth-prompt">
                <div class="auth-icon">🔧</div>
                <div class="auth-text">This feature is under development. Coming soon!</div>
                <div class="auth-actions">
                    <button class="auth-btn login-btn" disabled style="opacity: 0.5;">Login (Disabled)</button>
                    <button class="auth-btn register-btn" disabled style="opacity: 0.5;">Register (Disabled)</button>
                </div>
            </div>
        `;

        this.addMessage('bot', authMessage, true);
    }

    // Show confirmation prompt
    showConfirmationPrompt(confirmationData) {
        const confirmMessage = `
            <div class="confirmation-prompt">
                <div class="confirmation-text">${confirmationData.message || 'Please confirm your action:'}</div>
                <div class="confirmation-actions">
                    <button class="confirm-btn yes-btn" onclick="window.ehbRobotModal.confirmAction('yes', ${JSON.stringify(confirmationData)})">Yes</button>
                    <button class="confirm-btn no-btn" onclick="window.ehbRobotModal.confirmAction('no')">No</button>
                </div>
            </div>
        `;

        this.addMessage('bot', confirmMessage, true);
        this.currentConfirmation = confirmationData;
    }

    // Handle confirmation action
    async confirmAction(response, confirmationData = null) {
        if (response === 'yes' && confirmationData) {
            try {
                const result = await this.commandEngine.robotCommands.confirmAction(confirmationData);
                this.addMessage('bot', result.message);

                if (result.success) {
                    // Show success animation
                    this.showSuccessAnimation();
                }
            } catch (error) {
                console.error('Confirmation error:', error);
                this.addMessage('bot', error.message);
            }
        } else {
            this.addMessage('bot', 'Action cancelled.');
        }

        // Clear current confirmation
        this.currentConfirmation = null;
    }

    // Show success animation
    showSuccessAnimation() {
        const modal = document.getElementById('ehb-robot-modal');
        if (modal) {
            const animation = document.createElement('div');
            animation.className = 'success-animation';
            animation.innerHTML = `
                <div class="success-icon">✅</div>
                <div class="success-text">Success!</div>
            `;

            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(animation);

                // Remove after 2 seconds
                setTimeout(() => {
                    if (animation.parentNode) {
                        animation.remove();
                    }
                }, 2000);
            }
        }
    }

    // Handle special actions
    handleSpecialAction(action, data) {
        switch (action) {
            case 'navigation':
                console.log('🧭 Navigation action:', data);
                break;
            case 'order_placed':
                console.log('📦 Order placed:', data);
                break;
            case 'wallet_displayed':
                console.log('💰 Wallet displayed:', data);
                break;
            case 'search_completed':
                console.log('🔍 Search completed:', data);
                break;
            default:
                console.log('No special action handler for:', action);
        }
    }
}
