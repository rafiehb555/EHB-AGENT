interface EmotionContext {
    userEmotion: 'happy' | 'sad' | 'angry' | 'neutral' | 'excited' | 'frustrated';
    situation: 'order' | 'complaint' | 'inquiry' | 'thanks' | 'greeting' | 'farewell';
    urgency: 'low' | 'medium' | 'high';
    language: 'english' | 'urdu';
}

interface EmotionalResponse {
    message: string;
    emoji: string;
    tone: 'friendly' | 'professional' | 'empathetic' | 'enthusiastic' | 'apologetic';
    followUp?: string;
}

class RobotEmotionEngine {
    private emotionTemplates: Map<string, EmotionalResponse[]> = new Map();

    constructor() {
        this.initializeEmotionTemplates();
        console.log('😊 Emotion Engine initialized');
    }

    private initializeEmotionTemplates() {
        // Happy responses
        this.emotionTemplates.set('happy_order', [
            {
                message: 'Great choice! I\'ll get that ordered for you right away.',
                emoji: '😄',
                tone: 'enthusiastic',
                followUp: 'Is there anything else you\'d like to add?'
            },
            {
                message: 'Perfect! Your order is being processed.',
                emoji: '✅',
                tone: 'friendly',
                followUp: 'You\'ll receive a confirmation shortly.'
            }
        ]);

        this.emotionTemplates.set('happy_thanks', [
            {
                message: 'You\'re very welcome! It\'s always a pleasure to help.',
                emoji: '😊',
                tone: 'friendly'
            },
            {
                message: 'Thank you for choosing us! We appreciate your business.',
                emoji: '🙏',
                tone: 'professional'
            }
        ]);

        // Sad responses
        this.emotionTemplates.set('sad_complaint', [
            {
                message: 'I\'m really sorry to hear that. Let me help you resolve this immediately.',
                emoji: '😞',
                tone: 'empathetic',
                followUp: 'Can you tell me more about what happened?'
            },
            {
                message: 'That\'s disappointing and I understand your frustration.',
                emoji: '😔',
                tone: 'apologetic',
                followUp: 'I\'ll make sure this gets sorted out right away.'
            }
        ]);

        // Angry responses
        this.emotionTemplates.set('angry_complaint', [
            {
                message: 'I completely understand your frustration and I\'m here to fix this right now.',
                emoji: '😤',
                tone: 'apologetic',
                followUp: 'Let me escalate this to our priority support team.'
            },
            {
                message: 'This is unacceptable and I\'m taking immediate action to resolve it.',
                emoji: '⚡',
                tone: 'professional',
                followUp: 'You\'ll hear from our manager within 10 minutes.'
            }
        ]);

        // Neutral responses
        this.emotionTemplates.set('neutral_inquiry', [
            {
                message: 'I\'d be happy to help you with that.',
                emoji: '🤖',
                tone: 'professional'
            },
            {
                message: 'Let me check that information for you.',
                emoji: '🔍',
                tone: 'friendly'
            }
        ]);

        // Excited responses
        this.emotionTemplates.set('excited_order', [
            {
                message: 'Awesome! I can feel your excitement and I\'m thrilled to help!',
                emoji: '🎉',
                tone: 'enthusiastic',
                followUp: 'This is going to be amazing!'
            },
            {
                message: 'Fantastic choice! I\'m so excited to process this for you!',
                emoji: '🚀',
                tone: 'enthusiastic'
            }
        ]);

        // Frustrated responses
        this.emotionTemplates.set('frustrated_complaint', [
            {
                message: 'I can see this has been really frustrating for you, and I\'m here to make it right.',
                emoji: '😤',
                tone: 'empathetic',
                followUp: 'Let\'s get this sorted out together.'
            },
            {
                message: 'I understand your frustration completely. Let me take care of this immediately.',
                emoji: '⚡',
                tone: 'apologetic',
                followUp: 'I won\'t let you down this time.'
            }
        ]);

        // Urdu responses
        this.emotionTemplates.set('urdu_happy', [
            {
                message: 'بہت اچھا! میں آپ کی مدد کرنے کے لیے تیار ہوں۔',
                emoji: '😊',
                tone: 'friendly'
            },
            {
                message: 'شکریہ! آپ کا انتخاب بہترین ہے۔',
                emoji: '🙏',
                tone: 'professional'
            }
        ]);

        this.emotionTemplates.set('urdu_sad', [
            {
                message: 'میں واقعی افسوس کرتا ہوں۔ آئیے اس کو ٹھیک کرتے ہیں۔',
                emoji: '😞',
                tone: 'empathetic'
            },
            {
                message: 'مجھے آپ کی تکلیف کا احساس ہے۔ میں فوراً کارروائی کروں گا۔',
                emoji: '😔',
                tone: 'apologetic'
            }
        ]);

        this.emotionTemplates.set('urdu_angry', [
            {
                message: 'میں آپ کی ناراضگی سمجھتا ہوں۔ یہ ناقابل قبول ہے اور میں فوراً حل کروں گا۔',
                emoji: '😤',
                tone: 'apologetic'
            },
            {
                message: 'آپ کا غصہ بالکل درست ہے۔ میں ابھی اس مسئلے کو حل کرتا ہوں۔',
                emoji: '⚡',
                tone: 'professional'
            }
        ]);
    }

    // Generate emotional response
    generateResponse(context: EmotionContext, customMessage?: string): EmotionalResponse {
        try {
            const key = this.generateEmotionKey(context);
            const templates = this.emotionTemplates.get(key) || this.emotionTemplates.get('neutral_inquiry')!;

            // Select random template from matching ones
            const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

            // If custom message provided, use it with the template's emotion
            if (customMessage) {
                return {
                    message: customMessage,
                    emoji: selectedTemplate.emoji,
                    tone: selectedTemplate.tone,
                    followUp: selectedTemplate.followUp
                };
            }

            return selectedTemplate;
        } catch (error) {
            console.error('Generate response error:', error);
            return {
                message: 'I\'m here to help you.',
                emoji: '🤖',
                tone: 'professional'
            };
        }
    }

    // Generate emotion key for template lookup
    private generateEmotionKey(context: EmotionContext): string {
        const { userEmotion, situation, language } = context;

        if (language === 'urdu') {
            return `urdu_${userEmotion}`;
        }

        return `${userEmotion}_${situation}`;
    }

    // Detect emotion from text
    detectEmotion(text: string): 'happy' | 'sad' | 'angry' | 'neutral' | 'excited' | 'frustrated' {
        const textLower = text.toLowerCase();

        // Happy indicators
        const happyWords = [
            'thanks', 'thank you', 'great', 'good', 'awesome', 'perfect', 'love', 'amazing',
            'wonderful', 'excellent', 'fantastic', 'brilliant', 'super', 'nice', 'happy',
            'شکریہ', 'بہت اچھا', 'عمدہ', 'بہترین', 'واہ'
        ];

        // Sad indicators
        const sadWords = [
            'sorry', 'sad', 'disappointed', 'unhappy', 'bad', 'terrible', 'upset',
            'depressed', 'miserable', 'heartbroken', 'crying',
            'افسوس', 'دکھ', 'برا', 'بہت برا', 'غمگین'
        ];

        // Angry indicators
        const angryWords = [
            'angry', 'mad', 'furious', 'hate', 'terrible', 'awful', 'horrible',
            'rage', 'outrage', 'fuming', 'livid', 'irritated', 'annoyed',
            'غصہ', 'ناراض', 'برا', 'بہت برا', 'پاگل'
        ];

        // Excited indicators
        const excitedWords = [
            'excited', 'thrilled', 'ecstatic', 'overjoyed', 'elated', 'delighted',
            'can\'t wait', 'looking forward', 'amazing', 'incredible',
            'بہت خوش', 'بہت اچھا', 'واہ', 'عمدہ'
        ];

        // Frustrated indicators
        const frustratedWords = [
            'frustrated', 'annoyed', 'irritated', 'fed up', 'tired of', 'sick of',
            'had enough', 'can\'t take it', 'over it',
            'پریشان', 'تھک گیا', 'بہت ہو گیا'
        ];

        // Check for emotion words
        if (excitedWords.some(word => textLower.includes(word))) {
            return 'excited';
        }

        if (happyWords.some(word => textLower.includes(word))) {
            return 'happy';
        }

        if (frustratedWords.some(word => textLower.includes(word))) {
            return 'frustrated';
        }

        if (sadWords.some(word => textLower.includes(word))) {
            return 'sad';
        }

        if (angryWords.some(word => textLower.includes(word))) {
            return 'angry';
        }

        return 'neutral';
    }

    // Detect situation from text
    detectSituation(text: string): 'order' | 'complaint' | 'inquiry' | 'thanks' | 'greeting' | 'farewell' {
        const textLower = text.toLowerCase();

        if (textLower.includes('order') || textLower.includes('buy') || textLower.includes('purchase')) {
            return 'order';
        }

        if (textLower.includes('complaint') || textLower.includes('problem') || textLower.includes('issue') ||
            textLower.includes('wrong') || textLower.includes('broken') || textLower.includes('not working')) {
            return 'complaint';
        }

        if (textLower.includes('thanks') || textLower.includes('thank you') || textLower.includes('شکریہ')) {
            return 'thanks';
        }

        if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('سلام')) {
            return 'greeting';
        }

        if (textLower.includes('bye') || textLower.includes('goodbye') || textLower.includes('اللہ حافظ')) {
            return 'farewell';
        }

        return 'inquiry';
    }

    // Detect urgency from text
    detectUrgency(text: string): 'low' | 'medium' | 'high' {
        const textLower = text.toLowerCase();

        const highUrgencyWords = [
            'urgent', 'emergency', 'immediately', 'right now', 'asap', 'critical',
            'فوری', 'جلدی', 'ابھی', 'ضروری'
        ];

        const mediumUrgencyWords = [
            'soon', 'quickly', 'fast', 'hurry', 'quick',
            'جلد', 'تیزی سے', 'فوراً'
        ];

        if (highUrgencyWords.some(word => textLower.includes(word))) {
            return 'high';
        }

        if (mediumUrgencyWords.some(word => textLower.includes(word))) {
            return 'medium';
        }

        return 'low';
    }

    // Detect language from text
    detectLanguage(text: string): 'english' | 'urdu' {
        const urduPattern = /[\u0600-\u06FF]/;
        if (urduPattern.test(text)) {
            return 'urdu';
        }
        return 'english';
    }

    // Generate contextual response
    generateContextualResponse(userInput: string, customMessage?: string): EmotionalResponse {
        const emotion = this.detectEmotion(userInput);
        const situation = this.detectSituation(userInput);
        const urgency = this.detectUrgency(userInput);
        const language = this.detectLanguage(userInput);

        const context: EmotionContext = {
            userEmotion: emotion,
            situation,
            urgency,
            language
        };

        return this.generateResponse(context, customMessage);
    }

    // Generate greeting response
    generateGreeting(userName?: string): EmotionalResponse {
        const greetings = [
            {
                message: `Hello${userName ? ` ${userName}` : ''}! How can I help you today?`,
                emoji: '👋',
                tone: 'friendly'
            },
            {
                message: `Hi${userName ? ` ${userName}` : ''}! I\'m here to assist you.`,
                emoji: '🤖',
                tone: 'professional'
            },
            {
                message: `Welcome${userName ? ` ${userName}` : ''}! What can I do for you?`,
                emoji: '😊',
                tone: 'friendly'
            }
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Generate farewell response
    generateFarewell(): EmotionalResponse {
        const farewells = [
            {
                message: 'Have a great day! Feel free to reach out if you need anything else.',
                emoji: '👋',
                tone: 'friendly'
            },
            {
                message: 'Take care! I\'m always here when you need me.',
                emoji: '😊',
                tone: 'friendly'
            },
            {
                message: 'Goodbye! Thank you for choosing our service.',
                emoji: '🙏',
                tone: 'professional'
            }
        ];

        return farewells[Math.floor(Math.random() * farewells.length)];
    }

    // Generate confirmation response
    generateConfirmation(action: string): EmotionalResponse {
        const confirmations = [
            {
                message: `Perfect! I've ${action} for you.`,
                emoji: '✅',
                tone: 'enthusiastic'
            },
            {
                message: `Great! Your ${action} has been completed.`,
                emoji: '🎉',
                tone: 'friendly'
            },
            {
                message: `Excellent! I've taken care of your ${action}.`,
                emoji: '👍',
                tone: 'professional'
            }
        ];

        return confirmations[Math.floor(Math.random() * confirmations.length)];
    }

    // Generate error response
    generateErrorResponse(error: string): EmotionalResponse {
        const errorResponses = [
            {
                message: `I'm sorry, but I encountered an issue: ${error}. Let me try a different approach.`,
                emoji: '😔',
                tone: 'apologetic'
            },
            {
                message: `Unfortunately, there was a problem: ${error}. I'll help you resolve this.`,
                emoji: '⚠️',
                tone: 'professional'
            },
            {
                message: `I apologize for the inconvenience. ${error}. Let me fix this for you.`,
                emoji: '😞',
                tone: 'apologetic'
            }
        ];

        return errorResponses[Math.floor(Math.random() * errorResponses.length)];
    }

    // Generate suggestion response
    generateSuggestionResponse(suggestion: string): EmotionalResponse {
        return {
            message: `Here's a suggestion: ${suggestion}`,
            emoji: '💡',
            tone: 'friendly'
        };
    }

    // Generate reminder response
    generateReminderResponse(reminder: string): EmotionalResponse {
        return {
            message: `⏰ Reminder: ${reminder}`,
            emoji: '⏰',
            tone: 'friendly'
        };
    }
}

export default RobotEmotionEngine;
