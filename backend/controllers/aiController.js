const { getAIResponse, advancedAI } = require('../ai-core/gptRouter');
const { v4: uuidv4 } = require('uuid');

// Process voice/text input and generate AI response
exports.processVoiceText = async (req, res) => {
    try {
        const { message, context = {}, mode = 'standard' } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        let response;

        // Handle different modes
        switch (mode) {
            case 'telepathy':
                response = await advancedAI.predictIntent(message, context);
                break;

            case 'cross_service':
                const parsedCommand = await advancedAI.parseCrossServiceCommand(message);
                response = `Executing cross-service command: ${JSON.stringify(parsedCommand)}`;
                break;

            case 'personality':
                response = await advancedAI.updatePersonality(context);
                break;

            case 'multi_step':
                response = await advancedAI.planMultiStepTask(context.tasks);
                break;

            case 'legal':
                response = await advancedAI.generateLegalDocument(context.type, context.details);
                break;

            case 'developer':
                response = await advancedAI.generateCode(message, context.language);
                break;

            default:
                response = await getAIResponse(message, context);
        }

        // Add to conversation history
        advancedAI.addToHistory(message, response);

        res.json({
            success: true,
            response,
            timestamp: new Date().toISOString(),
            conversationId: uuidv4()
        });

    } catch (error) {
        console.error('AI Controller Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process request',
            message: error.message
        });
    }
};

// Handle advanced features
exports.handleAdvancedFeature = async (req, res) => {
    try {
        const { feature, data } = req.body;

        let response;

        switch (feature) {
            case 'telepathy_mode':
                response = await advancedAI.predictIntent(data.voicePattern, data.context);
                break;

            case 'voice_vault_store':
                // Store data in voice vault
                response = 'Data stored securely in voice vault';
                break;

            case 'voice_vault_retrieve':
                // Retrieve data from voice vault
                response = 'Data retrieved from voice vault';
                break;

            case 'personality_update':
                response = await advancedAI.updatePersonality(data);
                break;

            case 'cross_service_execute':
                response = await advancedAI.parseCrossServiceCommand(data.command);
                break;

            case 'multi_step_plan':
                response = await advancedAI.planMultiStepTask(data.tasks);
                break;

            case 'legal_document':
                response = await advancedAI.generateLegalDocument(data.type, data.details);
                break;

            case 'developer_code':
                response = await advancedAI.generateCode(data.description, data.language);
                break;

            default:
                response = 'Unknown advanced feature';
        }

        res.json({
            success: true,
            response,
            feature,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Advanced Feature Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process advanced feature',
            message: error.message
        });
    }
};

// Get conversation history
exports.getConversationHistory = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const history = advancedAI.conversationHistory
            .slice(-parseInt(limit))
            .map(entry => ({
                message: entry.message,
                response: entry.response,
                timestamp: entry.timestamp
            }));

        res.json({
            success: true,
            history,
            total: advancedAI.conversationHistory.length
        });

    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve conversation history'
        });
    }
};

// Get user preferences
exports.getUserPreferences = async (req, res) => {
    try {
        res.json({
            success: true,
            preferences: advancedAI.userPreferences
        });

    } catch (error) {
        console.error('Preferences Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user preferences'
        });
    }
};

// Update user preferences
exports.updateUserPreferences = async (req, res) => {
    try {
        const { preferences } = req.body;

        Object.assign(advancedAI.userPreferences, preferences);

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences: advancedAI.userPreferences
        });

    } catch (error) {
        console.error('Update Preferences Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
};

// Health check for AI service
exports.aiHealthCheck = async (req, res) => {
    try {
        // Test AI response
        const testResponse = await getAIResponse('Hello', { test: true });

        res.json({
            success: true,
            status: 'AI service is healthy',
            testResponse: testResponse.substring(0, 100) + '...',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI Health Check Error:', error);
        res.status(500).json({
            success: false,
            status: 'AI service is unhealthy',
            error: error.message
        });
    }
};
