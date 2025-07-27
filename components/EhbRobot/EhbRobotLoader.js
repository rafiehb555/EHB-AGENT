// EHB Robot Loader - Main Integration Script
class EhbRobotLoader {
    constructor() {
        this.isLoaded = false;
        this.components = {};
        this.init();
    }

    init() {
        this.loadComponents();
        this.setupGlobalAccess();
        this.addToAllPages();
    }

    loadComponents() {
        // Load Robot Button
        this.loadScript('components/EhbRobot/RobotButton.js');

        // Load Robot Modal
        this.loadScript('components/EhbRobot/RobotModal.js');
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupGlobalAccess() {
        // Make EHB Robot globally accessible
        window.EhbRobot = {
            show: () => {
                if (window.ehbRobotModal) {
                    window.ehbRobotModal.show();
                }
            },
            hide: () => {
                if (window.ehbRobotModal) {
                    window.ehbRobotModal.hide();
                }
            },
            toggle: () => {
                if (window.ehbRobotModal) {
                    window.ehbRobotModal.toggle();
                }
            },
            sendMessage: (message) => {
                if (window.ehbRobotModal) {
                    window.ehbRobotModal.addMessage('user', message);
                    window.ehbRobotModal.processUserMessage(message);
                }
            },
            getStatus: () => {
                return {
                    button: window.ehbRobotButton ? window.ehbRobotButton.isVisible : false,
                    modal: window.ehbRobotModal ? window.ehbRobotModal.isVisible : false,
                    language: window.ehbRobotModal ? window.ehbRobotModal.language : 'en-US'
                };
            }
        };
    }

    addToAllPages() {
        // Add robot button to all pages
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeRobot();
            });
        } else {
            this.initializeRobot();
        }
    }

    initializeRobot() {
        // Initialize robot button
        if (!window.ehbRobotButton) {
            window.ehbRobotButton = new EhbRobotButton();
        }

        // Add keyboard shortcuts
        this.addKeyboardShortcuts();

        // Add to navigation if not already present
        this.addToNavigation();

        // Add robot card to agent pages if applicable
        this.addRobotCard();

        console.log('🤖 EHB Robot loaded successfully');
    }

    addKeyboardShortcuts() {
        // Ctrl/Cmd + Shift + R to open robot
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                if (window.ehbRobotModal) {
                    window.ehbRobotModal.show();
                }
            }
        });
    }

    addToNavigation() {
        // Add robot link to navigation if it exists
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && !document.querySelector('.nav-links a[href="/ehb-robot"]')) {
            const robotLink = document.createElement('li');
            robotLink.innerHTML = '<a href="/ehb-robot">🧠 EHB Robot</a>';
            navLinks.appendChild(robotLink);
        }
    }

    addRobotCard() {
        // Add robot card to agent management pages
        const agentGrid = document.querySelector('.features-grid, .status-grid');
        if (agentGrid && !document.querySelector('.robot-card')) {
            const robotCard = document.createElement('div');
            robotCard.className = 'feature-card robot-card';
            robotCard.innerHTML = `
                <div class="feature-icon">🤖</div>
                <h3 class="feature-title">Meet EHB Robot</h3>
                <p class="feature-desc">Your AI-powered assistant for browsing and using EHB services hands-free</p>
                <button class="btn btn-primary" onclick="window.EhbRobot.show()">Launch Robot</button>
            `;
            agentGrid.appendChild(robotCard);
        }
    }
}

// Auto-initialize EHB Robot Loader
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ehbRobotLoader = new EhbRobotLoader();
    });
} else {
    window.ehbRobotLoader = new EhbRobotLoader();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EhbRobotLoader;
}
