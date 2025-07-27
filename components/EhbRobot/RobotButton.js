class EhbRobotButton {
    constructor() {
        this.isVisible = true;
        this.init();
    }

    init() {
        this.createButton();
        this.addStyles();
        this.bindEvents();
    }

    createButton() {
        // Create the floating button
        this.button = document.createElement('div');
        this.button.id = 'ehb-robot-button';
        this.button.innerHTML = `
            <div class="robot-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z" fill="currentColor"/>
                    <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15 11H9V9H15V11Z" fill="currentColor"/>
                </svg>
            </div>
            <div class="robot-tooltip">EHB Robot – Click to Chat</div>
        `;

        document.body.appendChild(this.button);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #ehb-robot-button {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
                transition: all 0.3s ease;
                z-index: 10000;
                color: white;
                font-size: 24px;
            }

            #ehb-robot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(76, 175, 80, 0.4);
            }

            #ehb-robot-button .robot-icon {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #ehb-robot-button .robot-tooltip {
                position: absolute;
                right: 70px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }

            #ehb-robot-button:hover .robot-tooltip {
                opacity: 1;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                #ehb-robot-button {
                    bottom: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                }

                #ehb-robot-button .robot-tooltip {
                    display: none;
                }
            }

            /* Animation for new messages */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            #ehb-robot-button.has-notification {
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        this.button.addEventListener('click', () => {
            this.openRobotModal();
        });

        // Add keyboard shortcut (Ctrl/Cmd + Shift + R)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.openRobotModal();
            }
        });
    }

    openRobotModal() {
        // Create and show the robot modal
        if (window.ehbRobotModal) {
            window.ehbRobotModal.show();
        } else {
            // Initialize modal if it doesn't exist
            window.ehbRobotModal = new EhbRobotModal();
            window.ehbRobotModal.show();
        }
    }

    showNotification() {
        this.button.classList.add('has-notification');
        setTimeout(() => {
            this.button.classList.remove('has-notification');
        }, 3000);
    }

    hide() {
        this.button.style.display = 'none';
        this.isVisible = false;
    }

    show() {
        this.button.style.display = 'flex';
        this.isVisible = true;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ehbRobotButton = new EhbRobotButton();
    });
} else {
    window.ehbRobotButton = new EhbRobotButton();
}
